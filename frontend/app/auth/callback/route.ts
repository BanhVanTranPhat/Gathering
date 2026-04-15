import { NextResponse } from "next/server"

/** Auth callback redirect về app. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  return NextResponse.redirect(`${origin}/app`)
}
