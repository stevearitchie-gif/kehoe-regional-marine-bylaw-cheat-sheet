'use client';

import { useState } from 'react';
import type { Bylaw } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldView } from '@/components/field-view';
import { AdminView } from '@/components/admin-view';
import { Building, Users } from 'lucide-react';
import { deleteBylawRecord } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type BylawManagerProps = {
  initialRecords: Bylaw[];
};

export function BylawManager({ initialRecords }: BylawManagerProps) {
  const [records, setRecords] = useState<Bylaw[]>(initialRecords);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Bylaw | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<Bylaw | null>(null);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const { toast } = useToast();

  const handleRecordAdd = (newRecord: Bylaw) => {
    setRecords((prevRecords) => [...prevRecords, newRecord]);
  };

  const handleSaveFromDialog = (savedRecord: Bylaw) => {
    if (editingRecord) {
       setRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.id === savedRecord.id ? savedRecord : record
        )
      );
    } else {
       setRecords((prevRecords) => [...prevRecords, savedRecord]);
    }
    setDialogOpen(false);
    setEditingRecord(null);
  }
  
  const handleRecordDelete = (deletedRecordId: string) => {
    setRecords((prevRecords) =>
      prevRecords.filter((record) => record.id !== deletedRecordId)
    );
  };

  const handleOpenAddDialog = () => {
    setEditingRecord(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (record: Bylaw) => {
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
  };

  const handleOpenDeleteAlert = (record: Bylaw) => {
    setRecordToDelete(record);
    setAlertOpen(true);
  }

  const handleCloseDeleteAlert = () => {
    setRecordToDelete(null);
    setAlertOpen(false);
  }

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    
    const result = await deleteBylawRecord(recordToDelete.id);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      handleRecordDelete(recordToDelete.id);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    
    handleCloseDeleteAlert();
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
          onSaveFromDialog={handleSaveFromDialog}
          isDialogOpen={isDialogOpen}
          editingRecord={editingRecord}
          onOpenAddDialog={handleOpenAddDialog}
          onOpenEditDialog={handleOpenEditDialog}
          onCloseDialog={handleCloseDialog}
          isAlertOpen={isAlertOpen}
          recordToDelete={recordToDelete}
          onOpenDeleteAlert={handleOpenDeleteAlert}
          onCloseDeleteAlert={handleCloseDeleteAlert}
          onConfirmDelete={handleConfirmDelete}
        />
      </TabsContent>
    </Tabs>
  );
}
