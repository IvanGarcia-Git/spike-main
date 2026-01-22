import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST - Compartir archivo con usuarios
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
    const { fileId, userIds, permission } = body;

    if (!fileId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "fileId y userIds son requeridos" },
        { status: 400 }
      );
    }

    try {
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/files/shares`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        body: JSON.stringify({ fileId, userIds, permission }),
        signal: AbortSignal.timeout(10000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 201 });
      } else {
        const error = await apiResponse.json();
        return NextResponse.json(
          { error: error.message || "Error al compartir archivo" },
          { status: apiResponse.status }
        );
      }
    } catch (fetchError) {
      console.error("Error conectando con backend:", fetchError.message);
      return NextResponse.json(
        { error: "Error de conexión con el servidor" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en share API route:", error);
    return NextResponse.json(
      { error: "Error al compartir archivo" },
      { status: 500 }
    );
  }
}

// DELETE - Quitar compartición
export async function DELETE(req) {
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
    const { fileId, sharedWithUserId } = body;

    if (!fileId || !sharedWithUserId) {
      return NextResponse.json(
        { error: "fileId y sharedWithUserId son requeridos" },
        { status: 400 }
      );
    }

    try {
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/files/shares`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        body: JSON.stringify({ fileId, sharedWithUserId }),
        signal: AbortSignal.timeout(10000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 200 });
      } else {
        return NextResponse.json(
          { error: "Error al quitar compartición" },
          { status: apiResponse.status }
        );
      }
    } catch (fetchError) {
      console.error("Error conectando con backend:", fetchError.message);
      return NextResponse.json(
        { error: "Error de conexión con el servidor" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en unshare API route:", error);
    return NextResponse.json(
      { error: "Error al quitar compartición" },
      { status: 500 }
    );
  }
}
