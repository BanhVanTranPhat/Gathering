"use server";
import "server-only";
import { RealmData } from "../pixi/types";
import { RealmDataSchema } from "../pixi/zod";
import { formatForComparison, removeExtraSpaces } from "../removeExtraSpaces";
import { serverRequest } from "./serverRequest";

export async function saveRealm(
  access_token: string,
  realmData: RealmData,
  id: string,
) {
  const result = RealmDataSchema.safeParse(realmData);
  if (result.success === false) {
    return { error: { message: "Invalid realm data." } };
  }

  if (realmData.rooms.length === 0) {
    return { error: { message: "A realm must have at least one room." } };
  }

  if (realmData.rooms.length > 50) {
    return { error: { message: "A realm cannot have more than 50 rooms." } };
  }

  const roomNames = new Set<string>();
  for (let roomIndex = 0; roomIndex < realmData.rooms.length; roomIndex++) {
    const room = realmData.rooms[roomIndex];
    if (Object.keys(room.tilemap).length > 10_000) {
      return { error: { message: "This room is too big to save!" } };
    }
    const roomName = formatForComparison(room.name);
    if (roomNames.has(roomName)) {
      return { error: { message: "Room names must be unique." } };
    }
    if (roomName.trim() === "") {
      return { error: { message: "Room name cannot be empty." } };
    }
    if (roomName.length > 32) {
      return {
        error: { message: "Room names cannot be longer than 32 characters." },
      };
    }
    for (const tile of Object.values(room.tilemap)) {
      const targetRoom = tile.teleporter?.roomIndex;
      if (
        typeof targetRoom === "number" &&
        (targetRoom < 0 || targetRoom >= realmData.rooms.length)
      ) {
        return {
          error: {
            message: `Invalid teleporter target in room ${roomIndex + 1}.`,
          },
        };
      }
    }
    roomNames.add(roomName);
    room.name = removeExtraSpaces(room.name, true);
  }

  const { response: res, data } = await serverRequest(`/realms/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ map_data: realmData }),
  });

  if (!res?.ok) {
    return { error: { message: (data as any).message || "Save failed" } };
  }
  return { error: null };
}
