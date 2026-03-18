
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { extractBylawData } from '@/ai/flows/bylaw-data-extraction-flow';
import type { Bylaw } from '@/lib/types';
import { RecordFormSheet } from './record-form-sheet';
import { Upload, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function DataExtractorView() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [extractedRecord, setExtractedRecord] = useState<Bylaw | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No file selected', description: 'Please select a document to extract data from.' });
      return;
    }

    setIsLoading(true);
    try {
      const documentDataUri = await fileToDataUri(file);
      const extracted = await extractBylawData({ documentDataUri });

      const newRecord: Partial<Bylaw> = {
        ...extracted,
        status: 'Needs review',
        lastVerified: new Date().toISOString().split('T')[0],
      };

      setExtractedRecord(newRecord as Bylaw);
      setSheetOpen(true);

      toast({ title: 'Extraction Complete', description: 'Review the extracted data and save the new record.' });
    } catch (error) {
      console.error('Extraction failed:', error);
      toast({ variant: 'destructive', title: 'Extraction Failed', description: 'Could not extract data from the document. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setSheetOpen(false);
    setExtractedRecord(null);
    setFile(null);
    router.push('/bylaws');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bylaw Document Data Extraction</CardTitle>
        <CardDescription>Upload a bylaw document (e.g., PDF, DOCX) to automatically extract key information using AI.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Wand2 className="h-4 w-4" />
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
              The AI will read the document and attempt to fill out a new bylaw record. The more structured the document, the better the results. Always review the extracted data for accuracy.
            </AlertDescription>
        </Alert>

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
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
        </div>
        
        <RecordFormSheet
            open={isSheetOpen}
            onOpenChange={setSheetOpen}
            record={extractedRecord}
            onSuccess={handleFormSuccess}
        />
      </CardContent>
    </Card>
  );
}
