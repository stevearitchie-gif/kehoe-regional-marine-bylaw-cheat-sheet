'use server';

import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Bylaw, BylawData } from '@/lib/types';

export async function addBylawRecord(data: BylawData): Promise<{ success: boolean; message: string; record?: Bylaw }> {
  try {
    const docRef = await addDoc(collection(db, 'municipalities'), {
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
      lastVerified: data.lastVerified ?? "",
lastSourceCheck: data.lastSourceCheck ?? "",
      notes: data.notes ?? '',
    });

    const newRecord: Bylaw = {
      id: docRef.id,
      ...data,
    };

    return { success: true, message: 'Record added successfully.', record: newRecord };
  } catch (error) {
    console.error('Failed to add record:', error);
    return { success: false, message: 'Failed to add record.' };
  }
}

export async function getBylawRecords(): Promise<Bylaw[]> {
  const snapshot = await getDocs(collection(db, 'municipalities'));

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      municipality: data.municipality ?? '',
      region: data.region ?? '',
      contactName: data.contactName ?? '',
      contactMethod: data.contactMethod ?? '',
      conservationAuthority: data.conservationAuthority ?? '',
      conservationAuthorityRules: data.conservationAuthorityRules ?? '',
      conservationAuthoritySourceLink: data.conservationAuthoritySourceLink ?? '',
      conservationAuthoritySourceSection: data.conservationAuthoritySourceSection ?? '',
      parksCanadaApplies: typeof data.parksCanadaApplies === 'boolean' ? data.parksCanadaApplies : undefined,
      parksCanadaRules: data.parksCanadaRules ?? '',
      parksCanadaSourceLink: data.parksCanadaSourceLink ?? '',
      parksCanadaSourceSection: data.parksCanadaSourceSection ?? '',
      mnrApplies: typeof data.mnrApplies === 'boolean' ? data.mnrApplies : undefined,
      mnrRules: data.mnrRules ?? '',
      mnrSourceLink: data.mnrSourceLink ?? '',
      mnrSourceSection: data.mnrSourceSection ?? '',
      authorityGeneralNotes: data.authorityGeneralNotes ?? '',
      areaRegulation: data.areaRule ?? '',
      perimeterRegulation: data.perimeterRule ?? '',
      widthRegulation: data.widthRule ?? '',
      lengthRegulation: data.lengthRule ?? '',
      sideLotSetback: data.sideLotSetback ?? '',
      lotLineProjection: data.lotLineProjection ?? '',
      heightLimit: data.heightRule ?? '',
      permitRequirements: data.permitRule ?? '',
      sourceLink: data.sourceLink ?? '',
      sourceSection: data.sourceSection ?? '',
      status: data.sourceStatus ?? 'Needs review',
      lastVerified: data.lastVerified ?? "",
lastSourceCheck: data.lastSourceCheck ?? "",
      notes: data.notes ?? '',
    };
  });
}

export async function deleteBylawRecord(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await deleteDoc(doc(db, 'municipalities', id));
    return { success: true, message: 'Record deleted successfully.' };
  } catch (error) {
    console.error('Failed to delete record:', error);
    return { success: false, message: 'Failed to delete record.' };
  }
}

export async function updateBylawRecord(
  id: string,
  data: BylawData
): Promise<{ success: boolean; message: string; record?: Bylaw }> {
  try {
    await updateDoc(doc(db, 'municipalities', id), {
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
    });

    const updatedRecord: Bylaw = {
      id,
      ...data,
    };

    return { success: true, message: 'Record updated successfully.', record: updatedRecord };
  } catch (error) {
    console.error('Failed to update record:', error);
    return { success: false, message: 'Failed to update record.' };
  }
}