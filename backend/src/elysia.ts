import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { connectDb } from "./db";
import { apiRoutes } from "./elysia/routes";
import { sessionManager } from "./session";
import { sockets } from "./sockets/sockets";
import { setSocketServer } from "./realtime/socketServer";
import { processEventReminders } from "./utils/eventReminders";
import { verifyToken } from "./utils/auth";

const PORT = Number(process.env.PORT) || 5001;
const SOCKET_PORT = Number(process.env.SOCKET_PORT) || 5002;

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    }),
  )
  .get("/health", () => ({ status: "ok", runtime: "Bun" }))
  .get("/getPlayerCounts", ({ query }) => {
    const realmIds = ((query.realmIds as string) || "").split(",");
    const counts = realmIds.map((id) => {
      const session = sessionManager.getSession(id);
      return session ? session.getPlayerCount() : 0;
    });
    return { playerCounts: counts };
  })
  .get("/getPlayersInRoom", ({ headers, query, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { message: "Missing token" };
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user?.id) {
      set.status = 401;
      return { message: "Invalid token" };
    }

    const session = sessionManager.getPlayerSession(user.id);
    if (!session) {
      return { players: [] };
    }

    const requestedRoom = Number(query.roomIndex);
    const roomIndex = Number.isFinite(requestedRoom)
      ? requestedRoom
      : session.getPlayerRoom(user.id);

    const players = session.getPlayersInRoom(roomIndex).map((p) => ({
      uid: p.uid,
      username: p.username,
      x: p.x,
      y: p.y,
      room: p.room,
      skin: p.skin,
      avatarConfig: p.avatarConfig,
    }));

    return { players };
  })
  .use(apiRoutes);

const server = app.listen(PORT);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

// Integrate Socket.io with Bun server via http module on a separate port
const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});
setSocketServer(io);

connectDb()
  .then(() => {
    sockets(io);
    httpServer.once("error", (error: any) => {
      if (error?.code === "EADDRINUSE") {
        console.warn(
          `⚠️ Socket.io port ${SOCKET_PORT} is already in use. Reusing existing socket server or stop the old process.`,
        );
        return;
      }
      throw error;
    });
    httpServer.listen(SOCKET_PORT, () => {
      console.log(`🚀 Socket.io initialized on port ${SOCKET_PORT}`);
    });

    processEventReminders().catch((error) => {
      console.error("[Event Reminders] Initial run failed:", error);
    });

    setInterval(
      () => {
        processEventReminders().catch((error) => {
          console.error("[Event Reminders] Scheduled run failed:", error);
        });
      },
      5 * 60 * 1000,
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

export type App = typeof app;
