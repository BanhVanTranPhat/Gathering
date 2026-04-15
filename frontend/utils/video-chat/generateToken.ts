"use server";

import { serverRequest } from "@/utils/backend/serverRequest";

/** Không dùng Agora; trả về null (voice/video tắt). Token từ client (localStorage) để tránh import next/headers vào client bundle. */
export async function generateToken(
  channelName: string,
  accessToken: string | null,
) {
  if (
    !process.env.NEXT_PUBLIC_AGORA_APP_ID ||
    !process.env.APP_CERTIFICATE ||
    !accessToken
  ) {
    return null;
  }
  const { response } = await serverRequest("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response?.ok) return null;

  try {
    const { RtcRole, RtcTokenBuilder } = await import("agora-token");
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.APP_CERTIFICATE;
    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expireTime = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expiredTs = currentTimestamp + expireTime;
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      expiredTs,
      expiredTs,
    );
    return token;
  } catch {
    return null;
  }
}
