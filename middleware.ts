import { NextRequest, NextResponse } from "next/server";

// Protects /admin with HTTP Basic Auth (user + password from env vars)
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER ?? "admin";
  const pass = process.env.ADMIN_PASSWORD;

  if (!pass) {
    return new NextResponse("Configurá ADMIN_PASSWORD para habilitar el panel.", {
      status: 503,
    });
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const [u, p] = atob(header.slice(6)).split(":");
    if (u === user && p === pass) return NextResponse.next();
  }

  return new NextResponse("Autenticación requerida", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ABUNDANCE Admin"' },
  });
}

export const config = { matcher: ["/admin/:path*"] };
