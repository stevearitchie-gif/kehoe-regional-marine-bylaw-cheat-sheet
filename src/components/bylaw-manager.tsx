'use client';

import { useState } from 'react';
import type { Bylaw } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldView } from '@/components/field-view';
import { AdminView } from '@/components/admin-view';
import { Building, Users } from 'lucide-react';
import { getBylawRecords } from '@/app/actions';

type BylawManagerProps = {
  initialRecords: Bylaw[];
};

export function BylawManager({ initialRecords }: BylawManagerProps) {
  const [records, setRecords] = useState<Bylaw[]>(initialRecords);

  const refreshBylawRecords = async () => {
    const freshRecords = await getBylawRecords();
    setRecords(freshRecords);
  };

  const handleRecordAdd = (newRecord: Bylaw) => {
    refreshBylawRecords();
  };

  const handleRecordUpdate = (updatedRecord: Bylaw) => {
    refreshBylawRecords();
  };

  const handleRecordDelete = (deletedRecordId: string) => {
    refreshBylawRecords();
  };

  return (
    <Tabs defaultValue="field" className="flex flex-col h-full">
      <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-4">
        <TabsTrigger value="field">
          <Users className="mr-2" />
          Field View
        </TabsTrigger>
        <TabsTrigger value="admin">
          <Building className="mr-2" />
          Admin
        </TabsTrigger>
      </TabsList>
      <TabsContent value="field" className="flex-grow">
        <FieldView records={records} />
      </TabsContent>
      <TabsContent value="admin" className="flex-grow">
        <AdminView
          records={records}
          onRecordAdd={handleRecordAdd}
          onRecordUpdate={handleRecordUpdate}
          onRecordDelete={handleRecordDelete}
        />
      </TabsContent>
    </Tabs>
  );
}
