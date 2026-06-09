'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { extractBylawData } from '@/ai/flows/bylaw-data-extraction-flow';
import type { Bylaw, BylawData } from '@/lib/types';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecordFormDialog } from './record-form-dialog';
import { Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type BulkImportRow = {
  municipality: string;
  region: string;
  contactName: string;
  contactMethod: string;
  conservationAuthority: string;
  conservationAuthorityRules: string;
  conservationAuthoritySourceLink: string;
  conservationAuthoritySourceSection: string;
  parksCanadaApplies: string;
  parksCanadaRules: string;
  parksCanadaSourceLink: string;
  parksCanadaSourceSection: string;
  mnrApplies: string;
  mnrRules: string;
  mnrSourceLink: string;
  mnrSourceSection: string;
  authorityGeneralNotes: string;
  areaRegulation: string;
  perimeterRegulation: string;
  widthRegulation: string;
  lengthRegulation: string;
  sideLotSetback: string;
  lotLineProjection: string;
  heightLimit: string;
  permitRequirements: string;
  sourceLink: string;
  sourceSection: string;
  status: string;
  lastVerified: string;
  notes: string;
};

const REQUIRED_CSV_HEADERS = [
  'municipality',
  'region',
  'contactName',
  'contactMethod',
  'conservationAuthority',
  'conservationAuthorityRules',
  'conservationAuthoritySourceLink',
  'conservationAuthoritySourceSection',
  'parksCanadaApplies',
  'parksCanadaRules',
  'parksCanadaSourceLink',
  'parksCanadaSourceSection',
  'mnrApplies',
  'mnrRules',
  'mnrSourceLink',
  'mnrSourceSection',
  'authorityGeneralNotes',
  'areaRegulation',
  'perimeterRegulation',
  'widthRegulation',
  'lengthRegulation',
  'sideLotSetback',
  'lotLineProjection',
  'heightLimit',
  'permitRequirements',
  'sourceLink',
  'sourceSection',
  'status',
  'lastVerified',
  'notes',
] as const;

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());

  return values.map((value) => value.replace(/^"(.*)"$/, '$1').trim());
};

const getCsvHeaders = (csvText: string): string[] => {
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const firstLine = normalized.split('\n').find((line) => line.trim().length > 0) ?? '';
  return firstLine ? parseCsvLine(firstLine) : [];
};

const getMissingHeaders = (headers: string[]): string[] => {
  return REQUIRED_CSV_HEADERS.filter((header) => !headers.includes(header));
};

const parseCsvText = (csvText: string): BulkImportRow[] => {
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const rows: BulkImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const rowObject: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowObject[header] = values[index] ?? '';
    });

    rows.push({
      municipality: rowObject.municipality ?? '',
      region: rowObject.region ?? '',
      contactName: rowObject.contactName ?? '',
      contactMethod: rowObject.contactMethod ?? '',
      conservationAuthority: rowObject.conservationAuthority ?? '',
      conservationAuthorityRules: rowObject.conservationAuthorityRules ?? '',
      conservationAuthoritySourceLink: rowObject.conservationAuthoritySourceLink ?? '',
      conservationAuthoritySourceSection: rowObject.conservationAuthoritySourceSection ?? '',
      parksCanadaApplies: rowObject.parksCanadaApplies ?? '',
      parksCanadaRules: rowObject.parksCanadaRules ?? '',
      parksCanadaSourceLink: rowObject.parksCanadaSourceLink ?? '',
      parksCanadaSourceSection: rowObject.parksCanadaSourceSection ?? '',
      mnrApplies: rowObject.mnrApplies ?? '',
      mnrRules: rowObject.mnrRules ?? '',
      mnrSourceLink: rowObject.mnrSourceLink ?? '',
      mnrSourceSection: rowObject.mnrSourceSection ?? '',
      authorityGeneralNotes: rowObject.authorityGeneralNotes ?? '',
      areaRegulation: rowObject.areaRegulation ?? '',
      perimeterRegulation: rowObject.perimeterRegulation ?? '',
      widthRegulation: rowObject.widthRegulation ?? '',
      lengthRegulation: rowObject.lengthRegulation ?? '',
      sideLotSetback: rowObject.sideLotSetback ?? '',
      lotLineProjection: rowObject.lotLineProjection ?? '',
      heightLimit: rowObject.heightLimit ?? '',
      permitRequirements: rowObject.permitRequirements ?? '',
      sourceLink: rowObject.sourceLink ?? '',
      sourceSection: rowObject.sourceSection ?? '',
      status: rowObject.status ?? '',
      lastVerified: rowObject.lastVerified ?? '',
      notes: rowObject.notes ?? '',
    });
  }

  return rows;
};

