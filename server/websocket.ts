import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getAlerts, getNotifications } from "./storage";

export function setupWebSocket(httpServer: Server) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Send initial notifications and alerts
    Promise.all([getNotifications(), getAlerts()]).then(([notifications, alerts]) => {
      socket.emit("notifications", notifications);
      socket.emit("alerts", alerts);
    });

    // Listen for alert resolution events
    socket.on("resolveAlert", async (alertId) => {
      // You'd call your alert resolution logic here
      // After resolving, broadcast updated alerts
      const alerts = await getAlerts();
      io.emit("alerts", alerts);
    });

    // Listen for request to refresh notifications
    socket.on("refreshNotifications", async () => {
      const notifications = await getNotifications();
      socket.emit("notifications", notifications);
    });
  });

  return io;
}
