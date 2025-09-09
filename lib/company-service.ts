import { authGetFetch } from '@/helpers/server-fetch.helper';
import { getCookie } from 'cookies-next';
import type { CompanyTariff } from './types';

/**
 * Fetches companies from the backend and transforms them into tariff format
 * @returns Array of company tariffs
 */
export async function getCompanyTariffs(): Promise<CompanyTariff[]> {
  const jwtToken = getCookie('factura-token');
  
  try {
    const response = await authGetFetch('companies/', jwtToken);
    
    if (!response.ok) {
      console.error('Error loading companies from backend');
      return getDefaultTariffs();
    }
    
    const companies = await response.json();
    
    // Transform companies to tariff format
    const tariffs: CompanyTariff[] = [];
    
    companies.forEach((company: any) => {
      // Generate tariffs based on company type
      if (company.type === 'Luz') {
        // Generate residential 2.0 tariff
        tariffs.push({
          id: `${company.id}-residential-20`,
          type: 'luz',
          customerType: 'residencial',
          companyName: company.name,
          tariffName: `${company.name} Residencial`,
          tariffType: '2.0',
          powerPrices: [0.10, 0.05], // Default prices P1, P2
          energyPrices: [0.15, 0.08, 0.04], // Default prices E1, E2, E3
          surplusPrice: 0.05,
        });
        
        // Generate business 3.0 tariff
        tariffs.push({
          id: `${company.id}-business-30`,
          type: 'luz',
          customerType: 'empresa',
          companyName: company.name,
          tariffName: `${company.name} Empresa 3.0`,
          tariffType: '3.0',
          powerPrices: [0.12, 0.08, 0.06, 0.05, 0.04, 0.03],
          energyPrices: [0.16, 0.12, 0.08, 0.06, 0.05, 0.04],
          surplusPrice: 0.06,
        });
        
        // Generate business 6.1 tariff
        tariffs.push({
          id: `${company.id}-business-61`,
          type: 'luz',
          customerType: 'empresa',
          companyName: company.name,
          tariffName: `${company.name} Empresa 6.1`,
          tariffType: '6.1',
          powerPrices: [0.13, 0.07, 0.07, 0.07, 0.07, 0.07],
          energyPrices: [0.17, 0.11, 0.06, 0.0, 0.0, 0.0],
          surplusPrice: 0.07,
        });
      } else if (company.type === 'Gas') {
        // Generate residential RL.1 tariff
        tariffs.push({
          id: `${company.id}-residential-rl1`,
          type: 'gas',
          customerType: 'residencial',
          companyName: company.name,
          tariffName: `${company.name} RL.1`,
          tariffType: 'RL.1',
          fixedPrice: 0.20,
          energyPrice: 0.08,
        });
        
        // Generate business RL.2 tariff
        tariffs.push({
          id: `${company.id}-business-rl2`,
          type: 'gas',
          customerType: 'empresa',
          companyName: company.name,
          tariffName: `${company.name} RL.2`,
          tariffType: 'RL.2',
          fixedPrice: 0.25,
          energyPrice: 0.07,
        });
        
        // Generate business RL.3 tariff
        tariffs.push({
          id: `${company.id}-business-rl3`,
          type: 'gas',
          customerType: 'empresa',
          companyName: company.name,
          tariffName: `${company.name} RL.3`,
          tariffType: 'RL.3',
          fixedPrice: 0.30,
          energyPrice: 0.065,
        });
      }
    });
    
    return tariffs;
  } catch (error) {
    console.error('Error fetching companies:', error);
    return getDefaultTariffs();
  }
}

/**
 * Returns default tariffs as fallback
 */
function getDefaultTariffs(): CompanyTariff[] {
  return [
    {
      id: 'default-luz-20',
      type: 'luz',
      customerType: 'residencial',
      companyName: 'Tarifa Estándar',
      tariffName: 'Tarifa Estándar 2.0',
      tariffType: '2.0',
      powerPrices: [0.10, 0.05],
      energyPrices: [0.15, 0.08, 0.04],
      surplusPrice: 0.05,
    },
    {
      id: 'default-luz-30',
      type: 'luz',
      customerType: 'empresa',
      companyName: 'Tarifa Estándar',
      tariffName: 'Tarifa Estándar 3.0',
      tariffType: '3.0',
      powerPrices: [0.12, 0.08, 0.06, 0.05, 0.04, 0.03],
      energyPrices: [0.16, 0.12, 0.08, 0.06, 0.05, 0.04],
      surplusPrice: 0.06,
    },
    {
      id: 'default-luz-61',
      type: 'luz',
      customerType: 'empresa',
      companyName: 'Tarifa Estándar',
      tariffName: 'Tarifa Estándar 6.1',
      tariffType: '6.1',
      powerPrices: [0.13, 0.07, 0.07, 0.07, 0.07, 0.07],
      energyPrices: [0.17, 0.11, 0.06, 0.0, 0.0, 0.0],
      surplusPrice: 0.07,
    },
    {
      id: 'default-gas-rl1',
      type: 'gas',
      customerType: 'residencial',
      companyName: 'Tarifa Estándar',
      tariffName: 'Tarifa Estándar RL.1',
      tariffType: 'RL.1',
      fixedPrice: 0.20,
      energyPrice: 0.08,
    },
    {
      id: 'default-gas-rl2',
      type: 'gas',
      customerType: 'empresa',
      companyName: 'Tarifa Estándar',
      tariffName: 'Tarifa Estándar RL.2',
      tariffType: 'RL.2',
      fixedPrice: 0.25,
      energyPrice: 0.07,
    },
    {
      id: 'default-gas-rl3',
      type: 'gas',
      customerType: 'empresa',
      companyName: 'Tarifa Estándar',
      tariffName: 'Tarifa Estándar RL.3',
      tariffType: 'RL.3',
      fixedPrice: 0.30,
      energyPrice: 0.065,
    },
  ];
}