export function formatDayDate(dateToConvert) {
  if (!dateToConvert) return "-";
  const date = new Date(dateToConvert);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCalendarDate(dateToConvert) {
  if (!dateToConvert) return "-";
  const date = new Date(dateToConvert);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
