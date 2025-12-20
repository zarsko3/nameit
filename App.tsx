import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import RoomSetup from './components/RoomSetup';
import OnboardingFlow from './components/OnboardingFlow';
import SwipeCard from './components/SwipeCard';
import History from './components/History';
import InstallPrompt from './components/InstallPrompt';
import NotificationPrompt from './components/NotificationPrompt';
import Settings from './components/Settings';
import { BabyName, AppView, UserProfile, SwipeRecord, Match, Gender, FilterConfig, RoomSettings, NameStyle } from './types';
import { INITIAL_NAMES } from './constants';
import { Sparkles, SlidersHorizontal, X, CircleCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

// Firebase imports
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { 
  saveUserProfile, 
  getUserProfile, 
  subscribeToUserProfile,
  saveSwipe,
  deleteSwipe,
  deleteAllUserSwipes,
  subscribeToRoomSwipes,
  saveMatch,
  deleteMatch,
  matchExists,
  checkForMatch,
  subscribeToRoomMatches,
  subscribeToPartnerConnection,
  saveRoomSettings,
  getRoomSettings,
  subscribeToRoomSettings
} from './services/firestoreService';

// Check if we're in development mode
// @ts-ignore - Vite provides import.meta.env.DEV
const isDev = import.meta.env.DEV;

const AppContent: React.FC = () => {
  const { currentUser, loading: authLoading, initialized: authInitialized, signUp, login, loginWithGoogle, logout } = useAuth();
  
  const [isSplash, setIsSplash] = useState(true);
  const [view, setView] = useState<AppView>('AUTH');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roomSettings, setRoomSettings] = useState<RoomSettings | null>(null);
  const [swipes, setSwipes] = useState<SwipeRecord[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatchCelebration, setShowMatchCelebration] = useState<BabyName | null>(null);
  const [pendingMatchNotification, setPendingMatchNotification] = useState<string | null>(null); // For partner notifications
  const previousMatchesRef = useRef<string[]>([]); // Track previous match IDs
  const [showFilters, setShowFilters] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [swipesLoaded, setSwipesLoaded] = useState(false); // Flag: swipes subscription has returned data at least once

  // Session-stable name list to prevent jumping during swipes
  const [sessionNames, setSessionNames] = useState<BabyName[]>([]);
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const sessionInitialized = useRef(false);
  const swipesLoadedForUser = useRef<string | null>(null); // Track which user's swipes were loaded

  const [filters, setFilters] = useState<FilterConfig>({
    genders: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
    minLength: 0,
    maxLength: 10,
    startingLetter: '',
    nameStyles: [],
    showTrendingOnly: false
  });

  // Splash Timer - minimum display time
  const [splashMinTimeComplete, setSplashMinTimeComplete] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setSplashMinTimeComplete(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Splash is complete when BOTH min time passed AND auth is initialized
  useEffect(() => {
    if (splashMinTimeComplete && authInitialized) {
      setIsSplash(false);
    }
  }, [splashMinTimeComplete, authInitialized]);

  // Handle auth state changes - only runs after auth is initialized
  useEffect(() => {
    // Wait for auth to be fully initialized before making routing decisions
    if (!authInitialized || authLoading) return;
    
    if (!currentUser) {
      // Only show AUTH screen after confirming no active session
      console.log('🔐 No user session - showing login');
      setView('AUTH');
      setProfile(null);
      return;
    }

    // User is logged in (either fresh login or restored session)
    console.log('✅ User authenticated:', currentUser.email);
    setDataLoading(true);
    
    getUserProfile(currentUser.uid).then((userProfile) => {
      if (userProfile) {
        console.log('📋 Profile loaded, routing to appropriate view');
        setProfile(userProfile);
        if (!userProfile.roomId) {
          setView('ROOM_SETUP');
        } else if (!userProfile.hasCompletedOnboarding) {
          setView('ONBOARDING_FLOW');
        } else {
          setView('SWIPE');
        }
      } else {
        // New user - needs room setup
        console.log('👤 New user - starting room setup');
        setView('ROOM_SETUP');
      }
      setDataLoading(false);
    }).catch((error) => {
      console.error('Failed to load profile:', error);
      setDataLoading(false);
      setView('AUTH'); // Fallback to auth on error
    });
  }, [currentUser, authLoading, authInitialized]);

  // Subscribe to profile changes
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserProfile(currentUser.uid, (updatedProfile) => {
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to room data (swipes, matches, partner, AND shared settings)
  useEffect(() => {
    if (!profile?.roomId || !currentUser) return;

    const unsubSwipes = subscribeToRoomSwipes(profile.roomId, (roomSwipes) => {
      setSwipes(roomSwipes);
      setSwipesLoaded(true); // Mark that swipes have been loaded from Firestore
    });

    const unsubMatches = subscribeToRoomMatches(profile.roomId, (roomMatches) => {
      // Detect NEW matches for real-time partner notification
      const currentMatchIds = roomMatches.map(m => m.nameId);
      const newMatchIds = currentMatchIds.filter(id => !previousMatchesRef.current.includes(id));
      
      if (newMatchIds.length > 0 && previousMatchesRef.current.length > 0) {
        // A new match was created - check if we should notify
        const newMatchId = newMatchIds[0];
        
        // Only show notification if we're not already showing one (prevents double notification)
        if (!showMatchCelebration && !pendingMatchNotification) {
          console.log('💕 New match detected from partner!', newMatchId);
          setPendingMatchNotification(newMatchId);
        }
      }
      
      // Update previous matches ref
      previousMatchesRef.current = currentMatchIds;
      setMatches(roomMatches);
    });

    const unsubPartner = subscribeToPartnerConnection(profile.roomId, currentUser.uid, (connected) => {
      setIsPartnerOnline(connected);
    });

    // Initialize previous matches ref on first load
    if (previousMatchesRef.current.length === 0) {
      // Don't trigger notifications for existing matches on load
      previousMatchesRef.current = matches.map(m => m.nameId);
    }

    // Subscribe to shared room settings (COUPLES SYNC)
    const unsubRoomSettings = subscribeToRoomSettings(profile.roomId, (settings) => {
      if (settings) {
        console.log('📡 Room settings synced from partner:', settings);
        setRoomSettings(settings);
      }
    });

    // Load initial room settings
    getRoomSettings(profile.roomId).then((settings) => {
      if (settings) {
        setRoomSettings(settings);
      }
    });

    return () => {
      unsubSwipes();
      unsubMatches();
      unsubPartner();
      unsubRoomSettings();
    };
  }, [profile?.roomId, currentUser]);

  // Get effective settings (room settings take priority for couples sync)
  // IMPORTANT: dislikedNames are PER-USER only - partner's dislikes don't affect your pool
  const effectiveSettings = useMemo(() => {
    return {
      expectedGender: roomSettings?.expectedGender ?? profile?.expectedGender ?? null,
      nameStyles: roomSettings?.nameStyles ?? profile?.nameStyles ?? [],
      showTrendingOnly: roomSettings?.showTrendingOnly ?? profile?.showTrendingOnly ?? false,
      protectedNames: roomSettings?.protectedNames ?? profile?.protectedNames ?? [],
      blacklistedNames: roomSettings?.blacklistedNames ?? profile?.blacklistedNames ?? [],
      // Only current user's dislikes - each user maintains their own list
      dislikedNames: profile?.dislikedNames ?? [],
    };
  }, [roomSettings, profile]);

  // Calculate available names (used for session initialization)
  // TRIPLE-LAYER FILTERING: Blacklist + Protected + Already Swiped
  const calculateFilteredNames = useCallback(() => {
    const totalInDb = INITIAL_NAMES.length;
    const userId = currentUser?.uid;
    
    // CRITICAL: If no user ID, return all names (don't filter by swipes)
    if (!userId) {
      console.warn('⚠️ calculateFilteredNames called without currentUser.uid!');
      return INITIAL_NAMES;
    }
    
    // Normalize protected/blacklisted names for comparison
    const protectedNames = (effectiveSettings.protectedNames).map(n => n.trim().toLowerCase());
    const blacklistedNames = (effectiveSettings.blacklistedNames).map(n => n.trim().toLowerCase());
    
    // CRITICAL: Get ONLY this specific user's swipes - NOT partner's swipes!
    // This ensures User A's swipes don't affect User B's card deck
    const mySwipes = swipes.filter(s => s.userId === userId);
    const swipedNameIds = new Set(mySwipes.map(s => s.nameId));
    
    // Debug: Verify we're only using current user's swipes
    const partnerSwipes = swipes.filter(s => s.userId !== userId);
    if (partnerSwipes.length > 0) {
      console.log(`   📌 Filtering: Using ${mySwipes.length} of MY swipes, ignoring ${partnerSwipes.length} partner swipes`);
    }
    
    // Track filtering stats for debugging
    let countAfterSwipeFilter = 0;
    let countAfterExclusionFilter = 0;
    let countAfterGenderFilter = 0;
    let countAfterStyleFilter = 0;
    
    // Determine gender filter
    let gendersToMatch = filters.genders;
    if (effectiveSettings.expectedGender && effectiveSettings.expectedGender !== Gender.UNISEX) {
      gendersToMatch = [effectiveSettings.expectedGender, Gender.UNISEX];
    }
    
    // STEP 1: Filter by gender first (most selective filter)
    const genderFiltered = INITIAL_NAMES.filter(name => gendersToMatch.includes(name.gender));
    countAfterGenderFilter = genderFiltered.length;
    
    // STEP 2: Apply exclusion filters
    const exclusionFiltered = genderFiltered.filter(name => {
      const nameHebrew = name.hebrew.trim().toLowerCase();
      const nameTranslit = name.transliteration.trim().toLowerCase();
      
      // Skip protected/family names
      const isProtected = protectedNames.some(p => 
        p && (nameHebrew.includes(p) || nameTranslit.includes(p) || p.includes(nameHebrew))
      );
      
      // Skip manually blacklisted names
      const isBlacklisted = blacklistedNames.some(b => 
        b && (nameHebrew.includes(b) || nameTranslit.includes(b) || b.includes(nameHebrew))
      );
      
      return !isProtected && !isBlacklisted;
    });
    countAfterExclusionFilter = exclusionFiltered.length;
    
    // STEP 3: Remove names this user has already swiped
    // CRITICAL: Use explicit check to ensure ONLY current user's swipes are excluded
    // This is the exact logic requested: !swipes.some(s => s.nameId === name.id && s.userId === currentUserId)
    const swipeFiltered = exclusionFiltered.filter(name => {
      // Explicit check: has current user swiped this name?
      const userSwipedThis = swipes.some(s => s.nameId === name.id && s.userId === userId);
      return !userSwipedThis; // Only include if current user has NOT swiped it
    });
    countAfterSwipeFilter = swipeFiltered.length;
    
    // STEP 4: Apply optional filters (length, letter, style, trending)
    const finalFiltered = swipeFiltered.filter(name => {
      const matchesLength = name.hebrew.length >= filters.minLength && name.hebrew.length <= filters.maxLength;
      const matchesLetter = filters.startingLetter === '' || name.hebrew.startsWith(filters.startingLetter);
      
      const userStyles = effectiveSettings.nameStyles;
      const matchesStyle = userStyles.length === 0 || 
        (name.style && name.style.some(s => userStyles.includes(s)));
      
      const matchesTrending = !effectiveSettings.showTrendingOnly || name.isTrending;
      
      return matchesLength && matchesLetter && matchesStyle && matchesTrending;
    });
    countAfterStyleFilter = finalFiltered.length;
    
    // Debug logging
    console.log('\n📊 NAME POOL ANALYSIS:');
    console.log(`   👤 Current User: ${userId.slice(0, 8)}`);
    console.log(`   Total names in DB: ${totalInDb}`);
    console.log(`   Expected gender: ${effectiveSettings.expectedGender || 'All'} → Matching genders: [${gendersToMatch.join(', ')}]`);
    console.log(`   After gender filter: ${countAfterGenderFilter}`);
    console.log(`   Protected names (${protectedNames.length}): [${protectedNames.slice(0, 5).join(', ')}${protectedNames.length > 5 ? '...' : ''}]`);
    console.log(`   Blacklisted names (${blacklistedNames.length}): [${blacklistedNames.slice(0, 5).join(', ')}${blacklistedNames.length > 5 ? '...' : ''}]`);
    console.log(`   After exclusion filter: ${countAfterExclusionFilter}`);
    console.log(`   MY swipes only (${mySwipes.length}): ${mySwipes.filter(s => s.liked).length} liked, ${mySwipes.filter(s => !s.liked).length} disliked`);
    console.log(`   Partner swipes (IGNORED): ${partnerSwipes.length}`);
    console.log(`   After removing MY already-swiped: ${countAfterSwipeFilter}`);
    console.log(`   After style/length/trending filters: ${countAfterStyleFilter}`);
    console.log(`   ✅ FINAL POOL: ${finalFiltered.length} names\n`);
    
    return finalFiltered;
  }, [filters, effectiveSettings, swipes, currentUser?.uid]);

  // Initialize session names when entering SWIPE view or when settings change significantly
  // CRITICAL: Must wait for swipes to be loaded and ensure user-specific filtering
  useEffect(() => {
    // Wait for all required data before initializing
    if (view === 'SWIPE' && profile?.roomId && currentUser?.uid && swipesLoaded) {
      // IMPORTANT: Double-check user-specific swipe count
      const mySwipeCount = swipes.filter(s => s.userId === currentUser.uid).length;
      const partnerSwipeCount = swipes.length - mySwipeCount;
      
      // Check if we need to (re)initialize:
      // 1. Session not yet initialized
      // 2. Session was initialized for a different user (edge case: user switch)
      // 3. Session names are empty but we have valid data
      const needsInit = !sessionInitialized.current || 
                        swipesLoadedForUser.current !== currentUser.uid ||
                        sessionNames.length === 0;
      
      if (needsInit) {
        console.log(`\n🔄 SESSION INIT TRIGGERED for user ${currentUser.uid.slice(0, 8)}`);
        console.log(`   Room: ${profile.roomId}`);
        console.log(`   Total swipes in room: ${swipes.length}`);
        console.log(`   MY swipes: ${mySwipeCount}`);
        console.log(`   Partner's swipes: ${partnerSwipeCount}`);
        
        // Calculate filtered names with CURRENT user's swipes only
        const newNames = calculateFilteredNames();
        
        console.log(`   ✅ Session will have ${newNames.length} names available`);
        
        // Safety check: if newNames is suspiciously low, log a warning
        if (newNames.length === 0 && mySwipeCount < 50) {
          console.warn(`   ⚠️ WARNING: 0 names available but user only swiped ${mySwipeCount} times!`);
          console.warn(`   This might indicate partner's swipes are incorrectly filtering the pool.`);
        }
        
        setSessionNames(newNames);
        setCurrentNameIndex(0);
        sessionInitialized.current = true;
        swipesLoadedForUser.current = currentUser.uid;
      }
    }
  }, [view, profile?.roomId, currentUser?.uid, swipes, swipesLoaded, calculateFilteredNames]);

  // Reset session when leaving SWIPE view
  useEffect(() => {
    if (view !== 'SWIPE') {
      sessionInitialized.current = false;
      swipesLoadedForUser.current = null;
    }
  }, [view]);

  // Reset swipesLoaded when room changes (new subscription will load fresh data)
  useEffect(() => {
    setSwipesLoaded(false);
  }, [profile?.roomId]);

  // Re-initialize when room settings change (partner updated filters)
  useEffect(() => {
    if (view === 'SWIPE' && roomSettings && sessionInitialized.current) {
      const newNames = calculateFilteredNames();
      // Only update if protected/blacklisted names changed (important changes)
      // Keep current position if possible
      const currentName = sessionNames[currentNameIndex];
      setSessionNames(newNames);
      
      if (currentName) {
        const newIndex = newNames.findIndex(n => n.id === currentName.id);
        if (newIndex >= 0) {
          setCurrentNameIndex(newIndex);
        }
      }
      console.log('🔄 Session updated due to room settings change');
    }
  }, [roomSettings?.protectedNames, roomSettings?.blacklistedNames, roomSettings?.expectedGender]);

  // Handle pending match notification from partner (real-time)
  useEffect(() => {
    if (pendingMatchNotification) {
      const matchedName = INITIAL_NAMES.find(n => n.id === pendingMatchNotification);
      if (matchedName) {
        // Show celebration with a small delay for dramatic effect
        setTimeout(() => {
          setShowMatchCelebration(matchedName);
          triggerConfetti();
          setPendingMatchNotification(null);
        }, 500);
      } else {
        setPendingMatchNotification(null);
      }
    }
  }, [pendingMatchNotification]);

  // Use session names for display (stable during swiping)
  const currentBabyName = sessionNames[currentNameIndex];

  // Auth success handler
  const handleAuthSuccess = async (uid: string, email: string, displayName: string) => {
    // Check if user already has a profile
    const existingProfile = await getUserProfile(uid);
    if (existingProfile) {
      setProfile(existingProfile);
      if (!existingProfile.roomId) {
        setView('ROOM_SETUP');
      } else if (!existingProfile.hasCompletedOnboarding) {
        setView('ONBOARDING_FLOW');
      } else {
        setView('SWIPE');
      }
    } else {
      // New user - create initial profile
      const newProfile: UserProfile = {
        id: uid,
        name: displayName,
        roomId: '',
        isPartnerConnected: false,
        genderPreference: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
        expectedGender: null,
        nameStyles: [],
        showTrendingOnly: false,
        protectedNames: [],
        blacklistedNames: [],
        dislikedNames: [], // Track permanently disliked names
        hasCompletedOnboarding: false
      };
      await saveUserProfile(uid, newProfile);
      setProfile(newProfile);
      setView('ROOM_SETUP');
    }
  };

  // Dev login handler - bypasses Firebase auth for local testing
  const handleDevLogin = async (uid: string, email: string, displayName: string, roomId: string) => {
    console.log('🔧 DEV LOGIN: Setting up test user...');
    console.log(`   UID: ${uid}`);
    console.log(`   Room: ${roomId}`);
    
    // Create or get dev profile with pre-configured room
    const existingProfile = await getUserProfile(uid);
    
    if (existingProfile) {
      console.log('📂 Dev profile exists, loading...');
      setProfile(existingProfile);
      setView('SWIPE');
    } else {
      console.log('📝 Creating new dev profile...');
      const devProfile: UserProfile = {
        id: uid,
        name: displayName,
        roomId: roomId, // Pre-configured test room
        isPartnerConnected: false,
        genderPreference: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
        expectedGender: null,
        nameStyles: [],
        showTrendingOnly: false,
        protectedNames: [],
        blacklistedNames: [],
        dislikedNames: [],
        hasCompletedOnboarding: true // Skip onboarding for dev
      };
      await saveUserProfile(uid, devProfile);
      setProfile(devProfile);
      setView('SWIPE');
    }
    
    console.log('✅ Dev login complete! Ready to test.');
  };

  // Room setup complete handler
  const handleRoomSetupComplete = async (roomId: string) => {
    if (!currentUser || !profile) return;
    
    const updatedProfile = { ...profile, roomId };
    await saveUserProfile(currentUser.uid, { roomId });
    setProfile(updatedProfile);
    setView('ONBOARDING_FLOW');
  };

  // Onboarding flow complete handler
  const handleOnboardingFlowComplete = () => {
    setView('SWIPE');
    // Show notification prompt after a short delay
    setTimeout(() => {
      setShowNotificationPrompt(true);
    }, 2000);
  };

  // Update profile handler - also syncs shared settings to room for couples
  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !profile) return;
    
    const updatedProfile = { ...profile, ...updates };
    await saveUserProfile(currentUser.uid, updates);
    setProfile(updatedProfile);

    // Sync shared settings to room (for couples real-time sync)
    if (profile.roomId) {
      const sharedSettings: Partial<RoomSettings> = {};
      
      // Only sync settings that should be shared between partners
      if (updates.expectedGender !== undefined) sharedSettings.expectedGender = updates.expectedGender;
      if (updates.nameStyles !== undefined) sharedSettings.nameStyles = updates.nameStyles;
      if (updates.showTrendingOnly !== undefined) sharedSettings.showTrendingOnly = updates.showTrendingOnly;
      if (updates.protectedNames !== undefined) sharedSettings.protectedNames = updates.protectedNames;
      if (updates.blacklistedNames !== undefined) sharedSettings.blacklistedNames = updates.blacklistedNames;
      
      if (Object.keys(sharedSettings).length > 0) {
        console.log('📤 Syncing settings to room for partner:', sharedSettings);
        await saveRoomSettings(profile.roomId, sharedSettings, currentUser.uid);
      }
    }
  };

  const triggerConfetti = () => {
    // Pastel confetti colors matching baby theme
    confetti({
      particleCount: 200,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#C8E6C9', '#BBDEFB', '#FFF9C4', '#D1C4E9', '#FFCDD2', '#E1BEE7'],
      startVelocity: 30,
      gravity: 0.8,
      ticks: 200
    });
  };

  const handleSwipe = async (liked: boolean) => {
    if (!profile || !currentUser) return;
    const currentName = sessionNames[currentNameIndex];
    if (!currentName) return;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎯 SWIPE: ${liked ? '❤️ LIKE' : '👎 DISLIKE'} for "${currentName.hebrew}" (ID: ${currentName.id})`);
    console.log(`👤 User: ${currentUser.uid}`);
    console.log(`🏠 Room: ${profile.roomId}`);
    console.log(`${'='.repeat(50)}`);

    const newSwipe: SwipeRecord = {
      nameId: currentName.id,
      liked,
      userId: currentUser.uid,
      roomId: profile.roomId,
      timestamp: Date.now()
    };

    // Save swipe to Firestore FIRST
    await saveSwipe(newSwipe);
    console.log('✅ Swipe saved to Firestore');

    // If DISLIKED (swiped left) - save to user's personal disliked list
    // NOTE: Dislikes are NOT shared with partner - they might like a name you dislike
    if (!liked) {
      const currentDisliked = profile.dislikedNames || [];
      if (!currentDisliked.includes(currentName.id)) {
        const updatedDisliked = [...currentDisliked, currentName.id];
        
        // Save to user profile ONLY (not to room)
        await saveUserProfile(currentUser.uid, { dislikedNames: updatedDisliked });
        
        // Update local state immediately
        setProfile(prev => prev ? { ...prev, dislikedNames: updatedDisliked } : prev);
        
        console.log('👎 Name disliked and saved to personal list:', currentName.hebrew);
      }
    }

    // Check for match (both partners liked the same name)
    if (liked) {
      console.log('\n🔍 CHECKING FOR MATCH...');
      
      // Query Firestore directly to check if partner already liked this name
      // This is more reliable than using local state
      const { isMatch, likedByUsers } = await checkForMatch(
        profile.roomId,
        currentName.id,
        currentUser.uid
      );
      
      console.log(`📊 Match check result: isMatch=${isMatch}, likedBy=[${likedByUsers.join(', ')}]`);
      
      if (isMatch) {
        // Double-check that this match doesn't already exist
        const alreadyMatched = await matchExists(profile.roomId, currentName.id);
        
        if (alreadyMatched) {
          console.log('⚠️ Match already exists in database, skipping...');
        } else {
          console.log('🎉 NEW MATCH CONFIRMED! Creating match record...');
          
          const newMatch: Match = {
            nameId: currentName.id,
            timestamp: Date.now(),
            rating: 0
          };
          await saveMatch(profile.roomId, newMatch);
          console.log('✅ Match saved to Firestore');
          
          // Trigger push notification to partner
          try {
            const { triggerMatchNotification } = await import('./services/notificationService');
            await triggerMatchNotification(profile.roomId, currentUser.uid, currentName.hebrew);
            console.log('📤 Push notification triggered');
          } catch (notifError) {
            console.log('⚠️ Could not send notification:', notifError);
          }
          
          // Show celebration UI
          setTimeout(() => {
            console.log('🎊 Showing match celebration UI');
            setShowMatchCelebration(currentName);
            triggerConfetti();
          }, 350);
        }
      }
    }
    
    // Track this swipe for potential undo
    lastSwipedNameRef.current = { nameId: currentName.id, liked };
    
    // Move to next name in the stable session list
    setCurrentNameIndex(prev => prev + 1);
    console.log(`\n➡️ Moving to next name (index: ${currentNameIndex + 1})`);
  };

  // Track last swiped name for undo
  const lastSwipedNameRef = useRef<{ nameId: string; liked: boolean } | null>(null);

  const undoLastSwipe = async () => {
    if (!profile || !currentUser || currentNameIndex <= 0) return;
    
    // Get the last swiped name from the session
    const lastIndex = currentNameIndex - 1;
    const lastSwipedName = sessionNames[lastIndex];
    
    if (lastSwipedName && lastSwipedNameRef.current?.nameId === lastSwipedName.id) {
      try {
        // Delete the swipe from Firestore
        await deleteSwipe(profile.roomId, currentUser.uid, lastSwipedName.id);
        
        // If it was a like, also remove from dislikedNames if accidentally added
        // (This shouldn't happen but just in case)
        
        // If it was a dislike, remove from dislikedNames
        if (!lastSwipedNameRef.current.liked) {
          const currentDisliked = profile.dislikedNames || [];
          const updatedDisliked = currentDisliked.filter(id => id !== lastSwipedName.id);
          await saveUserProfile(currentUser.uid, { dislikedNames: updatedDisliked });
          setProfile(prev => prev ? { ...prev, dislikedNames: updatedDisliked } : prev);
        }
        
        // Move back in the index
        setCurrentNameIndex(prev => prev - 1);
        lastSwipedNameRef.current = null;
        
        console.log('↩️ Undo successful for:', lastSwipedName.hebrew);
      } catch (error) {
        console.error('Failed to undo swipe:', error);
      }
    } else {
      // Fallback: just move back locally if we don't have the swipe info
      setCurrentNameIndex(prev => prev - 1);
    }
  };

  // Remove a liked name (from History screen)
  const handleRemoveLike = async (nameId: string) => {
    if (!profile || !currentUser) return;
    
    try {
      // Delete the swipe from Firestore
      await deleteSwipe(profile.roomId, currentUser.uid, nameId);
      console.log('💔 Like removed for name:', nameId);
    } catch (error) {
      console.error('Failed to remove like:', error);
    }
  };

  // Remove a match (from History screen)
  const handleRemoveMatch = async (nameId: string) => {
    if (!profile || !currentUser) return;
    
    try {
      // Delete the match from Firestore
      await deleteMatch(profile.roomId, nameId);
      
      // Also delete the user's swipe for this name
      await deleteSwipe(profile.roomId, currentUser.uid, nameId);
      
      console.log('💔 Match removed for name:', nameId);
    } catch (error) {
      console.error('Failed to remove match:', error);
    }
  };

  const handleRate = async (nameId: string, rating: number) => {
    if (!profile) return;
    // Update in Firestore
    try {
      const { updateMatchRating } = await import('./services/firestoreService');
      await updateMatchRating(profile.roomId, nameId, rating);
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
    // Also update local state
    setMatches(prev => prev.map(m => m.nameId === nameId ? { ...m, rating } : m));
  };

  const toggleGenderFilter = (gender: Gender) => {
    setFilters(prev => ({
      ...prev,
      genders: prev.genders.includes(gender) 
        ? prev.genders.filter(g => g !== gender)
        : [...prev.genders, gender]
    }));
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    setProfile(null);
    setView('AUTH');
  };

  // Reset Progress handler - deletes all swipes for current user
  const handleResetProgress = async () => {
    if (!currentUser || !profile?.roomId) {
      throw new Error('No user or room');
    }
    
    console.log(`🔄 Resetting progress for user ${currentUser.uid}...`);
    
    // Delete all swipes for this user
    const deletedCount = await deleteAllUserSwipes(profile.roomId, currentUser.uid);
    
    // Also clear the user's dislikedNames array
    await saveUserProfile(currentUser.uid, { dislikedNames: [] });
    
    console.log(`✅ Reset complete! Deleted ${deletedCount} swipes.`);
    
    // Reset session state
    sessionInitialized.current = false;
    swipesLoadedForUser.current = null;
    setSwipesLoaded(false);
  };

  // Show splash screen (waits for both min time AND auth initialization)
  if (isSplash) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center z-[200]"
        style={{
          background: 'linear-gradient(135deg, #FFF5F7 0%, #FFECF0 30%, #E3F2FD 70%, #F0FFF4 100%)',
        }}
      >
        <div className="animate-splash flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-baby-pink-200/30 blur-3xl rounded-full scale-150 animate-pulse" />
            <img 
              src="/LOGO.png" 
              alt="NameIT" 
              className="relative w-72 h-72 object-contain drop-shadow-2xl"
            />
          </div>
          {/* Show subtle loading indicator if still checking auth */}
          {!authInitialized && (
            <div className="mt-8">
              <div className="w-8 h-8 border-2 border-baby-pink-200 border-t-baby-pink-400 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading while fetching user data (after auth is confirmed)
  if (dataLoading) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center z-[200]"
        style={{
          background: 'linear-gradient(135deg, #FFF5F7 0%, #FFECF0 30%, #E3F2FD 70%, #F0FFF4 100%)',
        }}
      >
        <img 
          src="/LOGO.png" 
          alt="NameIT" 
          className="w-24 h-24 object-contain mb-6 opacity-50"
        />
        <div className="w-10 h-10 border-3 border-baby-pink-200 border-t-baby-pink-400 rounded-full animate-spin" />
        <p className="mt-4 text-dreamy-slate-400 text-sm font-medium">מתחברים...</p>
      </div>
    );
  }

  return (
    <Layout 
      activeView={view} 
      setActiveView={setView} 
      showNav={view === 'SWIPE' || view === 'MATCHES' || view === 'SETTINGS'} 
      isConnected={isPartnerOnline}
    >
      {view === 'AUTH' && (
        <AuthScreen 
          onAuthSuccess={handleAuthSuccess}
          onDevLogin={handleDevLogin}
          signUp={signUp}
          login={login}
          loginWithGoogle={loginWithGoogle}
        />
      )}

      {view === 'ROOM_SETUP' && currentUser && (
        <RoomSetup 
          displayName={currentUser.displayName || profile?.name || 'משתמש'}
          onComplete={handleRoomSetupComplete}
        />
      )}
      
      {view === 'ONBOARDING_FLOW' && profile && (
        <OnboardingFlow 
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onComplete={handleOnboardingFlowComplete}
        />
      )}
      
      {view === 'SWIPE' && (
        <div className="h-full flex flex-col relative animate-fade-in overflow-hidden pb-2">
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {currentBabyName ? (
                <SwipeCard 
                  key={currentBabyName.id}
                  name={currentBabyName} 
                  onSwipe={handleSwipe} 
                  onUndo={undoLastSwipe}
                  canUndo={currentNameIndex > 0}
                  progress={currentNameIndex / Math.max(sessionNames.length, 1)}
                />
            ) : (
              <div className="text-center p-12 glass-card-strong rounded-[3rem] animate-pop mx-8">
                <div className="w-20 h-20 bg-baby-mint-100 text-baby-mint-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CircleCheck size={48} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-dreamy-slate-700 mb-2 tracking-tight">סיימנו הכל</h3>
                <p className="text-dreamy-slate-400 mb-8 max-w-[200px] mx-auto text-[16px]">אין עוד שמות להציג כרגע. בואו נבדוק את ההתאמות!</p>
                <button 
                  onClick={() => setView('MATCHES')}
                  className="w-full py-5 bg-gradient-to-r from-baby-mint-300 to-baby-mint-400 text-dreamy-slate-700 rounded-full font-bold text-lg shadow-soft-mint hover:shadow-lg transition-all active:scale-95"
                >
                  לרשימת ההתאמות
                </button>
              </div>
            )}
          </div>

          {showFilters && (
            <div className="absolute inset-0 z-[60] overlay-dreamy flex items-end">
              <div className="w-full glass-card-strong rounded-t-[3rem] p-10 animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-dreamy-slate-700 tracking-tight">סינון</h3>
                  <button onClick={() => setShowFilters(false)} className="p-2 text-dreamy-slate-400 rounded-full hover:bg-white/50 active:scale-90"><X size={24} /></button>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="text-[11px] font-bold text-dreamy-slate-400 uppercase tracking-widest mb-4">קטגוריה</p>
                    <div className="flex gap-3">
                      {[Gender.BOY, Gender.GIRL, Gender.UNISEX].map(g => (
                        <button
                          key={g}
                          onClick={() => toggleGenderFilter(g)}
                          className={`flex-1 py-4 rounded-full font-bold transition-all border ${
                            filters.genders.includes(g) 
                              ? g === Gender.BOY 
                                ? 'bg-baby-blue-100 border-baby-blue-200 text-baby-blue-500' 
                                : g === Gender.GIRL 
                                  ? 'bg-baby-pink-100 border-baby-pink-200 text-baby-pink-500'
                                  : 'bg-baby-lavender-100 border-baby-lavender-200 text-baby-lavender-300'
                              : 'bg-white/60 border-white/50 text-dreamy-slate-400'
                          }`}
                        >
                          {g === Gender.BOY ? 'בן' : g === Gender.GIRL ? 'בת' : 'יוניסקס'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-dreamy-slate-400 uppercase tracking-widest mb-4">אות פותחת</p>
                    <input 
                      type="text"
                      maxLength={1}
                      placeholder="למשל: א"
                      value={filters.startingLetter}
                      onChange={(e) => setFilters(prev => ({ ...prev, startingLetter: e.target.value }))}
                      className="w-full p-5 bg-white/60 rounded-full border border-white/50 focus:ring-2 focus:ring-baby-pink-200 outline-none text-center font-bold text-3xl text-dreamy-slate-700 transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-10 py-5 bg-gradient-to-r from-baby-pink-300 to-baby-pink-400 text-dreamy-slate-700 rounded-full font-bold text-lg shadow-soft-pink hover:shadow-lg transition-all active:scale-95"
                >
                  שמירה
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'MATCHES' && (
        <History 
          names={INITIAL_NAMES} 
          swipes={swipes} 
          matches={matches}
          currentUserId={currentUser?.uid}
          onRate={handleRate}
          onRemoveLike={handleRemoveLike}
          onRemoveMatch={handleRemoveMatch}
        />
      )}

      {view === 'SETTINGS' && (
        <Settings
          profile={profile}
          isPartnerOnline={isPartnerOnline}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
          onResetProgress={handleResetProgress}
          swipes={swipes}
          names={INITIAL_NAMES}
          currentUserId={currentUser?.uid}
        />
      )}

      {showMatchCelebration && (
        <div 
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 text-center safe-top safe-bottom overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.90)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center max-w-md w-full px-4">
            {/* Celebration Icon - Baby-themed */}
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-baby-mint-200/30 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="relative p-6 glass-card-strong rounded-[2.5rem] shadow-dreamy-lg">
                <div className="text-6xl animate-bounce">🎉</div>
              </div>
            </div>
            
            {/* Match text - Soft colors */}
            <h2 
              className="text-5xl font-black mb-3 text-dreamy-slate-700 leading-tight font-heebo"
              style={{ 
                textShadow: '0 2px 10px rgba(69, 90, 100, 0.1)',
              }}
            >
              יש התאמה!
            </h2>
            <p className="text-lg mb-8 text-dreamy-slate-500 font-medium">מצאתם שם ששניכם אוהבים</p>
            
            {/* Name card - Glass style */}
            <div 
              className="w-full max-w-sm glass-card rounded-[2.5rem] p-8 mb-8 shadow-dreamy-lg relative overflow-hidden"
              style={{
                animation: 'pop 0.5s ease-out',
                background: 'rgba(255, 255, 255, 0.60)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              {/* Subtle decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-baby-mint-200 via-baby-blue-200 to-baby-lavender-200" />
              
              {/* Subtle sparkle decorations */}
              <div className="absolute top-3 right-3 text-xl opacity-60 animate-spin" style={{ animationDuration: '3s' }}>✨</div>
              <div className="absolute bottom-3 left-3 text-xl opacity-60 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>✨</div>
              
              <div className="text-center py-4">
                <h3 className="text-[64px] font-black text-dreamy-slate-700 mb-3 font-heebo tracking-tight leading-none">
                  {showMatchCelebration.hebrew}
                </h3>
                <p className="text-baby-blue-500 font-bold text-lg tracking-[0.2em] uppercase mb-3">
                  {showMatchCelebration.transliteration}
                </p>
                {showMatchCelebration.meaning && (
                  <p className="text-sm text-dreamy-slate-400 mb-3">
                    {showMatchCelebration.meaning}
                  </p>
                )}
                <div className="mx-auto w-12 h-0.5 bg-gradient-to-r from-baby-mint-200 via-baby-blue-200 to-baby-lavender-200 rounded-full" />
              </div>
            </div>

            {/* Action buttons - Premium glass style */}
            <div className="flex flex-col gap-3 w-full max-w-[320px]">
              {/* Primary: Keep Swiping - Mint to Blue gradient */}
              <button 
                onClick={() => setShowMatchCelebration(null)}
                className="w-full py-5 bg-gradient-to-r from-baby-mint-300 to-baby-blue-300 text-dreamy-slate-700 rounded-full font-bold text-lg shadow-soft-mint hover:shadow-lg active:scale-95 transition-all"
              >
                המשיכו לחפש
              </button>
              
              {/* Secondary: Go to Favorites - Glass button */}
              <button 
                onClick={() => {
                  setShowMatchCelebration(null);
                  setView('MATCHES');
                }}
                className="w-full py-5 glass-button text-dreamy-slate-700 rounded-full font-bold text-lg border-2 border-white/50 hover:bg-white/60 active:scale-95 transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.60)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                לרשימת המועדפים
              </button>
            </div>
          </div>
        </div>
      )}

      <InstallPrompt isLoggedIn={profile !== null} />
      
      <NotificationPrompt 
        userId={currentUser?.uid || null}
        show={showNotificationPrompt && view === 'SWIPE'}
        onClose={() => setShowNotificationPrompt(false)}
      />

      {/* Debug: Simulate Match Button - Development Only */}
      {isDev && (
        <button
          onClick={() => {
            const dummyName: BabyName = {
              id: 'debug-1',
              hebrew: 'ארי',
              transliteration: 'Ari',
              meaning: 'אריה, סמל לגבורה וכוח',
              gender: Gender.BOY,
              style: [NameStyle.MODERN],
              isTrending: true
            };
            setShowMatchCelebration(dummyName);
            triggerConfetti();
            console.log('🧪 DEBUG: Simulated match for', dummyName.hebrew);
          }}
          className="fixed bottom-4 left-4 z-[200] px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          title="Test Match Modal (Dev Only)"
        >
          🧪 Test Match
        </button>
      )}
    </Layout>
  );
};

// Main App component with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
