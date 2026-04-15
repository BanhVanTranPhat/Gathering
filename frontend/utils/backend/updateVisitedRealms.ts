"use server";
import "server-only";
import revalidate from "../revalidate";
import { serverRequest } from "./serverRequest";

export async function updateVisitedRealms(
  accessToken: string,
  shareId: string,
) {
  const { response: profileRes, data: profileData } = await serverRequest(
    "/profiles/me",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!profileRes?.ok || !profileData || typeof profileData !== "object")
    return;

  const profile = profileData as { visited_realms?: string[] };
  const visitedRealms = profile.visited_realms || [];
  if (visitedRealms.includes(shareId)) return;

  const updated = [...visitedRealms, shareId];
  await serverRequest("/profiles/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ visited_realms: updated }),
  });
  revalidate("/app");
}
