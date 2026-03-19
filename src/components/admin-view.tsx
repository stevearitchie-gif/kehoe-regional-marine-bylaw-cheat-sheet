'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithRedirect, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardView } from '@/components/dashboard-view';
import { RecordsView } from '@/components/records-view';
import { DataExtractorView } from '@/components/data-extractor-view';
import { LayoutDashboard, List, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Bylaw } from '@/lib/types';

type AdminViewProps = {
  records: Bylaw[];
  onRecordAdd: (record: Bylaw) => void;
  onRecordUpdate: (record: Bylaw) => void;
  onRecordDelete: (id: string) => void;
};

export function AdminView({ 
  records, 
  onRecordAdd, 
  onRecordUpdate,
  onRecordDelete
}: AdminViewProps) {
  const [user, setUser] = useState<any>(null);
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setAuthLoading(false);
  });

  return () => unsubscribe();
}, []);

const handleGoogleSignIn = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Google sign in failed:', error);
  }
};

const handleGoogleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Google sign out failed:', error);
  }
};

if (authLoading) {
  return <div className="p-4 text-sm text-slate-600">Checking admin access...</div>;
}

if (!user) {
  return (
    <div className="rounded-2xl border p-6">
      <h3 className="text-lg font-semibold">Admin sign in required</h3>
      <p className="mt-2 text-sm text-slate-600">
        Sign in with Google to access the admin dashboard, records, and data extractor.
      </p>
      <div className="mt-4">
        <Button onClick={handleGoogleSignIn}>Sign in with Google</Button>
      </div>
    </div>
  );
}

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
          onRecordAdd={onRecordAdd}
          onRecordUpdate={onRecordUpdate}
          onRecordDelete={onRecordDelete}
        />
      </TabsContent>
      <TabsContent value="extractor" className="flex-grow">
        <DataExtractorView onRecordAdd={onRecordAdd} />
      </TabsContent>
    </Tabs>
  );
}
