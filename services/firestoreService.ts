import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, SwipeRecord, Match } from '../types';

// Collection names
const USERS_COLLECTION = 'users';
const SWIPES_COLLECTION = 'swipes';
const MATCHES_COLLECTION = 'matches';

// ============ USER PROFILE OPERATIONS ============

/**
 * Create or update user profile in Firestore
 */
export const saveUserProfile = async (uid: string, profile: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    // Update existing profile
    await updateDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    });
  } else {
    // Create new profile
    await setDoc(userRef, {
      ...profile,
      id: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
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
  
  await setDoc(swipeRef, {
    ...swipe,
    createdAt: new Date().toISOString()
  });
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

// ============ MATCH OPERATIONS ============

/**
 * Save a match
 */
export const saveMatch = async (roomId: string, match: Match): Promise<void> => {
  const matchId = `${roomId}_${match.nameId}`;
  const matchRef = doc(db, MATCHES_COLLECTION, matchId);
  
  await setDoc(matchRef, {
    ...match,
    roomId,
    createdAt: new Date().toISOString()
  });
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

