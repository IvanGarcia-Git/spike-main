import type { BillBreakdown } from '@/lib/types';

/**
 * Lógica compartida del desglose de la comparativa.
 *
 * Tanto la página de resultados (`TariffComparisonResults`) como la vista previa /
 * PDF (`ComparisonPdfPreview`) construyen las MISMAS dos tablas (FACTURA ACTUAL y
 * MEJOR ALTERNATIVA) a partir de estas funciones, para que coincidan exactamente
 * (mismos conceptos, importes y fórmulas).
 */

/** Formatea un precio unitario (€/kWh, €/kW/día, €/día) con 4 decimales, como en la factura. */
export const formatPrice = (value: number) => `${(Number(value) || 0).toFixed(4)}`;

/** Formatea una cantidad física (kWh, kW, días) sin forzar decimales. */
export const formatQty = (value: number) => `${Number(value) || 0}`;

/** Formatea un porcentaje impositivo con los decimales indicados, sin ceros sobrantes. */
export const formatPct = (value: number, decimals = 2) => `${Number((Number(value) || 0).toFixed(decimals))}`;

/** Precios unitarios usados para construir las fórmulas del desglose. */
export interface BreakdownUnitPrices {
  powerPrices?: number[];
  energyPrices?: number[];
  surplusPrice?: number;
  fixedPrice?: number;
  energyPrice?: number;
}

/** Fila de desglose: concepto, importe y la fórmula de cómo se calcula. */
export interface BreakdownRow {
  label: string;
  value: number;
  formula?: string;
  isCredit?: boolean;
}

/** Devuelve el precio unitario del periodo i con el mismo fallback que el cálculo (último periodo). */
const priceForPeriod = (prices: number[] | undefined, i: number) =>
  prices?.[i] ?? prices?.[(prices?.length ?? 1) - 1] ?? 0;

/** Calcula el desglose de la factura actual de luz con los precios unitarios del cliente. */
export const calculateCurrentLightBillBreakdown = (
  formData: any,
  regulatedCosts: { ihp?: number; alquiler: number; social?: number; iva: number }
): BillBreakdown | null => {
  const { potencias, energias, numDias, solarPanelActive, excedentes, clientPowerPrices, clientEnergyPrices, clientSurplusPrice, clientMaintenanceCost } = formData;

  if (!potencias || !energias || !numDias || !clientPowerPrices || !clientEnergyPrices) return null;

  const powerCosts = potencias.map((p: number, i: number) => {
    const price = clientPowerPrices?.[i] ?? clientPowerPrices?.[clientPowerPrices.length - 1] ?? 0;
    return p * price * numDias;
  });

  const energyCosts = energias.map((e: number, i: number) => {
    const price = clientEnergyPrices?.[i] ?? clientEnergyPrices?.[clientEnergyPrices.length - 1] ?? 0;
    return e * price;
  });

  const surplusCredit = solarPanelActive && excedentes ? excedentes * (clientSurplusPrice ?? 0) : 0;
  const equipmentRental = numDias * (regulatedCosts.alquiler || 0);
  const socialBonus = numDias * (regulatedCosts.social || 0);
  const maintenanceCost = clientMaintenanceCost ?? 0;

  const baseForTax = powerCosts.reduce((a: number, b: number) => a + b, 0) + energyCosts.reduce((a: number, b: number) => a + b, 0) - surplusCredit + equipmentRental + socialBonus + maintenanceCost;
  const electricityTax = baseForTax > 0 ? baseForTax * ((regulatedCosts.ihp || 0) / 100) : 0;

  const baseIVA = baseForTax + electricityTax;
  const vat = baseIVA > 0 ? baseIVA * ((regulatedCosts.iva || 0) / 100) : 0;

  return {
    powerCosts,
    energyCosts,
    surplusCredit,
    socialBonus,
    equipmentRental,
    maintenanceCost,
    electricityTax,
    vat,
  };
};

/** Calcula el desglose de la factura actual de gas con los precios unitarios del cliente. */
export const calculateCurrentGasBillBreakdown = (
  formData: any,
  regulatedCosts: { hydrocarbon?: number; alquiler: number; iva: number }
): BillBreakdown | null => {
  const { energia, numDias, clientFixedPrice, clientGasEnergyPrice, clientMaintenanceCost } = formData;

  if (!energia || !numDias || clientFixedPrice === undefined || clientGasEnergyPrice === undefined) return null;

  const fixedCost = clientFixedPrice * numDias;
  const energyCost = energia * clientGasEnergyPrice;
  const equipmentRental = numDias * (regulatedCosts.alquiler || 0);
  const maintenanceCost = clientMaintenanceCost ?? 0;
  const hydrocarbonTax = energia * (regulatedCosts.hydrocarbon || 0);

  const baseForTax = fixedCost + energyCost + equipmentRental + hydrocarbonTax + maintenanceCost;
  const vat = baseForTax > 0 ? baseForTax * ((regulatedCosts.iva || 0) / 100) : 0;

  return {
    fixedCost,
    energyCost,
    equipmentRental,
    maintenanceCost,
    hydrocarbonTax,
    vat,
  };
};

