export function isCustomerDataValid(customerData) {
  return (
    customerData?.name &&
    customerData?.surnames &&
    customerData?.nationalId &&
    customerData?.email &&
    customerData?.address &&
    customerData?.zipCode &&
    customerData?.province &&
    customerData?.populace &&
    customerData?.phoneNumber &&
    customerData?.iban
  );
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
