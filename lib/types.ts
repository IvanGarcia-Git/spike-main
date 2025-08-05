export type ComparisonType = 'luz' | 'gas';
export type CustomerType = 'residencial' | 'empresa';

export interface Tariff {
  id: string;
  provider: string;
  tariffName: string;
  price: number; // in $/kWh
  contractLength: number; // in months
  renewableEnergyPercentage: number;
  otherBenefits: string;
  providerLogoUrl: string;
}

export interface UserData {
  location: string;
  consumption: number; // monthly in kWh
}

export interface ProcessedTariff extends Tariff {
  annualCost: number;
}

export interface Recommendation extends ProcessedTariff {
  reasons: string[];
}

export interface ComparisonResult {
  recommended: Recommendation;
  allTariffs: ProcessedTariff[];
}


export interface CompanyTariffBase {
  id: string;
  type: ComparisonType;
  customerType: CustomerType;
  companyName: string;
  tariffName: string;
  maintenanceCost?: number;
}

export interface CompanyLightTariff extends CompanyTariffBase {
    type: 'luz';
    tariffType: '2.0' | '3.0' | '6.1';
    powerPrices: number[];
    energyPrices: number[];
    surplusPrice: number;
}

export interface CompanyGasTariff extends CompanyTariffBase {
    type: 'gas';
    tariffType: 'RL.1' | 'RL.2' | 'RL.3';
    fixedPrice: number; // €/day
    energyPrice: number; // €/kWh
}

export type CompanyTariff = CompanyLightTariff | CompanyGasTariff;


export interface BillBreakdown {
  powerCosts?: number[];
  energyCosts?: number[];
  fixedCost?: number;
  energyCost?: number;
  surplusCredit?: number;
  socialBonus?: number;
  equipmentRental?: number;
  maintenanceCost?: number;
  electricityTax?: number;
  hydrocarbonTax?: number;
  vat: number;
}

export interface TariffComparisonResult {
  tariff: CompanyTariff,
  totalCost: number;
  breakdown: BillBreakdown;
}

export interface PdfData {
  bestTariff: TariffComparisonResult;
  currentBillAmount: number;
  annualSaving: number;
  monthlySaving: number;
  clientName: string;
  showCurrentBill: boolean;
  comparisonType: 'luz' | 'gas';
  // Luz
  potencias?: number[];
  energias?: number[];
  excedentes?: number;
  // Gas
  energia?: number;
  
  numDias: number;

  clientPrices?: {
    // Luz
    power?: number[];
    energy?: number[];
    surplus?: number;
    // Gas
    fixed?: number;
    variable?: number;
    // Common
    maintenance?: number;
  };
  regulatedCosts: {
    // Luz
    ihp?: number;
    alquiler: number;
    social?: number;
    // Gas
    hydrocarbon?: number,
    // Comun
    iva: number;
  };
}
