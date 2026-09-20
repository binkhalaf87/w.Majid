import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/webhook" || pathname === "/api/health") return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") return new NextResponse("ADMIN_PASSWORD is required", { status: 503 });
    return NextResponse.next();
  }

  const expectedUser = process.env.ADMIN_USERNAME || "majid";
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const [user, suppliedPassword] = atob(authorization.slice(6)).split(":");
      if (user === expectedUser && suppliedPassword === password) return NextResponse.next();
    } catch {}
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="WhatsApp Majid", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
