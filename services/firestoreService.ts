import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, SwipeRecord, Match, RoomSettings, BabyName, Gender } from '../types';

// Collection names
const USERS_COLLECTION = 'users';
const SWIPES_COLLECTION = 'swipes';
const MATCHES_COLLECTION = 'matches';
const ROOMS_COLLECTION = 'rooms';
const NAMES_COLLECTION = 'names';

// ============ USER PROFILE OPERATIONS ============

/**
 * Create or update user profile in Firestore
 */
export const saveUserProfile = async (uid: string, profile: Partial<UserProfile>): Promise<void> => {
  console.log('💾 Saving to Firestore:', { uid, profile });
  
  const userRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    // Update existing profile
    console.log('📝 Updating existing user document...');
    await updateDoc(userRef, {
      ...profile,
      updatedAt: serverTimestamp()
    });
    console.log('✅ User profile updated successfully!');
  } else {
    // Create new profile
    console.log('🆕 Creating new user document...');
    await setDoc(userRef, {
      ...profile,
      id: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ User profile created successfully!');
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

/**
 * Subscribe to user profile changes
 */
export const subscribeToUserProfile = (
  uid: string, 
  callback: (profile: UserProfile | null) => void
): Unsubscribe => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    } else {
      callback(null);
    }
  });
};

// ============ SWIPE OPERATIONS ============

/**
 * Save a swipe record
 */
export const saveSwipe = async (swipe: SwipeRecord): Promise<void> => {
  const swipeId = `${swipe.roomId}_${swipe.userId}_${swipe.nameId}`;
  const swipeRef = doc(db, SWIPES_COLLECTION, swipeId);
  
  console.log('👆 Saving swipe:', { swipeId, liked: swipe.liked });
  
  await setDoc(swipeRef, {
    ...swipe,
    createdAt: serverTimestamp()
  });
  
  console.log('✅ Swipe saved!');
};

/**
 * Get all swipes for a room
 */
