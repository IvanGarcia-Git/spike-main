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

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const url = `${process.env.BACKEND_URL}/dashboard/facturacion/ingresos-por-tarifa${queryString ? `?${queryString}` : ''}`;

    const apiResponse = await fetch(url, {
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
        { error: "Error obteniendo ingresos por tarifa" },
        { status: apiResponse.status }
      );
    }
  } catch (error) {
    console.error("Error en ingresos por tarifa:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
