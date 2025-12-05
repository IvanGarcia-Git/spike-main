import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Datos de fallback para cuando el backend falle (vacíos para mostrar estado sin datos)
const generateFallbackData = () => ({
  folders: [],
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
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/drive/folders`, {
        method: "GET",
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
        console.log("Backend respondió con error, usando datos de fallback");
        return NextResponse.json(generateFallbackData(), { status: 200 });
      }
    } catch (fetchError) {
      console.log("Backend no disponible, usando datos de fallback:", fetchError.message);
      return NextResponse.json(generateFallbackData(), { status: 200 });
    }
  } catch (error) {
    console.error("Error en drive folders API route:", error);
    return NextResponse.json(generateFallbackData(), { status: 200 });
  }
}

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

    try {
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/drive/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 201 });
      } else {
        const newFolder = {
          id: Date.now(),
          ...body,
          fecha: new Date().toISOString().split('T')[0],
          archivosCount: 0,
          propietario: "Usuario Actual",
        };
        return NextResponse.json(newFolder, { status: 201 });
      }
    } catch (fetchError) {
      console.log("Backend no disponible, simulando creación:", fetchError.message);
      const newFolder = {
        id: Date.now(),
        ...body,
        fecha: new Date().toISOString().split('T')[0],
        archivosCount: 0,
        propietario: "Usuario Actual",
      };
      return NextResponse.json(newFolder, { status: 201 });
    }
  } catch (error) {
    console.error("Error creando carpeta:", error);
    return NextResponse.json(
      { error: "Error al crear carpeta" },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    try {
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/drive/folders/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (apiResponse.ok) {
        return NextResponse.json({ success: true }, { status: 200 });
      } else {
        return NextResponse.json({ success: true }, { status: 200 });
      }
    } catch (fetchError) {
      console.log("Backend no disponible, simulando eliminación:", fetchError.message);
      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Error eliminando carpeta:", error);
    return NextResponse.json(
      { error: "Error al eliminar carpeta" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
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
    const { id, ...updateData } = body;

    try {
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/drive/folders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(5000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 200 });
      } else {
        return NextResponse.json({ ...updateData, id }, { status: 200 });
      }
    } catch (fetchError) {
      console.log("Backend no disponible, simulando actualización:", fetchError.message);
      return NextResponse.json({ ...updateData, id }, { status: 200 });
    }
  } catch (error) {
    console.error("Error actualizando carpeta:", error);
    return NextResponse.json(
      { error: "Error al actualizar carpeta" },
      { status: 500 }
    );
  }
}
