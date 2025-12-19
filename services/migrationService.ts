/**
 * Migration Service - Upload existing names to Firestore
 * 
 * This is a ONE-TIME migration script. Delete this file after use.
 * 
 * Usage: Call uploadExistingNames() from admin area or dev tools
 */

import { writeBatch, doc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_NAMES } from '../constants';
import { BabyName } from '../types';

const NAMES_COLLECTION = 'names';

/**
 * Generate a unique, URL-safe document ID from name and gender
 * Format: {transliteration}_{gender} (lowercase, no spaces)
 */
const generateDocId = (name: BabyName): string => {
  const safeName = name.transliteration
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .trim();
  return `${safeName}_${name.gender.toLowerCase()}`;
};

/**
 * Upload all names from INITIAL_NAMES to Firestore
 * Uses batch writes for efficiency (max 500 per batch)
 * Uses name_gender as doc ID to prevent duplicates
 */
export const uploadExistingNames = async (): Promise<{
  success: boolean;
  uploaded: number;
  skipped: number;
  errors: string[];
}> => {
  console.log('\n🚀 MIGRATION: Starting upload of existing names to Firestore...');
  console.log(`📊 Total names to upload: ${INITIAL_NAMES.length}`);
  
  const errors: string[] = [];
  let uploadedCount = 0;
  let skippedCount = 0;
  
  // Firestore batches are limited to 500 operations
  const BATCH_SIZE = 450;
  const totalBatches = Math.ceil(INITIAL_NAMES.length / BATCH_SIZE);
  
  try {
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = writeBatch(db);
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, INITIAL_NAMES.length);
      const batchNames = INITIAL_NAMES.slice(start, end);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (names ${start + 1}-${end})...`);
      
      for (const name of batchNames) {
        try {
          const docId = generateDocId(name);
          const docRef = doc(db, NAMES_COLLECTION, docId);
          
          // Prepare the document data
          const nameDoc = {
            id: name.id,
            hebrew: name.hebrew.trim(),
            transliteration: name.transliteration.trim(),
            meaning: name.meaning.trim(),
            gender: name.gender,
            style: name.style || [],
            isTrending: name.isTrending || false,
            popularity: name.popularity || 0,
            // Metadata
            createdAt: new Date().toISOString(),
            source: 'migration_v1'
          };
          
          // setDoc will create or overwrite - no duplicates
          batch.set(docRef, nameDoc);
          uploadedCount++;
          
        } catch (nameError: any) {
          const errorMsg = `Error preparing "${name.hebrew}": ${nameError.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
          skippedCount++;
        }
      }
      
      // Commit this batch
      await batch.commit();
      console.log(`✅ Batch ${batchIndex + 1} committed successfully!`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log(`✅ Uploaded: ${uploadedCount} names`);
    console.log(`⏭️ Skipped: ${skippedCount} names`);
    if (errors.length > 0) {
      console.log(`❌ Errors: ${errors.length}`);
      errors.forEach(e => console.log(`   - ${e}`));
    }
    console.log('='.repeat(50) + '\n');
    
    return {
      success: errors.length === 0,
      uploaded: uploadedCount,
      skipped: skippedCount,
      errors
    };
    
  } catch (error: any) {
    console.error('❌ MIGRATION FAILED:', error);
    return {
      success: false,
      uploaded: uploadedCount,
      skipped: skippedCount,
      errors: [...errors, error.message]
    };
  }
};

/**
 * Check how many names are currently in Firestore
 */
export const countNamesInFirestore = async (): Promise<number> => {
  try {
    const namesRef = collection(db, NAMES_COLLECTION);
    const snapshot = await getDocs(namesRef);
    return snapshot.size;
  } catch (error) {
    console.error('Error counting names:', error);
    return -1;
  }
};

/**
 * Delete all names from Firestore (USE WITH CAUTION!)
 */
export const clearAllNames = async (): Promise<boolean> => {
  console.log('⚠️ WARNING: Clearing all names from Firestore...');
  
  try {
    const namesRef = collection(db, NAMES_COLLECTION);
    const snapshot = await getDocs(namesRef);
    
    if (snapshot.empty) {
      console.log('No names to delete.');
      return true;
    }
    
    const BATCH_SIZE = 450;
    const docs = snapshot.docs;
    const totalBatches = Math.ceil(docs.length / BATCH_SIZE);
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = writeBatch(db);
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, docs.length);
      
      for (let j = start; j < end; j++) {
        batch.delete(docs[j].ref);
      }
      
      await batch.commit();
      console.log(`Deleted batch ${i + 1}/${totalBatches}`);
    }
    
    console.log(`✅ Deleted ${docs.length} names.`);
    return true;
    
  } catch (error) {
    console.error('Error clearing names:', error);
    return false;
  }
};


