'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { deleteBylawRecord } from '@/app/actions';
import type { Bylaw } from '@/lib/types';
import { RecordFormSheet } from './record-form-sheet';
import { StatusBadge } from './status-badge';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog"

export function RecordsView({ records }: { records: Bylaw[] }) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Bylaw | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<Bylaw | null>(null);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAdd = () => {
    setEditingRecord(null);
    setSheetOpen(true);
  };

  const handleEdit = (record: Bylaw) => {
    setEditingRecord(record);
    setSheetOpen(true);
  };
  
  const handleDelete = (record: Bylaw) => {
    setRecordToDelete(record);
    setAlertOpen(true);
  }

  const confirmDelete = async () => {
    if (!recordToDelete) return;

    const result = await deleteBylawRecord(recordToDelete.id);
    setAlertOpen(false);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setRecordToDelete(null);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingRecord(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Manage Records</h2>
        <Button onClick={handleAdd}>
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
                      <DropdownMenuItem onClick={() => handleEdit(record)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(record)} className="text-destructive focus:text-destructive">
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
      <RecordFormSheet
        open={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
        record={editingRecord}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this record?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the bylaw record for <span className="font-semibold">{recordToDelete?.municipality}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
