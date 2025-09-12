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
