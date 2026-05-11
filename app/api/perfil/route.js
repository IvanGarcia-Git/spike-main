import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";

// URL del backend Express. Se aceptan varias env vars por compatibilidad.
const getApiUrl = () =>
  process.env.API_URL || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Mapea el valor del enum UserShift del backend a un nombre de icono Material.
const SHIFT_ICON = {
  "mañana": "wb_sunny",
  "tarde": "wb_twilight",
};

// Etiquetas legibles para los tipos/estados de ausencia del backend.
const ABSENCE_TYPE_LABEL = {
  vacaciones: "Vacaciones",
  asuntos_propios: "Asuntos propios",
  baja_medica: "Baja médica",
  otro: "Otro",
};
const ABSENCE_STATUS_LABEL = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};
const PAYROLL_STATE_LABEL = {
  pendiente: "Pendiente",
  pagada: "Pagada",
};

function formatDateEs(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function daysSince(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function inclusiveDaysBetween(startValue, endValue) {
  const a = new Date(startValue);
  const b = new Date(endValue);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  const diff = Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff) + 1;
}

// Construye el objeto `usuario` que espera el frontend a partir de la entidad User del backend.
function mapUser(user, avatarUrl) {
  const fullName = [user?.name, user?.firstSurname, user?.secondSurname]
    .filter((p) => p && String(p).trim())
    .join(" ")
    .trim();
  const dias = daysSince(user?.startDate);
  return {
    nombre: fullName || "-",
    usuario: user?.username || "-",
    telefono: user?.phone || "-",
    correo: user?.email || "-",
    numeroCuenta: user?.iban || "-",
    antiguedad: dias != null ? `${dias} días` : "-",
    fechaIngreso: formatDateEs(user?.startDate),
    turno: SHIFT_ICON[user?.shift] || "wb_sunny",
    horario: user?.time || "-",
    horasSemana: user?.days || "-",
    rol: user?.role || "-",
    avatar: avatarUrl || (user?.imageUri && user.imageUri.startsWith("data:") ? user.imageUri : null),
  };
}

function mapAbsences(absences) {
  if (!Array.isArray(absences)) return [];
  return absences.map((a) => ({
    id: a.id,
    uuid: a.uuid,
    tipo: ABSENCE_TYPE_LABEL[a.type] || a.type || "Otro",
    fechaInicio: a.startDate,
    fechaFin: a.endDate,
    dias: inclusiveDaysBetween(a.startDate, a.endDate),
    estado: ABSENCE_STATUS_LABEL[a.status] || a.status || "Pendiente",
    motivo: a.description || "",
  }));
}

function mapPayrolls(payrolls) {
  if (!Array.isArray(payrolls)) return [];
  return payrolls.map((p) => {
    const d = new Date(p.date);
    const valid = !isNaN(d.getTime());
    const importe = Number(p.qty);
    const qtyStr = isNaN(importe) ? "0.00" : importe.toFixed(2);
    return {
      id: p.id,
      uuid: p.uuid,
      mes: valid ? `${MESES[d.getMonth()]} ${d.getFullYear()}` : "-",
      periodo: formatDateEs(p.date),
      salarioBruto: qtyStr,
      deducciones: "0.00",
      salarioNeto: qtyStr,
      fecha: p.date,
      estado: PAYROLL_STATE_LABEL[p.state] || p.state || "Pendiente",
    };
  });
}

async function authedJson(url, token, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const err = new Error(`Backend respondió ${res.status} en ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("factura-token");
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const apiUrl = getApiUrl();

  // Datos del usuario autenticado (el backend resuelve el usuario por el JWT).
  let user;
  try {
    user = await authedJson(`${apiUrl}/users/`, token.value);
  } catch (e) {
    console.error("Error obteniendo perfil del backend:", e.message);
    // No devolvemos datos de otro usuario: respondemos error real.
    return NextResponse.json(
      { error: "No se pudieron cargar los datos del perfil" },
      { status: 502 }
    );
  }

  // userId para consultar ausencias/nóminas (del propio usuario).
  let userId = user?.id;
  if (userId == null) {
    try {
      userId = jose.decodeJwt(token.value)?.userId;
    } catch {
      userId = undefined;
    }
  }

  // Avatar: si hay imageUri (clave de S3), pedimos la URL firmada.
  let avatarUrl = null;
  if (user?.imageUri && !String(user.imageUri).startsWith("data:") && userId != null) {
    try {
      const pic = await authedJson(`${apiUrl}/users/profile-picture/${userId}`, token.value);
      avatarUrl = pic?.profileImageUri || null;
    } catch {
      avatarUrl = null;
    }
  }

  // Ausencias y nóminas son best-effort: si fallan, listas vacías (nunca datos falsos).
  let ausencias = [];
  let nominas = [];
  if (userId != null) {
    try {
      ausencias = mapAbsences(await authedJson(`${apiUrl}/absences/user/${userId}`, token.value));
    } catch (e) {
      console.warn("No se pudieron cargar las ausencias:", e.message);
    }
    try {
      nominas = mapPayrolls(await authedJson(`${apiUrl}/payrolls/${userId}`, token.value));
    } catch (e) {
      console.warn("No se pudieron cargar las nóminas:", e.message);
    }
  }

  return NextResponse.json(
    { usuario: mapUser(user, avatarUrl), ausencias, nominas },
    { status: 200 }
  );
}

export async function PUT(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get("factura-token");
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }

  const apiUrl = getApiUrl();

  // Necesitamos el uuid del usuario autenticado para el PATCH /users/.
  let userUuid;
  try {
    userUuid = jose.decodeJwt(token.value)?.userUuid;
  } catch {
    userUuid = undefined;
  }

  // Cargamos el usuario actual para descomponer el nombre completo manteniendo apellidos.
  let current;
  try {
    current = await authedJson(`${apiUrl}/users/`, token.value);
    if (!userUuid) userUuid = current?.uuid;
  } catch (e) {
    console.error("Error obteniendo usuario para actualizar perfil:", e.message);
    return NextResponse.json(
      { error: "No se pudieron cargar los datos del perfil" },
      { status: 502 }
    );
  }

  if (!userUuid) {
    return NextResponse.json({ error: "No se pudo identificar al usuario" }, { status: 400 });
  }

  const userData = {};
  if (typeof body.telefono === "string") userData.phone = body.telefono.trim();
  if (typeof body.numeroCuenta === "string") userData.iban = body.numeroCuenta.trim();
  if (typeof body.correo === "string" && body.correo.trim()) userData.email = body.correo.trim();
  if (typeof body.nombre === "string" && body.nombre.trim()) {
    const parts = body.nombre.trim().split(/\s+/);
    userData.name = parts[0] || current?.name || "";
    userData.firstSurname = parts[1] || "";
    userData.secondSurname = parts.slice(2).join(" ") || "";
  }

  let updated;
  try {
    const res = await fetch(`${apiUrl}/users/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ userUuid, userData }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.message || "No se pudo actualizar el perfil" },
        { status: res.status }
      );
    }
    updated = await res.json();
  } catch (e) {
    console.error("Error actualizando perfil en el backend:", e.message);
    return NextResponse.json(
      { error: "Servidor no disponible. Inténtalo más tarde." },
      { status: 503 }
    );
  }

  return NextResponse.json({ usuario: mapUser(updated, null) }, { status: 200 });
}
