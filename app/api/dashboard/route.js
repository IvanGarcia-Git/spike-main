import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Datos de fallback para cuando el backend falle
const generateFallbackData = () => ({
  stats: {
    totalClientes: 0,
    totalLeads: 0,
    totalContratos: 0,
    ingresosMes: 0
  },
  topAgentes: [
    {
      id: 1,
      name: "Carlos Garcia",
      role: "Salesman",
      ventas: 280,
      objetivo: 140,
      porcentaje: 92,
      comisiones: "$1570",
      crecimiento: 20,
      color: "green",
    },
    {
      id: 2,
      name: "Daniel Ken",
      role: "Salesman",
      ventas: 160,
      objetivo: 140,
      porcentaje: 75,
      comisiones: "$800",
      crecimiento: 4,
      color: "yellow",
    },
    {
      id: 3,
      name: "Jennifer Tan",
      role: "Salesman",
      ventas: 124,
      objetivo: 140,
      porcentaje: 45,
      comisiones: "$650",
      crecimiento: 31,
      color: "red",
    },
    {
      id: 4,
      name: "María López",
      role: "Salesman",
      ventas: 110,
      objetivo: 140,
      porcentaje: 65,
      comisiones: "$550",
      crecimiento: 15,
      color: "yellow",
    },
    {
      id: 5,
      name: "Juan Pérez",
      role: "Salesman",
      ventas: 95,
      objetivo: 140,
      porcentaje: 55,
      comisiones: "$475",
      crecimiento: 8,
      color: "yellow",
    },
  ],
  ventasPorMes: [
    { mes: "Ene", ventas: 50 },
    { mes: "Feb", ventas: 75 },
    { mes: "Mar", ventas: 10 },
    { mes: "Abr", ventas: 70 },
    { mes: "May", ventas: 40 },
    { mes: "Jun", ventas: 30 },
    { mes: "Jul", ventas: 65 },
    { mes: "Ago", ventas: 20 },
    { mes: "Sep", ventas: 5 },
    { mes: "Oct", ventas: 35 },
    { mes: "Nov", ventas: 85 },
    { mes: "Dic", ventas: 80 },
  ],
});

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
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        // Añadir timeout de 5 segundos
        signal: AbortSignal.timeout(5000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 200 });
      } else {
        // Si el backend responde con error, devolver datos de fallback
        console.log("Backend respondió con error, usando datos de fallback");
        return NextResponse.json(generateFallbackData(), { status: 200 });
      }
    } catch (fetchError) {
      // Si el backend no está disponible o hay timeout, devolver datos de fallback
      console.log("Backend no disponible, usando datos de fallback:", fetchError.message);
      return NextResponse.json(generateFallbackData(), { status: 200 });
    }
  } catch (error) {
    console.error("Error en dashboard API route:", error);
    // Incluso si hay un error crítico, devolver datos de fallback
    return NextResponse.json(generateFallbackData(), { status: 200 });
  }
}
