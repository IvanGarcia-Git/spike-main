export const postFetch = async (suffix, body) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return await fetch(`${apiUrl}/${suffix}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

export const authFetch = async (method, suffix, body, jwtToken) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return await fetch(`${apiUrl}/${suffix}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify(body),
  });
};

export const authGetFetch = async (suffix, jwtToken) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return await fetch(`${apiUrl}/${suffix}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
};

export const getFetch = async (suffix) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return await fetch(`${apiUrl}/${suffix}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const authFetchFormData = async (method, suffix, formData, jwtToken) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return await fetch(`${apiUrl}/${suffix}`, {
    method,
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
    body: formData,
  });
};

// Comparativas API functions
export const createComparativa = async (comparativaData, jwtToken) => {
  return await authFetch("POST", "comparativas", comparativaData, jwtToken);
};

export const getComparativas = async (jwtToken) => {
  return await authGetFetch("comparativas", jwtToken);
};

export const getRecentComparativas = async (limit, jwtToken) => {
  return await authGetFetch(`comparativas/recent?limit=${limit}`, jwtToken);
};

export const getComparativaById = async (comparativaId, jwtToken) => {
  return await authGetFetch(`comparativas/${comparativaId}`, jwtToken);
};

export const deleteComparativa = async (comparativaId, jwtToken) => {
  return await authFetch("DELETE", `comparativas/${comparativaId}`, null, jwtToken);
};

export const updateComparativa = async (comparativaId, data, jwtToken) => {
  return await authFetch("PUT", `comparativas/${comparativaId}`, data, jwtToken);
};

// PRES-018 B1 — Extrae datos de una factura (imagen/PDF) con IA para pre-rellenar el asistente.
export const extractInvoiceData = async (file, jwtToken) => {
  const formData = new FormData();
  formData.append("file", file);
  return await authFetchFormData("POST", "comparativas/extract-invoice", formData, jwtToken);
};

// PRES-018 B2a — Reglas de asignación automática de leads
export const getAssignmentRules = async (jwtToken) =>
  await authGetFetch("lead-assignment-rules", jwtToken);

export const createAssignmentRule = async (data, jwtToken) =>
  await authFetch("POST", "lead-assignment-rules", data, jwtToken);

export const updateAssignmentRule = async (uuid, data, jwtToken) =>
  await authFetch("PUT", `lead-assignment-rules/${uuid}`, data, jwtToken);

export const deleteAssignmentRule = async (uuid, jwtToken) =>
  await authFetch("DELETE", `lead-assignment-rules/${uuid}`, null, jwtToken);

// PRES-018 B3 — estadísticas del gestor de leads (rango de fechas)
export const getLeadStats = async (startDate, endDate, jwtToken) =>
  await authGetFetch(
    `lead-stats?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
    jwtToken
  );

// PRES-018 B2b — el agente gestiona sus propias prioridades de leads
export const getMyLeadPriorities = async (jwtToken) =>
  await authGetFetch("users/me/lead-priorities", jwtToken);

export const updateMyLeadPriorities = async (leadPriorities, jwtToken) =>
  await authFetch("PATCH", "users/me/lead-priorities", { leadPriorities }, jwtToken);
