'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Bylaw, BylawData } from '@/lib/types';
import { RecordFormDialog } from './record-form-dialog';
import { StatusBadge } from './status-badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type RecordsViewProps = {
  records: Bylaw[];
  onRecordAdd: (record: Bylaw) => void;
  onRecordUpdate: (record: Bylaw) => void;
  onRecordDelete: (id: string) => void;
};

export function RecordsView({
  records,
  onRecordAdd,
  onRecordUpdate,
  onRecordDelete,
}: RecordsViewProps) {
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Bylaw | Partial<BylawData> | null>(null);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Bylaw | null>(null);

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

  const handleSave = async (data: BylawData, id?: string) => {
    try {
      const firestorePayload = {
        municipality: data.municipality,
        region: data.region,
        contactName: data.contactName ?? '',
        contactMethod: data.contactMethod ?? '',
        conservationAuthority: data.conservationAuthority ?? '',
        conservationAuthorityRules: data.conservationAuthorityRules ?? '',
        conservationAuthoritySourceLink: data.conservationAuthoritySourceLink ?? '',
        conservationAuthoritySourceSection: data.conservationAuthoritySourceSection ?? '',
        ...(data.parksCanadaApplies !== undefined ? { parksCanadaApplies: data.parksCanadaApplies } : {}),
        parksCanadaRules: data.parksCanadaRules ?? '',
        parksCanadaSourceLink: data.parksCanadaSourceLink ?? '',
        parksCanadaSourceSection: data.parksCanadaSourceSection ?? '',
        ...(data.mnrApplies !== undefined ? { mnrApplies: data.mnrApplies } : {}),
        mnrRules: data.mnrRules ?? '',
        mnrSourceLink: data.mnrSourceLink ?? '',
        mnrSourceSection: data.mnrSourceSection ?? '',
        authorityGeneralNotes: data.authorityGeneralNotes ?? '',
        areaRule: data.areaRegulation ?? '',
        perimeterRule: data.perimeterRegulation ?? '',
        widthRule: data.widthRegulation ?? '',
        lengthRule: data.lengthRegulation ?? '',
        sideLotSetback: data.sideLotSetback ?? '',
        lotLineProjection: data.lotLineProjection ?? '',
        heightRule: data.heightLimit ?? '',
        permitRule: data.permitRequirements ?? '',
        sourceLink: data.sourceLink ?? '',
        sourceSection: data.sourceSection ?? '',
        sourceStatus: data.status ?? 'Needs review',
        lastVerified: data.lastVerified ?? '',
        lastSourceCheck: data.lastSourceCheck ?? "",
        notes: data.notes ?? '',
      };

      if (id) {
        await updateDoc(doc(db, 'municipalities', id), firestorePayload);
        onRecordUpdate({ ...data, id });
        toast({ title: 'Success', description: 'Record updated successfully.' });
      } else {
        const docRef = await addDoc(collection(db, 'municipalities'), firestorePayload);
        onRecordAdd({ ...data, id: docRef.id });
        toast({ title: 'Success', description: 'Record added successfully.' });
      }

      handleCloseDialog();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save record.',
      });
    }
  };

  const handleOpenDeleteAlert = (record: Bylaw) => {
    setRecordToDelete(record);
    setAlertOpen(true);
  };

  const handleCloseDeleteAlert = () => {
    setRecordToDelete(null);
    setAlertOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      await deleteDoc(doc(db, 'municipalities', recordToDelete.id));
      onRecordDelete(recordToDelete.id);
      toast({ title: 'Success', description: 'Record deleted successfully.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete record.',
      });
    }

    setAlertOpen(false);
    setRecordToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Manage Records</h2>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Municipality</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.municipality}</TableCell>
                <TableCell>{record.region}</TableCell>
                <TableCell>
                  <StatusBadge status={record.status} />
                </TableCell>
                <TableCell>{record.lastVerified}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEditDialog(record)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenDeleteAlert(record)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RecordFormDialog
        key={editingRecord ? ('id' in editingRecord ? editingRecord.id : 'new') : 'closed'}
        open={isDialogOpen}
        record={editingRecord}
        onSave={handleSave}
        onClose={handleCloseDialog}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={(isOpen) => !isOpen && handleCloseDeleteAlert()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bylaw record for{' '}
              <span className="font-semibold">{recordToDelete?.municipality}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteAlert}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}