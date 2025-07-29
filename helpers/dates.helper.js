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

//format date that allows to modify the date on an input
export function formatDateToInput(value) {
  const date = new Date(value);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
