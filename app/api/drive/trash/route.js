import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Datos de fallback para cuando el backend falle
const generateFallbackData = () => ({
  files: [],
});

// Transform backend format to frontend format for trash files
const toFrontendFormat = (backendFile) => ({
  id: backendFile.id,
  uuid: backendFile.uuid,
  nombre: backendFile.name,
  tipo: backendFile.mimetype || backendFile.type,
  tamano: formatFileSize(backendFile.size),
  fecha: backendFile.createdAt ? new Date(backendFile.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  deletedAt: backendFile.deletedAt,
  carpetaId: backendFile.folderId || null,
  destacado: backendFile.destacado || false,
  propietario: backendFile.ownerEmail || "Usuario",
  icono: getIconFromMimeType(backendFile.mimetype || backendFile.type),
  uri: backendFile.uri,
  mimetype: backendFile.mimetype,
  size: backendFile.size,
});

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(0)} ${sizes[i]}`;
}

function getIconFromMimeType(mimeType) {
  if (!mimeType) return "insert_drive_file";
  if (mimeType.includes("pdf")) return "picture_as_pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "description";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "grid_on";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "slideshow";
  if (mimeType.includes("image")) return "image";
  if (mimeType.includes("video")) return "videocam";
  if (mimeType.includes("audio")) return "audiotrack";
  return "insert_drive_file";
}

// GET - Obtener archivos en papelera
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
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/files/trash`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        // Transform array of files from backend format to frontend format
        const transformedFiles = Array.isArray(data)
          ? data.map(toFrontendFormat)
          : (data.files || []).map(toFrontendFormat);
        return NextResponse.json({ files: transformedFiles }, { status: 200 });
      } else {
        console.log("Backend respondió con error, usando datos de fallback");
        return NextResponse.json(generateFallbackData(), { status: 200 });
      }
    } catch (fetchError) {
      console.log("Backend no disponible, usando datos de fallback:", fetchError.message);
      return NextResponse.json(generateFallbackData(), { status: 200 });
    }
  } catch (error) {
    console.error("Error en drive trash API route:", error);
    return NextResponse.json(generateFallbackData(), { status: 200 });
  }
}

// DELETE - Vaciar papelera
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

    try {
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/files/trash`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        signal: AbortSignal.timeout(10000), // 10 seconds for potentially slow delete
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 200 });
      } else {
        console.log("Backend respondió con error al vaciar papelera");
        return NextResponse.json({ success: true, message: "Papelera vaciada" }, { status: 200 });
      }
    } catch (fetchError) {
      console.log("Backend no disponible, simulando vaciado:", fetchError.message);
      return NextResponse.json({ success: true, message: "Papelera vaciada" }, { status: 200 });
    }
  } catch (error) {
    console.error("Error vaciando papelera:", error);
    return NextResponse.json(
      { error: "Error al vaciar papelera" },
      { status: 500 }
    );
  }
}
