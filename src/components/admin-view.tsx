import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardView } from '@/components/dashboard-view';
import { RecordsView } from '@/components/records-view';
import { DataExtractorView } from '@/components/data-extractor-view';
import { LayoutDashboard, List, Wand2 } from 'lucide-react';
import type { Bylaw } from '@/lib/types';

type AdminViewProps = {
  records: Bylaw[];
  onRecordAdd: (record: Bylaw) => void;
  onSaveFromDialog: (record: Bylaw) => void;
  isDialogOpen: boolean;
  editingRecord: Bylaw | null;
  onOpenAddDialog: () => void;
  onOpenEditDialog: (record: Bylaw) => void;
  onCloseDialog: () => void;
  isAlertOpen: boolean;
  recordToDelete: Bylaw | null;
  onOpenDeleteAlert: (record: Bylaw) => void;
  onCloseDeleteAlert: () => void;
  onConfirmDelete: () => Promise<void>;
};

export function AdminView({ 
  records, 
  onRecordAdd, 
  onSaveFromDialog,
  isDialogOpen,
  editingRecord,
  onOpenAddDialog,
  onOpenEditDialog,
  onCloseDialog,
  isAlertOpen,
  recordToDelete,
  onOpenDeleteAlert,
  onCloseDeleteAlert,
  onConfirmDelete,
}: AdminViewProps) {
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
        <RecordsView 
          records={records}
          onSave={onSaveFromDialog}
          isDialogOpen={isDialogOpen}
          editingRecord={editingRecord}
          onOpenAddDialog={onOpenAddDialog}
          onOpenEditDialog={onOpenEditDialog}
          onCloseDialog={onCloseDialog}
          isAlertOpen={isAlertOpen}
          recordToDelete={recordToDelete}
          onOpenDeleteAlert={onOpenDeleteAlert}
          onCloseDeleteAlert={onCloseDeleteAlert}
          onConfirmDelete={onConfirmDelete}
        />
      </TabsContent>
      <TabsContent value="extractor" className="flex-grow">
        <DataExtractorView onRecordAdd={onRecordAdd} />
      </TabsContent>
    </Tabs>
  );
}
