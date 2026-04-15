"use server";
import "server-only";
import { serverRequest } from "./serverRequest";

export async function getVisitedRealms(access_token: string) {
  const { response: profileRes, data: profileData } = await serverRequest(
    "/profiles/me",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    },
  );
  if (!profileRes?.ok || !profileData || typeof profileData !== "object") {
    return { data: null, error: { message: "Invalid token" } };
  }

  const profile = profileData as { visited_realms?: string[] };
  const shareIds: string[] = profile.visited_realms || [];
  const visitedRealms: any[] = [];
  const realmsToRemove: string[] = [];

  for (const shareId of shareIds) {
    const { response: res, data } = await serverRequest(
      `/realms/by-share/${shareId}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    if (res?.ok && data && typeof data === "object") {
      const realm = data as { id?: string; name?: string; share_id?: string };
      visitedRealms.push({
        id: realm.id,
        name: realm.name,
        share_id: realm.share_id,
      });
    } else {
      realmsToRemove.push(shareId);
    }
  }

  if (realmsToRemove.length > 0) {
    const updated = shareIds.filter((s: string) => !realmsToRemove.includes(s));
    await serverRequest("/profiles/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ visited_realms: updated }),
    });
  }

  return { data: visitedRealms, error: null };
}
