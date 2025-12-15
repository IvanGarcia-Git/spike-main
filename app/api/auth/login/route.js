import { NextResponse } from "next/server";

export async function POST(req) {
  if (req.method === "POST") {
    const { username, password } = await req.json();

    const backendUrl = process.env.BACKEND_URL;
    console.log("BACKEND_URL:", backendUrl);

    if (!backendUrl) {
      console.error("BACKEND_URL no está configurada");
      return NextResponse.json(
        { error: "Configuración del servidor incompleta" },
        { status: 500 }
      );
    }

    try {
      const apiResponse = await fetch(`${backendUrl}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (apiResponse.ok) {
        const { jwt } = await apiResponse.json();

        const cookieResponse = NextResponse.json(
          { message: "Login exitoso" },
          { status: 200 }
        );

        cookieResponse.cookies.set("factura-token", jwt, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60,
          path: "/",
        });

        return cookieResponse;
      } else {
        return NextResponse.json(
          { error: "Credenciales incorrectas" },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Error autenticando:", error.message);
      console.error("Backend URL usada:", backendUrl);
      return NextResponse.json(
        { error: `Error de conexión con el servidor: ${error.message}` },
        { status: 500 }
      );
    }
  } else {
    const response = NextResponse.next();
    return NextResponse.json(
      { error: `Método ${req.method} no permitido` },
      { status: 404 }
    );
  }
}
