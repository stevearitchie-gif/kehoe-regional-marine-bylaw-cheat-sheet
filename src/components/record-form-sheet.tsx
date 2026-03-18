'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bylawSchema } from '@/lib/schema';
import type { Bylaw, BylawStatus } from '@/lib/types';
import { addBylawRecord, updateBylawRecord } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { useRouter } from 'next/navigation';

type RecordFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Bylaw | null;
  onFormSubmit: () => void;
};

const statusOptions: BylawStatus[] = ['Verified', 'Needs review', 'Missing fields', 'Needs source link'];

export function RecordFormSheet({ open, onOpenChange, record, onFormSubmit }: RecordFormSheetProps) {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<Bylaw>({
    resolver: zodResolver(bylawSchema),
    defaultValues: record || {
      id: '',
      municipality: '',
      region: '',
      contactName: '',
      contactMethod: '',
      conservationAuthority: '',
      areaRegulation: '',
      perimeterRegulation: '',
      widthRegulation: '',
      lengthRegulation: '',
      sideLotSetback: '',
      lotLineProjection: '',
      heightLimit: '',
      permitRequirements: '',
      status: 'Needs review',
      lastVerified: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(record || {
        id: '',
        municipality: '',
        region: '',
        contactName: '',
        contactMethod: '',
        conservationAuthority: '',
        areaRegulation: '',
        perimeterRegulation: '',
        widthRegulation: '',
        lengthRegulation: '',
        sideLotSetback: '',
        lotLineProjection: '',
        heightLimit: '',
        permitRequirements: '',
        status: 'Needs review',
        lastVerified: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [record, open, form]);

  const onSubmit = async (data: Bylaw) => {
    const dataToSend = { ...data };
    // remove id from data for both add and update
    const { id, ...bylawData } = dataToSend;

    const result = record
      ? await updateBylawRecord(record.id, bylawData)
      : await addBylawRecord(bylawData);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      router.refresh();
      onFormSubmit();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
      onFormSubmit();
    }
  };

  const fieldGroups = [
    {
      title: 'Primary Information',
      fields: ['municipality', 'region', 'conservationAuthority']
    },
    {
      title: 'Contact',
      fields: ['contactName', 'contactMethod']
    },
    {
      title: 'Regulations',
      fields: ['areaRegulation', 'perimeterRegulation', 'widthRegulation', 'lengthRegulation', 'sideLotSetback', 'lotLineProjection', 'heightLimit']
    },
    {
      title: 'Administrative',
      fields: ['permitRequirements', 'status', 'lastVerified']
    }
  ];

  const fieldLabels: Record<string, string> = {
    municipality: 'Municipality',
    region: 'Region',
    conservationAuthority: 'Conservation Authority',
    contactName: 'Contact Name',
    contactMethod: 'Contact Method',
    areaRegulation: 'Area Regulation',
    perimeterRegulation: 'Perimeter Regulation',
    widthRegulation: 'Width Regulation',
    lengthRegulation: 'Length Regulation',
    sideLotSetback: 'Side Lot Setback',
    lotLineProjection: 'Lot Line Projection',
    heightLimit: 'Height Limit',
    permitRequirements: 'Permit Requirements',
    status: 'Status',
    lastVerified: 'Last Verified Date',
    notes: 'Notes'
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{record ? 'Edit Record' : 'Add New Record'}</SheetTitle>
          <SheetDescription>
            {record ? `Editing the bylaw record for ${record.municipality}.` : 'Add a new bylaw record to the system.'}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <form id="record-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            {fieldGroups.map(group => (
              <div key={group.title} className="space-y-4">
                <h4 className="font-semibold text-lg">{group.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.fields.map(fieldName => (
                    <div key={fieldName} className={['municipality', 'region', 'conservationAuthority'].includes(fieldName) ? 'md:col-span-2' : ''}>
                      <Label htmlFor={fieldName}>{fieldLabels[fieldName]}</Label>
                      {fieldName === 'status' ? (
                        <Select onValueChange={(value) => form.setValue(fieldName as keyof Bylaw, value)} defaultValue={form.getValues(fieldName as keyof Bylaw) as string}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input id={fieldName} type={fieldName === 'lastVerified' ? 'date' : 'text'} {...form.register(fieldName as keyof Bylaw)} />
                      )}
                      {form.formState.errors[fieldName as keyof Bylaw] && <p className="text-sm text-destructive mt-1">{form.formState.errors[fieldName as keyof Bylaw]?.message}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="notes">{fieldLabels['notes']}</Label>
              <Textarea id="notes" {...form.register('notes')} rows={5} />
            </div>
          </form>
        </ScrollArea>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="submit" form="record-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
