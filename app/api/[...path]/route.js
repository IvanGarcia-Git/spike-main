import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req, { params }) {
  return handleRequest(req, params, "GET");
}

export async function POST(req, { params }) {
  return handleRequest(req, params, "POST");
}

export async function PUT(req, { params }) {
  return handleRequest(req, params, "PUT");
}

export async function PATCH(req, { params }) {
  return handleRequest(req, params, "PATCH");
}

export async function DELETE(req, { params }) {
  return handleRequest(req, params, "DELETE");
}

async function handleRequest(req, params, method) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("factura-token");

    // Get the path segments
    const path = params.path.join("/");

    // Get query parameters from URL
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;

    // Check content type of incoming request
    const incomingContentType = req.headers.get("content-type") || "";
    const isMultipart = incomingContentType.includes("multipart/form-data");

    // Prepare headers
    const headers = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token.value}`;
    }

    // Prepare request options
    const requestOptions = {
      method,
      headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (method !== "GET" && method !== "DELETE") {
      if (isMultipart) {
        // For multipart/form-data, pass through the raw body as-is
        // Don't parse and re-serialize — that loses the boundary and corrupts the upload
        const arrayBuffer = await req.arrayBuffer();
        requestOptions.body = arrayBuffer;
        headers["Content-Type"] = incomingContentType;
      } else {
        // For JSON requests
        headers["Content-Type"] = "application/json";
        try {
          const body = await req.json();
          requestOptions.body = JSON.stringify(body);
        } catch (e) {
          // No body or invalid JSON
        }
      }
    } else {
      // For GET/DELETE, set JSON content type for consistency
      headers["Content-Type"] = "application/json";
    }

    // Make request to backend
    const apiResponse = await fetch(
      `${process.env.BACKEND_URL}/${fullPath}`,
      requestOptions
    );

    // Handle 204 No Content responses (e.g., successful DELETE)
    if (apiResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // Get response data
    const contentType = apiResponse.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await apiResponse.json();
      return NextResponse.json(data, { status: apiResponse.status });
    }

    // Respuestas no-JSON (descargas binarias: Excel, PDF, imágenes, etc.):
    // reenviar el cuerpo CRUDO sin decodificarlo. Antes se hacía
    // apiResponse.text() + NextResponse.json, lo que decodificaba el binario
    // como UTF-8 y corrompía el archivo (ej. la plantilla .xlsx de leads se
    // descargaba con los bytes "PK..." del ZIP como texto). Preservamos los
    // bytes y las cabeceras relevantes (Content-Type/Disposition/Length).
    const arrayBuffer = await apiResponse.arrayBuffer();
    const responseHeaders = {};
    for (const header of ["content-type", "content-disposition", "content-length"]) {
      const value = apiResponse.headers.get(header);
      if (value) responseHeaders[header] = value;
    }
    return new NextResponse(arrayBuffer, {
      status: apiResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Error in API proxy [${method}]:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
