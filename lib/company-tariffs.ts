import type { CompanyTariff } from './types';

export const mockCompanyTariffs: CompanyTariff[] = [
  {
    id: 'iber-plan-noche',
    type: 'luz',
    customerType: 'residencial',
    companyName: 'Iberdrola',
    tariffName: 'Plan Noche',
    tariffType: '2.0',
    powerPrices: [0.10, 0.05],
    energyPrices: [0.15, 0.08, 0.04],
    surplusPrice: 0.05,
  },
  {
    id: 'endesa-one-luz',
    type: 'luz',
    customerType: 'residencial',
    companyName: 'Endesa',
    tariffName: 'One Luz',
    tariffType: '2.0',
    powerPrices: [0.12, 0.06],
    energyPrices: [0.16, 0.10, 0.05],
    surplusPrice: 0.06,
  },
  {
    id: 'naturgy-tarifa-plana',
    type: 'luz',
    customerType: 'residencial',
    companyName: 'Naturgy',
    tariffName: 'Tarifa Plana Zen',
    tariffType: '2.0',
    powerPrices: [0.11, 0.11],
    energyPrices: [0.14, 0.14, 0.14],
    surplusPrice: 0.04,
  },
   {
    id: 'repsol-tarifa-ahorro',
    type: 'luz',
    customerType: 'empresa',
    companyName: 'Repsol',
    tariffName: 'Tarifa Ahorro Plus',
    tariffType: '6.1',
    powerPrices: [0.13, 0.07, 0.07, 0.07, 0.07, 0.07],
    energyPrices: [0.17, 0.11, 0.06, 0.0, 0.0, 0.0],
    surplusPrice: 0.07,
  },
  {
    id: 'gas-tarifa-eco-1',
    type: 'gas',
    customerType: 'residencial',
    companyName: 'GasNatural',
    tariffName: 'EcoGas RL.1',
    tariffType: 'RL.1',
    fixedPrice: 0.20, // €/day
    energyPrice: 0.08, // €/kWh
  },
  {
    id: 'gas-tarifa-confort-2',
    type: 'gas',
    customerType: 'empresa',
    companyName: 'EndesaGas',
    tariffName: 'Confort RL.2',
    tariffType: 'RL.2',
    fixedPrice: 0.25, // €/day
    energyPrice: 0.07, // €/kWh
  }
];
