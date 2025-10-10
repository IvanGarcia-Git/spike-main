import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("factura-token");

    if (!token) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const apiResponse = await fetch(`${process.env.BACKEND_URL}/dashboard/agentes/contratos-por-compania`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.value}`,
      },
    });

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Error obteniendo contratos por compañía" },
        { status: apiResponse.status }
      );
    }
  } catch (error) {
    console.error("Error en contratos-por-compania:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
