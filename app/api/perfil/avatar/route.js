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

    // Decodificar el token para obtener el userUuid
    let userUuid;
    try {
      const payload = jose.decodeJwt(token.value);
      userUuid = payload.userUuid;
      if (!userUuid) {
        return NextResponse.json(
          { message: "No se pudo obtener el ID del usuario" },
          { status: 400 }
        );
      }
    } catch (decodeError) {
      console.error("Error decodificando token:", decodeError);
      return NextResponse.json(
        { message: "Token inválido" },
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
      // Crear FormData para enviar al backend
      // El backend espera: userUuid, userData (JSON string), y userImage (archivo)
      const backendFormData = new FormData();
      backendFormData.append("userUuid", userUuid);
      backendFormData.append("userData", JSON.stringify({})); // Solo actualizamos la imagen
      backendFormData.append("userImage", file, file.name);

      const apiUrl = process.env.API_URL || process.env.BACKEND_URL || "http://localhost:3000";

      const apiResponse = await fetch(`${apiUrl}/users/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token.value}`,
          // No incluir Content-Type, fetch lo establece automáticamente para FormData
        },
        body: backendFormData,
        signal: AbortSignal.timeout(30000), // 30 segundos para subida de archivos
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        // El backend devuelve el usuario actualizado con imageUri
        // Necesitamos obtener la URL firmada de la imagen
        let avatarUrl = data.imageUri;

        // Si tenemos imageUri, obtener la URL firmada
        if (avatarUrl && !avatarUrl.startsWith("data:")) {
          try {
            const profilePicResponse = await fetch(`${apiUrl}/users/profile-picture/${data.id}`, {
              headers: {
                "Authorization": `Bearer ${token.value}`,
              },
            });
            if (profilePicResponse.ok) {
              const profilePicData = await profilePicResponse.json();
              avatarUrl = profilePicData.profileImageUri;
            }
          } catch (e) {
            console.log("No se pudo obtener URL firmada, usando imageUri directa");
          }
        }

        return NextResponse.json({
          avatar: avatarUrl,
          message: "Avatar actualizado correctamente"
        }, { status: 200 });
      } else {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("Error del backend:", errorData);
        return NextResponse.json(
          { message: errorData.message || "Error al subir la imagen" },
          { status: apiResponse.status }
        );
      }
    } catch (fetchError) {
      console.error("Error conectando al backend:", fetchError.message);

      // Fallback: convertir imagen a base64 para simular respuesta (modo desarrollo)
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
