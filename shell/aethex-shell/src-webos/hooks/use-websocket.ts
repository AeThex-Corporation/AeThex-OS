import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth";

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  severity?: "info" | "warning" | "error";
  timestamp: string;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  metrics: any | null;
  alerts: any[];
  achievements: any[];
  notifications: any[];
  sendMessage: (event: string, data: any) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    const socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setConnected(true);

      // Authenticate if user is logged in
      if (user) {
        socket.emit("auth", {
          userId: user.id,
          isAdmin: user.isAdmin
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    });

    socket.on("connected", (data: any) => {
      console.log("WebSocket handshake:", data.message);
    });

    socket.on("auth_success", (data: any) => {
      console.log("WebSocket authenticated:", data.userId);
    });

    // Listen for metrics updates
    socket.on("metrics", (data: any) => {
      setMetrics(data);
    });

    socket.on("metrics_update", (data: any) => {
      setMetrics(data);
    });

    // Listen for alerts
    socket.on("alerts", (data: any) => {
      setAlerts(Array.isArray(data) ? data : []);
    });

    socket.on("admin_alerts", (data: any) => {
      setAlerts(Array.isArray(data) ? data : []);
    });

    socket.on("new_alerts", (data: any) => {
      if (data.alerts && Array.isArray(data.alerts)) {
        setAlerts((prev) => [...data.alerts, ...prev].slice(0, 10));
        
        // Show notification
        if (data.count > 0) {
          setNotifications((prev) => [
            {
              id: Date.now(),
              message: `${data.count} new alert${data.count > 1 ? 's' : ''}`,
              type: 'warning',
              timestamp: data.timestamp
            },
            ...prev
          ].slice(0, 5));
        }
      }
    });

    socket.on("alert_resolved", (data: any) => {
      setAlerts((prev) => prev.filter(a => a.id !== data.alertId));
    });

    // Listen for achievements
    socket.on("achievements", (data: any) => {
      setAchievements(Array.isArray(data) ? data : []);
    });

    socket.on("achievements_update", (data: any) => {
      setAchievements(Array.isArray(data) ? data : []);
    });

    socket.on("achievement_unlocked", (data: any) => {
      if (data.data) {
        setAchievements((prev) => [data.data, ...prev]);
        setNotifications((prev) => [
          {
            id: Date.now(),
            message: `Achievement unlocked: ${data.data.name}`,
            type: 'success',
            timestamp: data.timestamp
          },
          ...prev
        ].slice(0, 5));
      }
    });

    // Listen for notifications
    socket.on("notifications", (data: any) => {
      setNotifications(Array.isArray(data) ? data : []);
    });

    socket.on("system_notification", (data: any) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          message: data.message,
          type: data.severity || 'info',
          timestamp: data.timestamp
        },
        ...prev
      ].slice(0, 5));
    });

    socket.on("alert", (data: any) => {
      if (data.data) {
        setAlerts((prev) => [data.data, ...prev]);
        setNotifications((prev) => [
          {
            id: Date.now(),
            message: `New alert: ${data.data.message}`,
            type: 'warning',
            timestamp: data.timestamp
          },
          ...prev
        ].slice(0, 5));
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [user]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    connected,
    metrics,
    alerts,
    achievements,
    notifications,
    sendMessage
  };
}
