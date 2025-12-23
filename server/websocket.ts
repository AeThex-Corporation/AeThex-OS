import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { storage } from "./storage.js";

interface SocketData {
  userId?: string;
  isAdmin?: boolean;
}

export function setupWebSocket(httpServer: Server) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io"
  });

  io.on("connection", async (socket: Socket) => {
    console.log("Socket.IO client connected:", socket.id);

    // Send initial connection message
    socket.emit("connected", {
      message: "AeThex OS WebSocket connected",
      timestamp: new Date().toISOString()
    });

    // Handle authentication
    socket.on("auth", async (data: { userId: string; isAdmin?: boolean }) => {
      const socketData = socket.data as SocketData;
      socketData.userId = data.userId;
      socketData.isAdmin = data.isAdmin || false;
      
      socket.emit("auth_success", {
        userId: data.userId,
        timestamp: new Date().toISOString()
      });

      // Join user-specific room
      socket.join(`user:${data.userId}`);
      
      if (data.isAdmin) {
        socket.join("admins");
      }

      // Send initial data after auth
      await sendInitialData(socket, socketData);
    });

    // Send initial notifications and alerts
    try {
      const [metrics, alerts, achievements] = await Promise.all([
        storage.getMetrics(),
        storage.getAlerts(),
        storage.getAchievements()
      ]);
      
      socket.emit("metrics", metrics);
      socket.emit("alerts", alerts.filter(a => !a.is_resolved).slice(0, 5));
      socket.emit("achievements", achievements.slice(0, 10));
    } catch (error) {
      console.error("Error sending initial data:", error);
    }

    // Listen for alert resolution events
    socket.on("resolveAlert", async (alertId: string) => {
      try {
        await storage.updateAlert(alertId, { is_resolved: true, resolved_at: new Date() });
        const alerts = await storage.getAlerts();
        io.to("admins").emit("alerts", alerts.filter(a => !a.is_resolved));
        io.to("admins").emit("alert_resolved", { alertId, timestamp: new Date().toISOString() });
      } catch (error) {
        console.error("Error resolving alert:", error);
        socket.emit("error", { message: "Failed to resolve alert" });
      }
    });

    // Listen for request to refresh notifications
    socket.on("refreshNotifications", async () => {
      try {
        const metrics = await storage.getMetrics();
        socket.emit("notifications", [
          { id: 1, message: `${metrics.totalProfiles} architects in network`, type: 'info' },
          { id: 2, message: `${metrics.totalProjects} active projects`, type: 'info' },
          { id: 3, message: 'Aegis security active', type: 'success' }
        ]);
      } catch (error) {
        console.error("Error refreshing notifications:", error);
      }
    });

    // Listen for metrics refresh
    socket.on("refreshMetrics", async () => {
      try {
        const metrics = await storage.getMetrics();
        socket.emit("metrics", metrics);
      } catch (error) {
        console.error("Error refreshing metrics:", error);
      }
    });

    // Listen for achievements refresh
    socket.on("refreshAchievements", async () => {
      try {
        const achievements = await storage.getAchievements();
        socket.emit("achievements", achievements);
      } catch (error) {
        console.error("Error refreshing achievements:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO client disconnected:", socket.id);
    });
  });

  // Start periodic updates
  startPeriodicUpdates(io);

  return io;
}

async function sendInitialData(socket: Socket, socketData: SocketData) {
  try {
    // Send recent alerts if admin
    if (socketData.isAdmin) {
      const alerts = await storage.getAlerts();
      const unresolved = alerts.filter(a => !a.is_resolved).slice(0, 5);
      socket.emit("admin_alerts", unresolved);
    }

    // Send metrics
    const metrics = await storage.getMetrics();
    socket.emit("metrics_update", metrics);

    // Send recent achievements
    const achievements = await storage.getAchievements();
    socket.emit("achievements_update", achievements.slice(0, 10));
  } catch (error) {
    console.error("Error sending initial data:", error);
  }
}

function startPeriodicUpdates(io: SocketIOServer) {
  // Send metrics updates every 30 seconds
  setInterval(async () => {
    try {
      const metrics = await storage.getMetrics();
      io.emit("metrics_update", metrics);
    } catch (error) {
      console.error("Error broadcasting metrics:", error);
    }
  }, 30000);

  // Check for new alerts every 10 seconds
  let lastAlertCheck = new Date();
  setInterval(async () => {
    try {
      const alerts = await storage.getAlerts();
      const newAlerts = alerts.filter(a => 
        !a.is_resolved && 
        new Date(a.created_at) > lastAlertCheck
      );

      if (newAlerts.length > 0) {
        io.to("admins").emit("new_alerts", {
          alerts: newAlerts,
          count: newAlerts.length,
          timestamp: new Date().toISOString()
        });
      }

      lastAlertCheck = new Date();
    } catch (error) {
      console.error("Error broadcasting alerts:", error);
    }
  }, 10000);
}

// Export helper functions for triggering broadcasts
export const websocket = {
  io: null as SocketIOServer | null,

  setIO(ioInstance: SocketIOServer) {
    this.io = ioInstance;
  },

  // Helper to notify about new achievements
  notifyAchievement(userId: string, achievement: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit("achievement_unlocked", {
        data: achievement,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Helper to notify about new alerts
  notifyAlert(alert: any) {
    if (this.io) {
      this.io.to("admins").emit("alert", {
        data: alert,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Helper to notify about system events
  notifySystem(message: string, severity: "info" | "warning" | "error" = "info") {
    if (this.io) {
      this.io.emit("system_notification", {
        message,
        severity,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Broadcast to all clients
  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
};