export const getSwipesForRoom = async (roomId: string): Promise<SwipeRecord[]> => {
  const swipesRef = collection(db, SWIPES_COLLECTION);
  const q = query(swipesRef, where('roomId', '==', roomId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as SwipeRecord);
};

/**
 * Subscribe to swipes for a room (real-time updates)
 */
export const subscribeToRoomSwipes = (
  roomId: string,
  callback: (swipes: SwipeRecord[]) => void
): Unsubscribe => {
  const swipesRef = collection(db, SWIPES_COLLECTION);
  const q = query(swipesRef, where('roomId', '==', roomId));
  
  return onSnapshot(q, (querySnapshot) => {
    const swipes = querySnapshot.docs.map(doc => doc.data() as SwipeRecord);
    callback(swipes);
  });
};

/**
 * Delete a swipe record (for undo or unlike)
 */
export const deleteSwipe = async (roomId: string, userId: string, nameId: string): Promise<void> => {
  const swipeId = `${roomId}_${userId}_${nameId}`;
  const swipeRef = doc(db, SWIPES_COLLECTION, swipeId);
  
  console.log('🗑️ Deleting swipe:', swipeId);
  await deleteDoc(swipeRef);
  console.log('✅ Swipe deleted!');
};

/**
 * Delete ALL swipes for a specific user in a room (Reset Progress)
 * This allows users to start fresh without affecting partner's swipes
 */
export const deleteAllUserSwipes = async (roomId: string, userId: string): Promise<number> => {
  console.log(`🗑️ Deleting ALL swipes for user ${userId} in room ${roomId}...`);
  
  const swipesRef = collection(db, SWIPES_COLLECTION);
  const q = query(
    swipesRef,
    where('roomId', '==', roomId),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  
  await Promise.all(deletePromises);
  
  console.log(`✅ Deleted ${snapshot.size} swipes for user ${userId}`);
  return snapshot.size;
};

/**
 * Check if a name has been liked by other users in the room
 * Returns array of user IDs who liked this name
 */
export const checkForMatch = async (
  roomId: string, 
  nameId: string, 
  currentUserId: string
): Promise<{ isMatch: boolean; likedByUsers: string[] }> => {
  console.log(`🔍 Checking match for name "${nameId}" in room "${roomId}"...`);
  
  const swipesRef = collection(db, SWIPES_COLLECTION);
  
  // Query for all likes of this specific name in this room
  const q = query(
    swipesRef,
    where('roomId', '==', roomId),
    where('nameId', '==', nameId),
    where('liked', '==', true)
  );
  
  const querySnapshot = await getDocs(q);
  
  const likedByUsers: string[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    likedByUsers.push(data.userId);
  });
  
  console.log(`👥 Users who liked "${nameId}": [${likedByUsers.join(', ')}]`);
  
  // Check if at least one OTHER user (not current user) has liked this name
  const otherUsersWhoLiked = likedByUsers.filter(uid => uid !== currentUserId);
  const isMatch = otherUsersWhoLiked.length > 0;
  
  if (isMatch) {
    console.log(`💕 MATCH FOUND! "${nameId}" liked by current user AND ${otherUsersWhoLiked.join(', ')}`);
  } else {
    console.log(`⏳ No match yet - waiting for partner to like "${nameId}"`);
  }
  
  return { isMatch, likedByUsers };
};

/**
 * Check if a match already exists for this name in this room
 */
export const matchExists = async (roomId: string, nameId: string): Promise<boolean> => {
  const matchId = `${roomId}_${nameId}`;
  const matchRef = doc(db, MATCHES_COLLECTION, matchId);
  const docSnap = await getDoc(matchRef);
  return docSnap.exists();
};

// ============ MATCH OPERATIONS ============

/**
 * Save a match
 */
export const saveMatch = async (roomId: string, match: Match): Promise<void> => {
  const matchId = `${roomId}_${match.nameId}`;
  const matchRef = doc(db, MATCHES_COLLECTION, matchId);
  
  console.log('💕 Saving match:', { matchId, roomId });
  
  await setDoc(matchRef, {
    ...match,
    roomId,
    createdAt: serverTimestamp()
  });
  
  console.log('✅ Match saved!');
};

/**
 * Update match rating
 */
export const updateMatchRating = async (roomId: string, nameId: string, rating: number): Promise<void> => {
  const matchId = `${roomId}_${nameId}`;
  const matchRef = doc(db, MATCHES_COLLECTION, matchId);
  
  await updateDoc(matchRef, { rating });
};

/**
 * Delete a match (when one user unlikes a matched name)
 */
export const deleteMatch = async (roomId: string, nameId: string): Promise<void> => {
  const matchId = `${roomId}_${nameId}`;
  const matchRef = doc(db, MATCHES_COLLECTION, matchId);
  
  console.log('💔 Deleting match:', matchId);
  await deleteDoc(matchRef);
  console.log('✅ Match deleted!');
};

/**
 * Get all matches for a room
 */
export const getMatchesForRoom = async (roomId: string): Promise<Match[]> => {
  const matchesRef = collection(db, MATCHES_COLLECTION);
  const q = query(matchesRef, where('roomId', '==', roomId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as Match);
};

/**
 * Subscribe to matches for a room (real-time updates)
 */
export const subscribeToRoomMatches = (
  roomId: string,
  callback: (matches: Match[]) => void
): Unsubscribe => {
  const matchesRef = collection(db, MATCHES_COLLECTION);
  const q = query(matchesRef, where('roomId', '==', roomId));
  
  return onSnapshot(q, (querySnapshot) => {
    const matches = querySnapshot.docs.map(doc => doc.data() as Match);
    callback(matches);
  });
};

// ============ ROOM OPERATIONS ============

/**
 * Check if a partner is connected to the same room
 */
export const checkPartnerConnection = async (roomId: string, currentUserId: string): Promise<boolean> => {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where('roomId', '==', roomId));
  const querySnapshot = await getDocs(q);
  
  // Check if there's another user with the same roomId
  return querySnapshot.docs.some(doc => doc.id !== currentUserId);
};

/**
 * Subscribe to partner connection status
 */
export const subscribeToPartnerConnection = (
  roomId: string,
  currentUserId: string,
  callback: (isConnected: boolean) => void
): Unsubscribe => {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where('roomId', '==', roomId));
  
  return onSnapshot(q, (querySnapshot) => {
    const hasPartner = querySnapshot.docs.some(doc => doc.id !== currentUserId);
    callback(hasPartner);
  });
};

// ============ ROOM SETTINGS OPERATIONS (COUPLES SYNC) ============

/**
 * Save or update shared room settings
 * This syncs settings between all users in the same room
 */
