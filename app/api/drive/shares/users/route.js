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

    try {
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/files/shares/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json({ users: data }, { status: 200 });
      } else {
        console.log("Backend respondió con error");
        return NextResponse.json({ users: [] }, { status: 200 });
      }
    } catch (fetchError) {
      console.log("Backend no disponible:", fetchError.message);
      return NextResponse.json({ users: [] }, { status: 200 });
    }
  } catch (error) {
    console.error("Error en users API route:", error);
    return NextResponse.json({ users: [] }, { status: 200 });
  }
}
