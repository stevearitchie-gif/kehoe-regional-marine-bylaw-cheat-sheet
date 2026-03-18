'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Bylaw } from '@/lib/types';
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
} from "@/components/ui/alert-dialog"

type RecordsViewProps = {
  records: Bylaw[];
  onSave: (record: Bylaw) => void;
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


export function RecordsView({
  records,
  onSave,
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
}: RecordsViewProps) {

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Manage Records</h2>
        <Button onClick={onOpenAddDialog}>
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
                      <DropdownMenuItem onClick={() => onOpenEditDialog(record)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenDeleteAlert(record)} className="text-destructive focus:text-destructive">
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
      {isDialogOpen && (
          <RecordFormDialog
            open={isDialogOpen}
            record={editingRecord}
            onSave={onSave}
            onClose={onCloseDialog}
          />
      )}
      <AlertDialog open={isAlertOpen} onOpenChange={(isOpen) => !isOpen && onCloseDeleteAlert()}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this record?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the bylaw record for <span className="font-semibold">{recordToDelete?.municipality}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={onCloseDeleteAlert}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