export const saveRoomSettings = async (
  roomId: string, 
  settings: Partial<RoomSettings>,
  userId: string
): Promise<void> => {
  console.log('🔄 Syncing room settings:', { roomId, settings });
  
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const docSnap = await getDoc(roomRef);
  
  if (docSnap.exists()) {
    await updateDoc(roomRef, {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
    console.log('✅ Room settings updated!');
  } else {
    await setDoc(roomRef, {
      roomId,
      ...settings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
    console.log('✅ Room settings created!');
  }
};

/**
 * Get room settings
 */
export const getRoomSettings = async (roomId: string): Promise<RoomSettings | null> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const docSnap = await getDoc(roomRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as RoomSettings;
  }
  return null;
};

/**
 * Subscribe to room settings changes (real-time sync for couples)
 * When partner changes settings, callback fires immediately
 */
export const subscribeToRoomSettings = (
  roomId: string,
  callback: (settings: RoomSettings | null) => void
): Unsubscribe => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  
  console.log('👂 Subscribing to room settings:', roomId);
  
  return onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      const settings = docSnap.data() as RoomSettings;
      console.log('📡 Room settings updated:', settings);
      callback(settings);
    } else {
      callback(null);
    }
  });
};

// ============ NAME OPERATIONS ============

/**
 * Find or create a name in the names collection
 * Returns the name ID (either existing or newly created)
 */
export const findOrCreateName = async (
  hebrew: string,
  gender: Gender
): Promise<string> => {
  console.log('🔍 Finding or creating name:', { hebrew, gender });
  
  // Normalize Hebrew name for comparison
  const normalizedHebrew = hebrew.trim().toLowerCase();
  
  // Query for existing name by Hebrew and gender
  const namesRef = collection(db, NAMES_COLLECTION);
  const q = query(
    namesRef,
    where('hebrew', '==', hebrew.trim()) // Exact match (case-sensitive for Hebrew)
  );
  
  const querySnapshot = await getDocs(q);
  
  // Check if name exists with same gender
  let existingName: { id: string; [key: string]: any } | null = null;
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.gender === gender) {
      existingName = { id: doc.id, ...data };
    }
  });
  
  if (existingName) {
    console.log('✅ Found existing name:', existingName.id);
    // Return the name ID
    return existingName.id;
  }
  
  // Name doesn't exist - create it
  console.log('🆕 Creating new name in Firestore...');
  
  // Generate transliteration (simple: use Hebrew as fallback, or generate from Hebrew)
  // For now, we'll use a simple transliteration or the Hebrew itself
  const transliteration = hebrew.trim(); // Can be improved with transliteration logic
  const docId = `${transliteration.toLowerCase().replace(/[^a-z0-9]/g, '')}_${gender.toLowerCase()}`;
  
  const nameRef = doc(db, NAMES_COLLECTION, docId);
  
  const nameDoc: Partial<BabyName> = {
    id: docId,
    hebrew: hebrew.trim(),
    transliteration: transliteration,
    meaning: '', // User can add meaning later if needed
    gender: gender,
    style: [],
    isTrending: false,
    popularity: 0,
    // Metadata
    source: 'user_added',
    createdAt: new Date().toISOString()
  };
  
  await setDoc(nameRef, nameDoc);
  console.log('✅ New name created:', docId);
  
  return docId;
};

/**
 * Update room document with priorityNameId for partner sync
 */
export const updateRoomPriorityName = async (
  roomId: string,
  nameId: string,
  userId: string
): Promise<void> => {
  console.log('📡 Updating room priority name:', { roomId, nameId });
  
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  
  await updateDoc(roomRef, {
    priorityNameId: {
      id: nameId,
      timestamp: Date.now()
    },
    updatedAt: serverTimestamp(),
    updatedBy: userId
  });
  
  console.log('✅ Room priority name updated!');
};

/**
 * Get a name by ID from Firestore
 */
export const getNameById = async (nameId: string): Promise<BabyName | null> => {
  try {
    // First try to find in NAMES_COLLECTION
    const nameRef = doc(db, NAMES_COLLECTION, nameId);
    const nameSnap = await getDoc(nameRef);
    
    if (nameSnap.exists()) {
      const data = nameSnap.data();
      return {
        id: nameId,
        hebrew: data.hebrew,
        transliteration: data.transliteration || data.hebrew,
        meaning: data.meaning || '',
        gender: data.gender,
        style: data.style || [],
        isTrending: data.isTrending || false,
        popularity: data.popularity || 0
      } as BabyName;
    }
    
    // If not found, return null (caller should handle)
    return null;
  } catch (error) {
    console.error('❌ Error fetching name:', error);
    return null;
  }
};

