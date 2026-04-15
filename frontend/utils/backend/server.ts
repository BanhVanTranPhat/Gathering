import io, { Socket } from "socket.io-client";
import { createClient } from "../auth/client";
import { api } from "../backendApi";

type ConnectionResponse = {
  success: boolean;
  errorMessage: string;
  savedPosition?: { x: number; y: number; room: number } | null;
};

type PlayersInRoomResponse = {
  players: Array<{ uid: string; [key: string]: any }>;
};

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

const socket_url: string = getSocketUrl();

class Server {
  public socket: Socket = {} as Socket;
  private connected: boolean = false;

  public async connect(
    realmId: string,
    uid: string,
    shareId: string,
    access_token: string,
  ) {
    this.socket = io(socket_url, {
      reconnection: true,
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      },
      query: {
        uid,
      },
    });

    return new Promise<ConnectionResponse>((resolve, reject) => {
      this.socket.connect();

      this.socket.on("connect", () => {
        this.connected = true;

        this.socket.emit("joinRealm", {
          realmId,
          shareId,
        });
      });

      this.socket.on(
        "joinedRealm",
        (data?: {
          savedPosition?: { x: number; y: number; room: number } | null;
        }) => {
          resolve({
            success: true,
            errorMessage: "",
            savedPosition: data?.savedPosition ?? null,
          });
        },
      );

      this.socket.on("failedToJoinRoom", (reason: string) => {
        resolve({
          success: false,
          errorMessage: reason,
        });
      });

      this.socket.on("connect_error", (err: any) => {
        console.error("Connection error:", err);
        resolve({
          success: false,
          errorMessage: err.message,
        });
      });
    });
  }

  public disconnect() {
    if (this.connected) {
      this.connected = false;
      this.socket.disconnect();
    }
  }

  public async getPlayersInRoom(roomIndex: number) {
    const auth = createClient();
    const {
      data: { session },
    } = await auth.auth.getSession();
    if (!session)
      return { data: null, error: { message: "No session provided" } };

    return api
      .getWithToken<PlayersInRoomResponse>(
        `/getPlayersInRoom?${new URLSearchParams({ roomIndex: String(roomIndex) }).toString()}`,
        session.access_token,
      )
      .then((data) => ({ data, error: null as any }))
      .catch((error) => ({ data: null, error }));
  }
}

const server = new Server();

export { server };
