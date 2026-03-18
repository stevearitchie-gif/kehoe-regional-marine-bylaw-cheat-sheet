
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardView } from '@/components/dashboard-view';
import { RecordsView } from '@/components/records-view';
import { DataExtractorView } from '@/components/data-extractor-view';
import { LayoutDashboard, List, Wand2 } from 'lucide-react';
import type { Bylaw } from '@/lib/types';

export function AdminView({ records }: { records: Bylaw[] }) {
  return (
    <Tabs defaultValue="dashboard" className="flex flex-col h-full">
      <TabsList className="mb-4">
        <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
        </TabsTrigger>
        <TabsTrigger value="records">
            <List className="mr-2 h-4 w-4" />
            Records
        </TabsTrigger>
        <TabsTrigger value="extractor">
            <Wand2 className="mr-2 h-4 w-4" />
            Data Extractor
        </TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="flex-grow">
        <DashboardView records={records} />
      </TabsContent>
      <TabsContent value="records" className="flex-grow">
        <RecordsView initialRecords={records} />
      </TabsContent>
      <TabsContent value="extractor" className="flex-grow">
        <DataExtractorView />
      </TabsContent>
    </Tabs>
  );
}
