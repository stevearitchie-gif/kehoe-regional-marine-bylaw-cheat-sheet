
import { Building } from 'lucide-react';
import { getBylawRecords } from '@/app/actions';
import type { Bylaw } from '@/lib/types';
import { BylawManager } from '@/components/bylaw-manager';

export default async function BylawsPage() {
  const records: Bylaw[] = await getBylawRecords();

  return (
    <div className="flex-grow flex flex-col">
      <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
        <div className="container mx-auto px-4 md:px-8">
            <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-3">
                    <Building className="h-7 w-7 text-primary" />
                    <h1 className="text-xl font-bold text-foreground">
                        Regional Marine Bylaw Cheat Sheet
                    </h1>
                </div>
            </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 md:px-8">
        <BylawManager initialRecords={records} />
      </main>
    </div>
  );
}
