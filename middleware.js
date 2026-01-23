import { NextResponse } from "next/server";
import * as jose from "jose";

export async function middleware(req) {
  const token = req.cookies.get("factura-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const jwtKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, jwtKey);

    // Rutas que requieren ser Manager (no accesibles para Agentes)
    const managerOnlyRoutes = ["/usuarios", "/liquidaciones"];
    if (managerOnlyRoutes.some(route => req.nextUrl.pathname.startsWith(route)) && !payload.isManager) {
      return NextResponse.redirect(new URL("/contratos", req.url));
    }

    if (payload.groupId !== 1) {
      const superAdminRoutes = [
        "/origins",
        "/estados",
        "/companies",
        "/canales",
        "/users-visibility",
        "/campaigns",
        "/contract-customize",
        "/prioridad-leads",
      ];
      if (superAdminRoutes.includes(req.nextUrl.pathname)) {
        return NextResponse.redirect(new URL("/contratos", req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error verificando el token:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: [
    "/origins",
    "/estados",
    "/companies",
    "/canales",
    "/contratos",
    "/users-visibility",
    "/agenda",
    "/campaigns",
    "/gestor-lead",
    "/groups",
    "/usuarios",
    "/send-task",
    "/notificaciones",
    "/contract-customize",
    "/prioridad-leads",
    "/notifications-settings",
    "/emitir-factura",
    "/perfil",
    "/liquidaciones",
    "/dashboard",
    "/control-horario",
    "/control-horario/historial"
  ],
};
