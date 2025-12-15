export function isCustomerDataValid(customerData, requireEmail = true) {
  const baseValid =
    customerData?.name &&
    customerData?.surnames &&
    customerData?.nationalId &&
    customerData?.address &&
    customerData?.zipCode &&
    customerData?.province &&
    customerData?.populace &&
    customerData?.phoneNumber &&
    customerData?.iban;

  // Email solo es obligatorio si requireEmail es true (factura electrónica)
  if (requireEmail) {
    return baseValid && customerData?.email;
  }

  return baseValid;
}

export function validateIBANMath(iban) {
  const formattedIban = iban.replace(/\s+/g, "").toUpperCase();

  if (formattedIban.length < 15 || formattedIban.length > 34) {
    return false;
  }

  const rearrangedIban = formattedIban.slice(4) + formattedIban.slice(0, 4);

  const numericIban = rearrangedIban
    .split("")
    .map((char) => (/[A-Z]/.test(char) ? char.charCodeAt(0) - 55 : char))
    .join("");

  const ibanInt = BigInt(numericIban);
  return ibanInt % 97n === 1n;
}
