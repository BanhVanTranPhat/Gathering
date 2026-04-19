import type { Server as SocketIOServer } from "socket.io";

let socketServer: SocketIOServer | null = null;

export function setSocketServer(server: SocketIOServer) {
  socketServer = server;
}

export function getSocketServer() {
  return socketServer;
}
