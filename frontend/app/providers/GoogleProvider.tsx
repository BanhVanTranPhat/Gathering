"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

type GoogleProviderProps = {
  children: React.ReactNode;
};

export default function GoogleProvider({ children }: GoogleProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  if (!clientId) return <>{children}</>;
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
