
import type { z } from 'zod';
import type { bylawSchema } from '@/lib/schema';

export type BylawStatus = 'Verified' | 'Needs review' | 'Missing fields' | 'Needs source link';

export type Bylaw = z.infer<typeof bylawSchema>;

export type BylawData = Omit<Bylaw, 'id'>;
