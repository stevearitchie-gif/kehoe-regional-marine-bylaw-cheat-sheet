
import { z } from 'zod';

export const bylawSchema = z.object({
  id: z.string(),
  municipality: z.string().min(1, 'Municipality is required'),
  region: z.string().min(1, 'Region is required'),
  contactName: z.string().optional(),
  contactMethod: z.string().optional(),
  conservationAuthority: z.string().min(1, 'Conservation Authority is required'),
  areaRegulation: z.string().optional(),
  perimeterRegulation: z.string().optional(),
  widthRegulation: z.string().optional(),
  lengthRegulation: z.string().optional(),
  sideLotSetback: z.string().optional(),
  lotLineProjection: z.string().optional(),
  heightLimit: z.string().optional(),
  permitRequirements: z.string().optional(),
  status: z.enum(['Verified', 'Needs review', 'Missing fields', 'Needs source link']),
  lastVerified: z.string().min(1, 'Last verified date is required'),
  notes: z.string().optional(),
});
