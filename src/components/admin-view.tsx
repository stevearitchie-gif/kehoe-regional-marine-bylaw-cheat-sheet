'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
  onRecordDelete,
}: AdminViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignInError('');
    setSigningIn(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (error) {
      console.error('Email sign in failed:', error);
      setSignInError('Sign in failed. Check the email and password, then try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
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
          Sign in with your authorized admin email and password to access the dashboard, records, and data extractor.
        </p>

        <form onSubmit={handleEmailSignIn} className="mt-4 max-w-sm space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {signInError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {signInError}
            </p>
          ) : null}

          <Button type="submit" disabled={signingIn}>
            {signingIn ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Signed in as {user.email}
        </p>
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
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
    </div>
  );
}
