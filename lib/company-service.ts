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
    // Fetch companies and rates in parallel
    const [companiesResponse, ratesResponse] = await Promise.all([
      authGetFetch('companies/', jwtToken),
      authGetFetch('rates/', jwtToken)
    ]);
    
    if (!companiesResponse.ok || !ratesResponse.ok) {
      console.error('Error loading companies or rates from backend');
      return getDefaultTariffs();
    }
    
    const companies = await companiesResponse.json();
    const rates = await ratesResponse.json();
    
    // Create a map of company rates for quick lookup
    const companyRatesMap = new Map<number, any[]>();
    rates.forEach((rate: any) => {
      if (!companyRatesMap.has(rate.companyId)) {
        companyRatesMap.set(rate.companyId, []);
      }
      companyRatesMap.get(rate.companyId)?.push(rate);
    });
    
    // Transform companies and their rates to tariff format
    const tariffs: CompanyTariff[] = [];
    
    companies.forEach((company: any) => {
      const companyRates = companyRatesMap.get(company.id) || [];
      
      if (company.type === 'Luz') {
        // If company has specific rates, use them
        if (companyRates.length > 0) {
          companyRates.forEach((rate: any) => {
            if (rate.type) {
              const powerPrices = [
                rate.powerSlot1 || 0.10,
                rate.powerSlot2 || 0.05,
                rate.powerSlot3 || 0.04,
                rate.powerSlot4 || 0.03,
                rate.powerSlot5 || 0.02,
                rate.powerSlot6 || 0.01
              ];
              
              const energyPrices = [
                rate.energySlot1 || 0.15,
                rate.energySlot2 || 0.08,
                rate.energySlot3 || 0.04,
                rate.energySlot4 || 0.03,
                rate.energySlot5 || 0.02,
                rate.energySlot6 || 0.01
              ];
              
              const surplusPrice = rate.surplusSlot1 || 0.05;
              
              // Determine customer type based on rate type
              const customerType = rate.type === '2.0' ? 'residencial' : 'empresa';
              
              // Adjust array sizes based on tariff type
              let finalPowerPrices = powerPrices;
              let finalEnergyPrices = energyPrices;
              
              if (rate.type === '2.0') {
                finalPowerPrices = powerPrices.slice(0, 2);
                finalEnergyPrices = energyPrices.slice(0, 3);
              } else if (rate.type === '3.0' || rate.type === '6.1') {
                finalPowerPrices = powerPrices.slice(0, 6);
                finalEnergyPrices = energyPrices.slice(0, 6);
              }
              
              tariffs.push({
                id: `${company.id}-rate-${rate.id}`,
                type: 'luz',
                customerType: customerType,
                companyName: company.name,
                tariffName: rate.name || `${company.name} ${rate.type}`,
                tariffType: rate.type,
                powerPrices: finalPowerPrices,
                energyPrices: finalEnergyPrices,
                surplusPrice: surplusPrice,
              });
            }
          });
        } else {
          // No rates defined, generate default tariffs with varied prices
          const priceVariation = (company.id % 10) * 0.01; // Use company ID for price variation
          
          // Generate residential 2.0 tariff
          tariffs.push({
            id: `${company.id}-residential-20`,
            type: 'luz',
            customerType: 'residencial',
            companyName: company.name,
            tariffName: `${company.name} Residencial`,
            tariffType: '2.0',
            powerPrices: [0.10 + priceVariation, 0.05 + priceVariation],
            energyPrices: [0.15 + priceVariation, 0.08 + priceVariation, 0.04 + priceVariation],
            surplusPrice: 0.05 + priceVariation,
          });
          
          // Generate business 3.0 tariff
          tariffs.push({
            id: `${company.id}-business-30`,
            type: 'luz',
            customerType: 'empresa',
            companyName: company.name,
            tariffName: `${company.name} Empresa 3.0`,
            tariffType: '3.0',
            powerPrices: [
              0.12 + priceVariation, 
              0.08 + priceVariation, 
              0.06 + priceVariation, 
              0.05 + priceVariation, 
              0.04 + priceVariation, 
              0.03 + priceVariation
            ],
            energyPrices: [
              0.16 + priceVariation, 
              0.12 + priceVariation, 
              0.08 + priceVariation, 
              0.06 + priceVariation, 
              0.05 + priceVariation, 
              0.04 + priceVariation
            ],
            surplusPrice: 0.06 + priceVariation,
          });
          
          // Generate business 6.1 tariff
          tariffs.push({
            id: `${company.id}-business-61`,
            type: 'luz',
            customerType: 'empresa',
            companyName: company.name,
            tariffName: `${company.name} Empresa 6.1`,
            tariffType: '6.1',
            powerPrices: [
              0.13 + priceVariation, 
              0.07 + priceVariation, 
              0.07 + priceVariation, 
              0.07 + priceVariation, 
              0.07 + priceVariation, 
              0.07 + priceVariation
            ],
            energyPrices: [
              0.17 + priceVariation, 
              0.11 + priceVariation, 
              0.06 + priceVariation, 
              0.00, 
              0.00, 
              0.00
            ],
            surplusPrice: 0.07 + priceVariation,
          });
        }
      } else if (company.type === 'Gas') {
        // For gas companies, check if there are specific rates
        if (companyRates.length > 0) {
          companyRates.forEach((rate: any) => {
            // Use finalPrice as fixedPrice for gas rates
            const fixedPrice = rate.finalPrice || rate.powerSlot1 || 0.20;
            const energyPrice = rate.energySlot1 || 0.08;
            
            tariffs.push({
              id: `${company.id}-rate-${rate.id}`,
              type: 'gas',
              customerType: 'residencial',
              companyName: company.name,
              tariffName: rate.name || `${company.name} Gas`,
              tariffType: 'RL.1',
              fixedPrice: fixedPrice,
              energyPrice: energyPrice,
            });
          });
        } else {
          // No rates defined, generate default with variation
          const priceVariation = (company.id % 10) * 0.01;
          
          // Generate residential RL.1 tariff
          tariffs.push({
            id: `${company.id}-residential-rl1`,
            type: 'gas',
            customerType: 'residencial',
            companyName: company.name,
            tariffName: `${company.name} RL.1`,
            tariffType: 'RL.1',
            fixedPrice: 0.20 + priceVariation,
            energyPrice: 0.08 + priceVariation,
          });
          
          // Generate business RL.2 tariff
          tariffs.push({
            id: `${company.id}-business-rl2`,
            type: 'gas',
            customerType: 'empresa',
            companyName: company.name,
            tariffName: `${company.name} RL.2`,
            tariffType: 'RL.2',
            fixedPrice: 0.25 + priceVariation,
            energyPrice: 0.07 - priceVariation * 0.5,
          });
          
          // Generate business RL.3 tariff
          tariffs.push({
            id: `${company.id}-business-rl3`,
            type: 'gas',
            customerType: 'empresa',
            companyName: company.name,
            tariffName: `${company.name} RL.3`,
            tariffType: 'RL.3',
            fixedPrice: 0.30 + priceVariation,
            energyPrice: 0.065 - priceVariation * 0.5,
          });
        }
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