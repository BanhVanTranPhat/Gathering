"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/utils/backendApi";

function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_SOCKET_URL)
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  try {
    const apiUrl = new URL(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001",
    );
    apiUrl.port = "5002";
    return apiUrl.toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:5002";
  }
}

const SOCKET_URL = getSocketUrl();

export type LobbyMessage = {
  id: string;
  uid: string;
  username: string;
  message: string;
  timestamp: number;
};

export function useLobbyChat(uid: string | null, displayName?: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;
    socketRef.current?.emit("sendLobbyMessage", { message: message.trim() });
  }, []);

  useEffect(() => {
    if (!uid) return;
    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      transportOptions: {
        polling: { extraHeaders: { Authorization: `Bearer ${token}` } },
      },
      query: { uid },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinLobby", { displayName: displayName || undefined });
    });

    socket.on("lobbyHistory", (history: LobbyMessage[]) => {
      setMessages(Array.isArray(history) ? history : []);
    });

    socket.on("lobbyMessage", (msg: LobbyMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    return () => {
      socket
        .off("connect")
        .off("lobbyHistory")
        .off("lobbyMessage")
        .off("disconnect")
        .off("connect_error");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [uid, displayName]);

  return { connected, messages, sendMessage };
}
