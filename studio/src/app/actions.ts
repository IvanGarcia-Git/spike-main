"use server";

import { fillContractTemplate, FillContractTemplateInput, FillContractTemplateOutput } from "@/ai/flows/smart-contract-filling";

export async function generateContractAction(input: FillContractTemplateInput): Promise<FillContractTemplateOutput> {
  // Here you could add validation, user authentication checks, etc.
  const result = await fillContractTemplate(input);
  return result;
}
