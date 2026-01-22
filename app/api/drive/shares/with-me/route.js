import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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

// Transform backend format to frontend format
const toFrontendFormat = (backendFile) => ({
  id: backendFile.id,
  uuid: backendFile.uuid,
  nombre: backendFile.name,
  tipo: backendFile.mimetype || backendFile.type,
  tamano: formatFileSize(backendFile.size),
  fecha: backendFile.createdAt ? new Date(backendFile.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  destacado: false,
  propietario: backendFile.ownerName || backendFile.ownerEmail || "Usuario",
  propietarioEmail: backendFile.ownerEmail,
  compartidoPor: backendFile.sharedByName || backendFile.sharedByEmail,
  permiso: backendFile.permission,
  fechaCompartido: backendFile.sharedAt,
  icono: getIconFromMimeType(backendFile.mimetype || backendFile.type),
  uri: backendFile.uri,
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
      const apiResponse = await fetch(`${process.env.BACKEND_URL}/files/shares/with-me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.value}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        const transformedFiles = Array.isArray(data)
          ? data.map(toFrontendFormat)
          : [];
        return NextResponse.json({ files: transformedFiles }, { status: 200 });
      } else {
        console.log("Backend respondió con error");
        return NextResponse.json({ files: [] }, { status: 200 });
      }
    } catch (fetchError) {
      console.log("Backend no disponible:", fetchError.message);
      return NextResponse.json({ files: [] }, { status: 200 });
    }
  } catch (error) {
    console.error("Error en shared-with-me API route:", error);
    return NextResponse.json({ files: [] }, { status: 200 });
  }
}
