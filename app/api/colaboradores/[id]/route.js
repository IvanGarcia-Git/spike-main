import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("factura-token");

    if (!token) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const backendUrl = `${process.env.BACKEND_URL}/user-profiles/colaborador/${id}`;

    const apiResponse = await fetch(backendUrl, {
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
      const errorText = await apiResponse.text();
      console.error("Backend error:", apiResponse.status, errorText);
      return NextResponse.json(
        { error: "Error obteniendo datos del colaborador" },
        { status: apiResponse.status }
      );
    }
  } catch (error) {
    console.error("Error en colaborador:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