/** Construye las filas del desglose de luz (con fórmulas) a partir de un breakdown ya calculado. */
export const buildLightBreakdownRows = (
  breakdown: BillBreakdown,
  formData: any,
  regulated: { ihp?: number; alquiler: number; social?: number; iva: number },
  prices: BreakdownUnitPrices,
): BreakdownRow[] => {
  const rows: BreakdownRow[] = [];
  const potencias: number[] = formData.potencias ?? [];
  const energias: number[] = formData.energias ?? [];
  const numDias: number = formData.numDias ?? 0;

  if (breakdown.energyCosts?.length) {
    const total = breakdown.energyCosts.reduce((a, b) => a + b, 0);
    const formula = energias
      .map((e, i) => `(P${i + 1}: ${formatQty(e)} kWh × ${formatPrice(priceForPeriod(prices.energyPrices, i))} €/kWh)`)
      .join(' + ');
    rows.push({ label: 'Coste energía', value: total, formula });
  }

  if (breakdown.powerCosts?.length) {
    const total = breakdown.powerCosts.reduce((a, b) => a + b, 0);
    const formula = potencias
      .map((p, i) => `(P${i + 1}: ${formatQty(p)} kW × ${formatPrice(priceForPeriod(prices.powerPrices, i))} €/kW/día × ${formatQty(numDias)} días)`)
      .join(' + ');
    rows.push({ label: 'Coste potencia', value: total, formula });
  }

  if (breakdown.surplusCredit && breakdown.surplusCredit > 0) {
    rows.push({
      label: 'Excedentes',
      value: -breakdown.surplusCredit,
      isCredit: true,
      formula: `${formatQty(formData.excedentes ?? 0)} kWh × ${formatPrice(prices.surplusPrice ?? 0)} €/kWh`,
    });
  }

  rows.push({
    label: 'Alquiler equipos',
    value: breakdown.equipmentRental ?? 0,
    formula: `${formatQty(numDias)} días × ${formatPrice(regulated.alquiler ?? 0)} €/día`,
  });

  if (breakdown.socialBonus && breakdown.socialBonus > 0) {
    rows.push({
      label: 'Bono social',
      value: breakdown.socialBonus,
      formula: `${formatQty(numDias)} días × ${formatPrice(regulated.social ?? 0)} €/día`,
    });
  }

  if (breakdown.maintenanceCost && breakdown.maintenanceCost > 0) {
    rows.push({ label: 'Servicios adicionales', value: breakdown.maintenanceCost });
  }

  if (breakdown.electricityTax !== undefined) {
    rows.push({
      label: `Impuesto eléctrico (${formatPct(regulated.ihp ?? 0)}%)`,
      value: breakdown.electricityTax,
      formula: `Base imponible × ${formatPct(regulated.ihp ?? 0, 3)}%`,
    });
  }

  rows.push({
    label: `IVA (${formatPct(regulated.iva ?? 0)}%)`,
    value: breakdown.vat ?? 0,
    formula: `(Base + Imp. eléctrico) × ${formatPct(regulated.iva ?? 0)}%`,
  });

  return rows;
};

/** Construye las filas del desglose de gas (con fórmulas) a partir de un breakdown ya calculado. */
export const buildGasBreakdownRows = (
  breakdown: BillBreakdown,
  formData: any,
  regulated: { hydrocarbon?: number; alquiler: number; iva: number },
  prices: BreakdownUnitPrices,
): BreakdownRow[] => {
  const rows: BreakdownRow[] = [];
  const energia: number = formData.energia ?? 0;
  const numDias: number = formData.numDias ?? 0;

  if (breakdown.fixedCost !== undefined) {
    rows.push({
      label: 'Coste término fijo',
      value: breakdown.fixedCost,
      formula: `${formatPrice(prices.fixedPrice ?? 0)} €/día × ${formatQty(numDias)} días`,
    });
  }

  if (breakdown.energyCost !== undefined) {
    rows.push({
      label: 'Coste energía',
      value: breakdown.energyCost,
      formula: `${formatQty(energia)} kWh × ${formatPrice(prices.energyPrice ?? 0)} €/kWh`,
    });
  }

  rows.push({
    label: 'Alquiler equipos',
    value: breakdown.equipmentRental ?? 0,
    formula: `${formatQty(numDias)} días × ${formatPrice(regulated.alquiler ?? 0)} €/día`,
  });

  if (breakdown.maintenanceCost && breakdown.maintenanceCost > 0) {
    rows.push({ label: 'Servicios adicionales', value: breakdown.maintenanceCost });
  }

  if (breakdown.hydrocarbonTax !== undefined) {
    rows.push({
      label: 'Impuesto hidrocarburos',
      value: breakdown.hydrocarbonTax,
      formula: `${formatQty(energia)} kWh × ${formatPrice(regulated.hydrocarbon ?? 0)} €/kWh`,
    });
  }

  rows.push({
    label: `IVA (${formatPct(regulated.iva ?? 0)}%)`,
    value: breakdown.vat ?? 0,
    formula: `Base imponible × ${formatPct(regulated.iva ?? 0)}%`,
  });

  return rows;
};
