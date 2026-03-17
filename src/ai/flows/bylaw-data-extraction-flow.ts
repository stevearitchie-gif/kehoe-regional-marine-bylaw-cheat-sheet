'use server';
/**
 * @fileOverview An AI agent that extracts key bylaw parameters from uploaded documents.
 *
 * - extractBylawData - A function that handles the bylaw data extraction process.
 * - BylawDataExtractionInput - The input type for the extractBylawData function.
 * - BylawDataExtractionOutput - The return type for the extractBylawData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BylawDataExtractionInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A bylaw document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type BylawDataExtractionInput = z.infer<typeof BylawDataExtractionInputSchema>;

const BylawDataExtractionOutputSchema = z.object({
  municipality: z.string().optional().describe('The name of the municipality.'),
  region: z.string().optional().describe('The geographic region.'),
  contactName: z.string().optional().describe('The name of the contact person for bylaw inquiries.'),
  contactMethod: z.string().optional().describe('The contact method (e.g., email address) for inquiries.'),
  conservationAuthority: z.string().optional().describe('The name of the relevant conservation authority.'),
  areaRegulation: z.string().optional().describe('Regulations concerning the area of structures or property.'),
  perimeterRegulation: z.string().optional().describe('Regulations concerning the perimeter of structures or property.'),
  widthRegulation: z.string().optional().describe('Regulations concerning the width limits of structures.'),
  lengthRegulation: z.string().optional().describe('Regulations concerning the length limits of structures.'),
  sideLotSetback: z.string().optional().describe('The required setback distance from side lot lines.'),
  lotLineProjection: z.string().optional().describe('Regulations or allowances for lot line projections.'),
  heightLimit: z.string().optional().describe('The maximum allowable height for structures.'),
  permitRequirements: z.string().optional().describe('Details about required permits for construction (e.g., "Yes boathouse").'),
});
export type BylawDataExtractionOutput = z.infer<typeof BylawDataExtractionOutputSchema>;

export async function extractBylawData(input: BylawDataExtractionInput): Promise<BylawDataExtractionOutput> {
  return bylawDataExtractionFlow(input);
}

const bylawDataExtractionPrompt = ai.definePrompt({
  name: 'bylawDataExtractionPrompt',
  input: { schema: BylawDataExtractionInputSchema },
  output: { schema: BylawDataExtractionOutputSchema },
  prompt: `You are an expert in marine construction bylaws. Your task is to accurately extract key bylaw parameters from the provided document.

Read the document carefully and identify the following information for marine construction bylaws:

- Municipality
- Region
- Contact Name
- Contact Method (e.g., email, phone)
- Conservation Authority
- Area Regulations (e.g., "Yes", "N A", specific measurements)
- Perimeter Regulations (e.g., "Yes", "N A", specific measurements)
- Width Regulations (e.g., "20 percent or 15 m")
- Length Regulations (e.g., "Width of frontage", specific measurements)
- Side Lot Setback (e.g., "4.6 m")
- Lot Line Projection (e.g., "4.6 m", "No encroachment stated")
- Height Limit (e.g., "6 m", "5.0 to 6.5 m")
- Permit Requirements (e.g., "Yes boathouse", "Yes boathouse and dock", "No")

If a piece of information is not found or not applicable, omit the field or return null. Focus on extracting factual data directly related to bylaw parameters.

Document: {{media url=documentDataUri}}`,
});

const bylawDataExtractionFlow = ai.defineFlow(
  {
    name: 'bylawDataExtractionFlow',
    inputSchema: BylawDataExtractionInputSchema,
    outputSchema: BylawDataExtractionOutputSchema,
  },
  async (input) => {
    const { output } = await bylawDataExtractionPrompt(input);
    return output!;
  }
);
