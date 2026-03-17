
'use server';

import { revalidatePath } from 'next/cache';
import { initialRecords } from '@/lib/data';
import type { Bylaw, BylawData } from '@/lib/types';

// In-memory store
let records: Bylaw[] = [...initialRecords];
let nextId = initialRecords.length + 1;

export async function getBylawRecords(): Promise<Bylaw[]> {
  return Promise.resolve(records);
}

export async function addBylawRecord(data: BylawData): Promise<{ success: boolean; message: string }> {
  try {
    const newRecord: Bylaw = {
      ...data,
      id: `rec-${nextId++}`,
    };
    records.unshift(newRecord);
    revalidatePath('/bylaws');
    return { success: true, message: 'Record added successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to add record.' };
  }
}

export async function updateBylawRecord(id: string, data: BylawData): Promise<{ success: boolean; message: string }> {
  try {
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) {
      return { success: false, message: 'Record not found.' };
    }
    records[index] = { ...records[index], ...data };
    revalidatePath('/bylaws');
    return { success: true, message: 'Record updated successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to update record.' };
  }
}

export async function deleteBylawRecord(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) {
      return { success: false, message: 'Record not found.' };
    }
    records.splice(index, 1);
    revalidatePath('/bylaws');
    return { success: true, message: 'Record deleted successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to delete record.' };
  }
}
