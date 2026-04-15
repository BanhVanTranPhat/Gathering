"use server";
import "server-only";
import { serverRequest } from "./serverRequest";

export async function getPlayRealmData(accessToken: string, shareId: string) {
  const { response: userRes, data: userData } = await serverRequest(
    "/auth/me",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!userRes?.ok || !userData || typeof userData !== "object") {
    return { data: null, error: { message: "Invalid token" } };
  }
  const user = userData as { id?: string };

  const { response: res, data: realmData } = await serverRequest(
    `/realms/by-share/${shareId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res?.ok || !realmData || typeof realmData !== "object") {
    return { data: null, error: { message: "Realm not found" } };
  }
  const realm = realmData as { owner_id?: string; only_owner?: boolean };

  if (realm.owner_id === user.id) return { data: realm, error: null };
  if (realm.only_owner) return { data: null, error: { message: "only owner" } };
  return { data: realm, error: null };
}
