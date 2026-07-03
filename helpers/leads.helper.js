// Devuelve el nombre completo del agente asignado a un lead a partir de la
// relación `lead.user` que carga el backend. Usa el MISMO formato que el
// datalist de edición de leads para que el prefill sea coherente.
export function getAssignedUserName(user) {
  if (!user) return null;

  const fullName = `${user.name || ""} ${user.firstSurname || ""} ${
    user.secondSurname || ""
  }`
    .replace(/\s+/g, " ")
    .trim();

  return fullName || null;
}

// Normaliza una lista de leads añadiendo `assignedUserName` derivado de
// `lead.user`. No muta el objeto original: devuelve copias.
export function withAssignedUserName(leads) {
  if (!Array.isArray(leads)) return leads;

  return leads.map((lead) => ({
    ...lead,
    assignedUserName: getAssignedUserName(lead.user),
  }));
}
