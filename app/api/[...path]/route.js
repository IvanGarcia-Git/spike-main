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
        // For multipart/form-data, pass through the FormData as-is
        const formData = await req.formData();
        requestOptions.body = formData;
        // Don't set Content-Type - fetch will set it automatically with boundary
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

    // Get response data
    const contentType = apiResponse.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await apiResponse.json();
    } else {
      data = await apiResponse.text();
    }

    // Return response with same status code
    return NextResponse.json(data, { status: apiResponse.status });
  } catch (error) {
    console.error(`Error in API proxy [${method}]:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
