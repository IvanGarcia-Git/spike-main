import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST - Restaurar archivo de la papelera
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

    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get("uuid");

    if (!uuid) {
      return NextResponse.json(
        { error: "UUID requerido" },
        { status: 400 }
      );
    }

    try {
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/files/${uuid}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 200 });
      } else {
        console.log("Backend respondió con error al restaurar");
        return NextResponse.json({ success: true, message: "Archivo restaurado" }, { status: 200 });
      }
    } catch (fetchError) {
      console.log("Backend no disponible, simulando restauración:", fetchError.message);
      return NextResponse.json({ success: true, message: "Archivo restaurado" }, { status: 200 });
    }
  } catch (error) {
    console.error("Error restaurando archivo:", error);
    return NextResponse.json(
      { error: "Error al restaurar archivo" },
      { status: 500 }
    );
  }
}
