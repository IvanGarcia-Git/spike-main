import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("factura-token");

    if (!token) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate required fields
    if (!body.type || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "Tipo, fecha de inicio y fecha de fin son obligatorios" },
        { status: 400 }
      );
    }

    try {
      const apiResponse = await fetch(
        `${process.env.BACKEND_URL}/absences`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.value}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 201 });
      } else {
        const errorData = await apiResponse.json().catch(() => ({
          message: "Error al crear la ausencia en el servidor",
        }));
        return NextResponse.json(
          { error: errorData.message || "Error del servidor" },
          { status: apiResponse.status }
        );
      }
    } catch (fetchError) {
      console.error(
        "Backend no disponible para crear ausencia:",
        fetchError.message
      );
      return NextResponse.json(
        { error: "Servidor no disponible. Inténtalo más tarde." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error creando ausencia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}