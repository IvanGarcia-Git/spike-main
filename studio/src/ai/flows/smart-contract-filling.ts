// use server'

/**
 * @fileOverview Flujo de IA para rellenar una plantilla de contrato con los datos proporcionados.
 *
 * - fillContractTemplate - Función para rellenar la plantilla del contrato.
 * - FillContractTemplateInput - Tipo de entrada para la función fillContractTemplate.
 * - FillContractTemplateOutput - Tipo de salida para la función fillContractTemplate.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FillContractTemplateInputSchema = z.object({
  template: z
    .string()
    .describe('La plantilla de contrato a rellenar, con marcadores de posición para los datos.'),
  formData: z
    .record(z.string())
    .describe('Un registro de pares clave-valor que representan los datos del formulario para rellenar la plantilla.'),
});
export type FillContractTemplateInput = z.infer<
  typeof FillContractTemplateInputSchema
>;

const FillContractTemplateOutputSchema = z.object({
  filledContract: z
    .string()
    .describe('La plantilla del contrato rellenada con los datos del formulario proporcionados.'),
});
export type FillContractTemplateOutput = z.infer<
  typeof FillContractTemplateOutputSchema
>;

export async function fillContractTemplate(
  input: FillContractTemplateInput
): Promise<FillContractTemplateOutput> {
  return fillContractTemplateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fillContractTemplatePrompt',
  input: {schema: FillContractTemplateInputSchema},
  output: {schema: FillContractTemplateOutputSchema},
  prompt: `Eres un asistente de IA especializado en rellenar plantillas de contratos con los datos proporcionados.

  Rellena la plantilla de contrato a continuación con los datos proporcionados en el objeto formData.
  Devuelve el contrato rellenado como una cadena de texto.

  Plantilla de Contrato:
  {{template}}

  Datos del Formulario:
  {{#each formData}}
    {{@key}}: {{{this}}}
  {{/each}}`,
});

const fillContractTemplateFlow = ai.defineFlow(
  {
    name: 'fillContractTemplateFlow',
    inputSchema: FillContractTemplateInputSchema,
    outputSchema: FillContractTemplateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
