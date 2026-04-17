import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/app", "/home", "/admin", "/profile", "/play"];

export const updateSession = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("gathering_token")?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request: { headers: request.headers },
  });
};