const parseOptionalBoolean = (value: string): boolean | undefined => {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (!normalized) return undefined;
  if (['yes', 'y', 'true', '1'].includes(normalized)) return true;
  if (['no', 'n', 'false', '0'].includes(normalized)) return false;

  return undefined;
};

const normalizeImportKeyPart = (value: string): string => {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildImportKey = (municipality: string, region: string): string => {
  return `${normalizeImportKeyPart(municipality)}::${normalizeImportKeyPart(region)}`;
};

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function DataExtractorView({ onRecordAdd }: { onRecordAdd: (record: Bylaw) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [extractedRecord, setExtractedRecord] = useState<Partial<BylawData> | null>(null);
  const [bulkRows, setBulkRows] = useState<BulkImportRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkHeaders, setBulkHeaders] = useState<string[]>([]);
  const [bulkMissingHeaders, setBulkMissingHeaders] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleBulkCsvUpload = async (uploadedFile: File) => {
    try {
      const text = await uploadedFile.text();
      const headers = getCsvHeaders(text);
      const missingHeaders = getMissingHeaders(headers);
      const parsedRows = parseCsvText(text);

      setBulkFileName(uploadedFile.name);
      setBulkHeaders(headers);
      setBulkMissingHeaders(missingHeaders);
      setBulkRows(parsedRows);

      if (missingHeaders.length > 0) {
        toast({
          variant: 'destructive',
          title: 'CSV headers do not match template',
          description: `Missing headers: ${missingHeaders.join(', ')}`,
        });
        return;
      }

      toast({
        title: 'CSV loaded',
        description: `${parsedRows.length} row(s) parsed successfully.`,
      });
    } catch (error) {
      console.error('CSV upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'CSV upload failed',
        description: 'The file could not be parsed. Please use a CSV exported from the template.',
      });
    }
  };

  const handleBulkCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await handleBulkCsvUpload(selectedFile);
  };

  const handleBulkImport = async () => {
    if (bulkMissingHeaders.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot import CSV',
        description: 'The file is missing one or more required headers.',
      });
      return;
    }

    if (bulkRows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No rows to import',
        description: 'Please upload a CSV file first.',
      });
      return;
    }

    try {
      const existingSnapshot = await getDocs(collection(db, 'municipalities'));
      const existingMap = new Map<string, string>();

      existingSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const municipality = String(data.municipality ?? '').trim();
        const region = String(data.region ?? '').trim();

        if (!municipality || !region) return;

        const key = buildImportKey(municipality, region);

        if (!existingMap.has(key)) {
          existingMap.set(key, docSnap.id);
        }
      });

      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      const rowErrors: string[] = [];

      for (const row of bulkRows) {
        try {
          const municipality = row.municipality.trim();
          const region = row.region.trim();

          if (!municipality || !region) {
            skippedCount++;
            continue;
          }

          const key = buildImportKey(municipality, region);
          const parksCanadaApplies = parseOptionalBoolean(row.parksCanadaApplies);
          const mnrApplies = parseOptionalBoolean(row.mnrApplies);

          const firestorePayload = {
            municipality,
            region,
            contactName: row.contactName ?? '',
            contactMethod: row.contactMethod ?? '',
            conservationAuthority: row.conservationAuthority ?? '',
            conservationAuthorityRules: row.conservationAuthorityRules ?? '',
            conservationAuthoritySourceLink: row.conservationAuthoritySourceLink ?? '',
            conservationAuthoritySourceSection: row.conservationAuthoritySourceSection ?? '',
            ...(parksCanadaApplies !== undefined ? { parksCanadaApplies } : {}),
            parksCanadaRules: row.parksCanadaRules ?? '',
            parksCanadaSourceLink: row.parksCanadaSourceLink ?? '',
            parksCanadaSourceSection: row.parksCanadaSourceSection ?? '',
            ...(mnrApplies !== undefined ? { mnrApplies } : {}),
            mnrRules: row.mnrRules ?? '',
            mnrSourceLink: row.mnrSourceLink ?? '',
            mnrSourceSection: row.mnrSourceSection ?? '',
            authorityGeneralNotes: row.authorityGeneralNotes ?? '',
            areaRule: row.areaRegulation ?? '',
            perimeterRule: row.perimeterRegulation ?? '',
            widthRule: row.widthRegulation ?? '',
            lengthRule: row.lengthRegulation ?? '',
            sideLotSetback: row.sideLotSetback ?? '',
            lotLineProjection: row.lotLineProjection ?? '',
            heightRule: row.heightLimit ?? '',
            permitRule: row.permitRequirements ?? '',
            sourceLink: row.sourceLink ?? '',
            sourceSection: row.sourceSection ?? '',
            sourceStatus: row.status ?? 'Needs review',
            lastVerified: row.lastVerified ?? '',
            notes: row.notes ?? '',
          };

          const existingId = existingMap.get(key);

          if (existingId) {
            await setDoc(doc(db, 'municipalities', existingId), firestorePayload, { merge: true });
            updatedCount++;
          } else {
            const newDocRef = doc(collection(db, 'municipalities'));
            await setDoc(newDocRef, firestorePayload);
            existingMap.set(key, newDocRef.id);
            addedCount++;
          }
        } catch (error) {
          failedCount++;
          const message = error instanceof Error ? error.message : 'Unknown import error';
          rowErrors.push(`${row.municipality} / ${row.region}: ${message}`);
          console.error('CSV row import failed:', row, error);
        }
      }

      if (addedCount === 0 && updatedCount === 0 && failedCount === 0) {
        toast({
          variant: 'destructive',
          title: 'No rows were imported',
          description: `Skipped: ${skippedCount}. Check municipality and region values.`,
        });
        return;
      }

      if (failedCount > 0) {
        toast({
          variant: 'destructive',
          title: 'Import completed with errors',
          description: `Added: ${addedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}. Check the browser console for row details.`,
        });
      } else {
        toast({
          title: 'Bulk import complete',
          description: `Added: ${addedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`,
        });
      }

      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (error) {
      console.error('Bulk import failed:', error);
      toast({
        variant: 'destructive',
        title: 'Bulk import failed',
        description: 'The app could not connect to Firestore or process the import.',
      });
    }
  };

  const handleExtract = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a document to extract data from.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const documentDataUri = await fileToDataUri(file);
      const extracted = await extractBylawData({ documentDataUri });

      const newRecord: Partial<BylawData> = {
        ...extracted,
        status: 'Needs review',
        lastVerified: new Date().toISOString().split('T')[0],
      };

      setExtractedRecord(newRecord);
      setDialogOpen(true);

      toast({
        title: 'Extraction Complete',
        description: 'Review the extracted data and save the new record.',
      });
    } catch (error) {
      console.error('Extraction failed:', error);
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: 'Could not extract data from the document. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: BylawData, id?: string) => {
    const newRecord: Bylaw = {
      ...data,
      id: id ?? `${Date.now()}`,
    };

    onRecordAdd(newRecord);
    handleClose();
  };

  const handleClose = () => {
    setDialogOpen(false);
    setExtractedRecord(null);
    setFile(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bylaw Document Data Extraction</CardTitle>
        <CardDescription>
          Upload a bylaw document (e.g., PDF, DOCX) to automatically extract key information using AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Wand2 className="h-4 w-4" />
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription>
            The AI will read the document and attempt to fill out a new bylaw record. The more structured the document,
            the better the results. Always review the extracted data for accuracy.
          </AlertDescription>
        </Alert>

        <div className="rounded-2xl border p-4 space-y-3">
          <div>
            <h3 className="font-medium">Bulk import from CSV</h3>
            <p className="text-sm text-muted-foreground">
              Upload a CSV exported from the upload template. This step only validates and previews the file.
            </p>
          </div>

          <Input
            id="bulk-csv"
            type="file"
            accept=".csv,text/csv"
            onChange={handleBulkCsvChange}
          />

          {bulkFileName && (
            <div className="text-sm space-y-1">
              <div><span className="font-medium">File:</span> {bulkFileName}</div>
              <div><span className="font-medium">Rows parsed:</span> {bulkRows.length}</div>
              <div><span className="font-medium">Headers found:</span> {bulkHeaders.length}</div>
            </div>
          )}

          {bulkMissingHeaders.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Missing required headers</AlertTitle>
              <AlertDescription>{bulkMissingHeaders.join(', ')}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleBulkImport}
            disabled={bulkRows.length === 0 || bulkMissingHeaders.length > 0}
          >
            Import CSV to Firestore
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Input id="document" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" />
            </div>
            <Button onClick={handleExtract} disabled={!file || isLoading}>
              {isLoading ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Extract Data
                </>
              )}
            </Button>
          </div>

          {file && (
            <p className="text-sm text-muted-foreground">Selected: {file.name}</p>
          )}
        </div>

        {isDialogOpen && (
          <RecordFormDialog
            open={isDialogOpen}
            record={extractedRecord}
            onSave={handleSave}
            onClose={handleClose}
          />
        )}
      </CardContent>
    </Card>
  );
}