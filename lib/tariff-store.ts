import { mockCompanyTariffs as initialTariffs } from '@/lib/company-tariffs';
import type { CompanyTariff } from './types';

// In-memory store. Using deep copy to avoid module caching issues with mutable objects.
let tariffs: CompanyTariff[] = JSON.parse(JSON.stringify(initialTariffs));

/**
 * Returns a deep copy of all tariffs to prevent direct mutation.
 */
export function getTariffs(): CompanyTariff[] {
  return JSON.parse(JSON.stringify(tariffs));
}

/**
 * Updates an existing tariff.
 * @param updatedTariff The full tariff object with updated data.
 */
export function updateTariff(updatedTariff: CompanyTariff): void {
  const index = tariffs.findIndex(t => t.id === updatedTariff.id);
  if (index !== -1) {
    tariffs[index] = { ...tariffs[index], ...updatedTariff };
  }
}

/**
 * Adds a new tariff to the store.
 * @param newTariffData The data for the new tariff, without an ID.
 * @returns The newly created tariff with an ID.
 */
export function addTariff(newTariffData: Omit<CompanyTariff, 'id'>): CompanyTariff {
    const newTariff: CompanyTariff = {
        ...newTariffData,
        id: `tariff-${Date.now()}-${Math.random()}`,
    } as CompanyTariff;
    tariffs.push(newTariff);
    return newTariff;
}

/**
 * Deletes a tariff from the store.
 * @param tariffId The ID of the tariff to delete.
 */
export function deleteTariff(tariffId: string): void {
  tariffs = tariffs.filter(t => t.id !== tariffId);
}
