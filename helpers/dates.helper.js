export function formatDayDate(dateToConvert) {
  return new Date(dateToConvert).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCalendarDate(dateToConvert) {
  return new Date(dateToConvert).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
