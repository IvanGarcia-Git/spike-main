import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";

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

    // El backend exige `userId` además de type/startDate/endDate. El frontend no
    // dispone del id del usuario (el perfil mapeado no lo expone), así que lo
    // derivamos del JWT del usuario autenticado. Además de arreglar el error
    // "userId, startDate, endDate, and type are required", es más seguro: nadie
    // puede solicitar una ausencia en nombre de otro usuario.
    let userId;
    try {
      userId = jose.decodeJwt(token.value)?.userId;
    } catch {
      userId = undefined;
    }

    if (userId == null) {
      return NextResponse.json(
        { error: "No se pudo identificar al usuario" },
        { status: 400 }
      );
    }

    const backendBody = { ...body, userId: Number(userId) };

    try {
      const apiResponse = await fetch(
        `${process.env.BACKEND_URL}/absences`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.value}`,
          },
          body: JSON.stringify(backendBody),
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
