import { NextResponse } from "next/server";

export async function POST(req) {
  if (req.method === "POST") {
    const { username, password } = await req.json();

    try {
      const apiResponse = await fetch(`${process.env.API_URL}/users/login`, {
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
      console.error("Error autenticando:", error);

      const response = NextResponse.next();
      return NextResponse.json({ error: "Error interno del servidor" });
    }
  } else {
    const response = NextResponse.next();
    return NextResponse.json(
      { error: `Método ${req.method} no permitido` },
      { status: 404 }
    );
  }
}
