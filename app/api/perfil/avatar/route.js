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

    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!file) {
      return NextResponse.json(
        { message: "No se ha proporcionado ninguna imagen" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "La imagen no puede superar los 5MB" },
        { status: 400 }
      );
    }

    try {
      // Crear nuevo FormData para enviar al backend
      const backendFormData = new FormData();
      backendFormData.append("avatar", file);

      const apiResponse = await fetch(`${process.env.BACKEND_URL}/perfil/avatar`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.value}`,
        },
        body: backendFormData,
        signal: AbortSignal.timeout(30000), // 30 segundos para subida de archivos
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 200 });
      } else {
        const errorData = await apiResponse.json().catch(() => ({}));
        return NextResponse.json(
          { message: errorData.message || "Error al subir la imagen" },
          { status: apiResponse.status }
        );
      }
    } catch (fetchError) {
      console.log("Backend no disponible para avatar:", fetchError.message);

      // Fallback: convertir imagen a base64 para simular respuesta
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const mimeType = file.type;
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json(
        { avatar: dataUrl, message: "Avatar actualizado (modo local)" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error subiendo avatar:", error);
    return NextResponse.json(
      { message: "Error al procesar la imagen" },
      { status: 500 }
    );
  }
}
