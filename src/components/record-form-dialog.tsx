'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bylawSchema } from '@/lib/schema';
import type { Bylaw, BylawStatus, BylawData } from '@/lib/types';
import { useEffect } from 'react';

type RecordFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: BylawData, id?: string) => Promise<void>;
  record: Bylaw | Partial<BylawData> | null;
};

const statusOptions: BylawStatus[] = ['Verified', 'Needs review', 'Missing fields', 'Needs source link'];

const textareaFields = new Set([
  'parksCanadaRules',
  'conservationAuthorityRules',
  'mnrRules',
  'authorityGeneralNotes',
]);

const fullWidthFields = new Set([
  'municipality',
  'region',
  'parksCanadaRules',
  'parksCanadaSourceLink',
  'parksCanadaSourceSection',
  'conservationAuthority',
  'conservationAuthorityRules',
  'conservationAuthoritySourceLink',
  'conservationAuthoritySourceSection',
  'mnrRules',
  'mnrSourceLink',
  'mnrSourceSection',
  'authorityGeneralNotes',
]);

export function RecordFormDialog({ open, onClose, onSave, record }: RecordFormDialogProps) {
  const form = useForm<Bylaw>({
    resolver: zodResolver(bylawSchema),
  });

  const {
    reset,
    watch,
    formState: { isSubmitting }
  } = form;

  const isEditing = record && 'id' in record && record.id;
  const recordId = isEditing ? record.id : undefined;

  useEffect(() => {
    if (open) {
      const defaultValues = {
        id: '',
        municipality: '',
        region: '',
        contactName: '',
        contactMethod: '',
        conservationAuthority: '',
        conservationAuthorityRules: '',
        conservationAuthoritySourceLink: '',
        conservationAuthoritySourceSection: '',
        parksCanadaApplies: undefined,
        parksCanadaRules: '',
        parksCanadaSourceLink: '',
        parksCanadaSourceSection: '',
        mnrApplies: undefined,
        mnrRules: '',
        mnrSourceLink: '',
        mnrSourceSection: '',
        authorityGeneralNotes: '',
        areaRegulation: '',
        perimeterRegulation: '',
        widthRegulation: '',
        lengthRegulation: '',
        sideLotSetback: '',
        lotLineProjection: '',
        heightLimit: '',
        permitRequirements: '',
        sourceLink: '',
        sourceSection: '',
        status: 'Needs review',
        lastVerified: new Date().toISOString().split('T')[0],
        notes: '',
        ...record,
      } as Bylaw;

      reset(defaultValues);
    }
  }, [record, open, reset]);

  const onSubmit = async () => {
    const values = form.getValues();
    const { id, ...bylawData } = values;
    await onSave(bylawData, recordId);
  };

  const fieldGroups = [
    {
      title: 'Municipality',
      fields: ['municipality', 'region']
    },
    {
      title: 'Parks Canada',
      fields: ['parksCanadaApplies', 'parksCanadaRules', 'parksCanadaSourceLink', 'parksCanadaSourceSection']
    },
    {
      title: 'Conservation Authority',
      fields: ['conservationAuthority', 'conservationAuthorityRules', 'conservationAuthoritySourceLink', 'conservationAuthoritySourceSection']
    },
    {
      title: 'MNR',
      fields: ['mnrApplies', 'mnrRules', 'mnrSourceLink', 'mnrSourceSection']
    },
    {
      title: 'General Authority Notes',
      fields: ['authorityGeneralNotes']
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
      fields: ['permitRequirements', 'sourceLink', 'sourceSection', 'status', 'lastVerified']
    }
  ];

  const fieldLabels: Record<string, string> = {
    municipality: 'Municipality',
    region: 'Region',
    conservationAuthority: 'Conservation Authority',
    conservationAuthorityRules: 'Conservation Authority Rules',
    conservationAuthoritySourceLink: 'Conservation Authority Source Link',
    conservationAuthoritySourceSection: 'Conservation Authority Source Section',
    parksCanadaApplies: 'Parks Canada Applies',
    parksCanadaRules: 'Parks Canada Rules',
    parksCanadaSourceLink: 'Parks Canada Source Link',
    parksCanadaSourceSection: 'Parks Canada Source Section',
    mnrApplies: 'MNR Applies',
    mnrRules: 'MNR Rules',
    mnrSourceLink: 'MNR Source Link',
    mnrSourceSection: 'MNR Source Section',
    authorityGeneralNotes: 'Authority General Notes',
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
    sourceLink: 'Source Link',
    sourceSection: 'Source Section',
    status: 'Status',
    lastVerified: 'Last Verified Date',
    notes: 'Notes'
  };

  const getBooleanSelectValue = (value?: boolean) => {
    if (value === true) return 'yes';
    if (value === false) return 'no';
    return undefined;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Record' : 'Add New Record'}</DialogTitle>
          <DialogDescription>
            {isEditing && record && 'municipality' in record
              ? `Editing the bylaw record for ${record.municipality}.`
              : 'Add a new bylaw record to the system.'}
          </DialogDescription>
        </DialogHeader>

        <form id="record-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4 overflow-y-auto max-h-[60vh] pr-4">
          {fieldGroups.map(group => (
            <div key={group.title} className="space-y-4">
              <h4 className="font-semibold text-lg">{group.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map(fieldName => {
                  const isFullWidth = fullWidthFields.has(fieldName);
                  const error = form.formState.errors[fieldName as keyof Bylaw];

                  return (
                    <div key={fieldName} className={isFullWidth ? 'md:col-span-2' : ''}>
                      <Label htmlFor={fieldName}>{fieldLabels[fieldName]}</Label>

                      {fieldName === 'status' ? (
                        <Select
                          value={watch('status')}
                          onValueChange={(value) =>
                            form.setValue('status', value as BylawStatus, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : fieldName === 'parksCanadaApplies' ? (
                        <Select
                          value={getBooleanSelectValue(watch('parksCanadaApplies'))}
                          onValueChange={(value) =>
                            form.setValue('parksCanadaApplies', value === 'yes', {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Yes or No" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : fieldName === 'mnrApplies' ? (
                        <Select
                          value={getBooleanSelectValue(watch('mnrApplies'))}
                          onValueChange={(value) =>
                            form.setValue('mnrApplies', value === 'yes', {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Yes or No" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : textareaFields.has(fieldName) ? (
                        <Textarea
                          id={fieldName}
                          {...form.register(fieldName as keyof Bylaw)}
                          rows={4}
                        />
                      ) : (
                        <Input
                          id={fieldName}
                          type={fieldName === 'lastVerified' ? 'date' : 'text'}
                          {...form.register(fieldName as keyof Bylaw)}
                        />
                      )}

                      {error && <p className="text-sm text-destructive mt-1">{error.message}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="notes">{fieldLabels.notes}</Label>
            <Textarea id="notes" {...form.register('notes')} rows={5} />
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button type="submit" form="record-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}