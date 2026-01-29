import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: './.env' });

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import { setupWebSocket, websocket } from "./websocket.js";
import { attachOrgContext, requireOrgMember } from "./org-middleware.js";

const app = express();
const httpServer = createServer(app);

// Health check for Railway/monitoring
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API status endpoint (moved from root to /api/status)
app.get("/api/status", (_req, res) => {
  res.json({
    status: "AeThex OS Kernel: ONLINE",
    version: "1.0.0",
    endpoints: {
      link: "/api/os/link/*",
      entitlements: "/api/os/entitlements/*",
      subjects: "/api/os/subjects/*"
    }
  });
});

// Trust proxy for proper cookie handling behind Vite dev server
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Require session secret in production
const sessionSecret = process.env.SESSION_SECRET;
if (process.env.NODE_ENV === "production" && !sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

// Session configuration with security best practices
const isProduction = process.env.NODE_ENV === "production";
app.use(
  session({
    secret: sessionSecret || "dev-only-secret-not-for-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    proxy: true, // Always trust proxy (Replit uses reverse proxy in both dev and prod)
  })
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});


(async () => {
  // Register routes (org middleware applied selectively within routes.ts)
  await registerRoutes(httpServer, app);

  // Setup WebSocket server for real-time notifications and Aegis alerts
  const io = setupWebSocket(httpServer);
  websocket.setIO(io);
  log("WebSocket server initialized", "websocket");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    port,
    () => {
      log(`serving on port ${port}`);
      log(`WebSocket available at ws://localhost:${port}/socket.io`, "websocket");
    },
  );
})();
