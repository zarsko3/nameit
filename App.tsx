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
import AuthLoadingScreen from './components/AuthLoadingScreen';
import MobileContainer from './components/MobileContainer';
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
  subscribeToRoomSettings,
  findOrCreateName,
  updateRoomPriorityName,
  getNameById
} from './services/firestoreService';

// Check if we're in development mode
// @ts-ignore - Vite provides import.meta.env.DEV
const isDev = import.meta.env.DEV;

// ============ DESIGN MODE: Force Onboarding Flow ============
// Set to true to force the app to show OnboardingFlow immediately for styling
// TODO: Set to false when done designing
const DESIGN_MODE_ONBOARDING = false;
// ============================================================

// ============ FREE ROAM MODE: Disable Auth Guards for Testing ============
// Only enabled in development environment - automatically disabled in production
// This allows testing UI without logging in locally
const FREE_ROAM_MODE = isDev; // Uses import.meta.env.DEV - false in production builds
// ============================================================

const AppContent: React.FC = () => {
  const { currentUser, userProfile: authUserProfile, loading: authLoading, initialized: authInitialized, signUp, login, loginWithGoogle, logout } = useAuth();
  
  // TEMPORARY MOCK USER for Free Roam Mode (DEV ONLY)
  // Only create mock user in development - production uses real Firebase auth
  const mockUser = (isDev && FREE_ROAM_MODE) ? {
    uid: 'dev-test-user',
    email: 'test@example.com',
    displayName: 'Test User'
  } : null;
  
  const mockProfile: UserProfile = {
    id: 'dev-test-user',
    name: 'Test User',
    roomId: 'test-room-123',
    isPartnerConnected: false,
    genderPreference: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
    expectedGender: null, // unisex - show all
    nameStyles: [NameStyle.MODERN, NameStyle.CLASSIC, NameStyle.INTERNATIONAL, NameStyle.UNIQUE, NameStyle.NATURE], // all styles
    showTrendingOnly: false,
    protectedNames: [],
    blacklistedNames: [],
    dislikedNames: [],
    hasCompletedOnboarding: true
  };
  
  const [view, setView] = useState<AppView>((isDev && FREE_ROAM_MODE) ? 'SWIPE' : 'AUTH');
  const [profile, setProfile] = useState<UserProfile | null>((isDev && FREE_ROAM_MODE) ? mockProfile : null);
  
  // Use mock user/profile in free roam mode (DEV ONLY), otherwise use real auth
  const effectiveUser = (isDev && FREE_ROAM_MODE) ? mockUser : currentUser;
  const effectiveProfile = (isDev && FREE_ROAM_MODE) ? mockProfile : (authUserProfile || profile);
  const effectiveAuthLoading = (isDev && FREE_ROAM_MODE) ? false : authLoading;
  const effectiveAuthInitialized = (isDev && FREE_ROAM_MODE) ? true : authInitialized;
  
  // Alias currentUser to effectiveUser for free roam mode compatibility
  // This allows all existing code to work without changes
  const currentUserForCode = effectiveUser;
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
  const [partnerSuggestedName, setPartnerSuggestedName] = useState<string | null>(null); // Toast notification
  const previousPriorityNameRef = useRef<string | null>(null); // Track previous priorityNameId to detect changes (legacy)
  const previousPriorityActionRef = useRef<string | null>(null); // Track previous priorityAction to detect changes

  // Session-stable name list to prevent jumping during swipes
  const [sessionNames, setSessionNames] = useState<BabyName[]>([]);
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const sessionInitialized = useRef(false);
  const swipesLoadedForUser = useRef<string | null>(null); // Track which user's swipes were loaded
  const freeRoamInitialized = useRef(false); // Track if free roam mode has been initialized

  const [filters, setFilters] = useState<FilterConfig>({
    genders: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
    minLength: 0,
    maxLength: 10,
    startingLetter: '',
    nameStyles: [],
    showTrendingOnly: false
  });

  // CRITICAL: Wait for auth to fully initialize (including user profile fetch) before rendering routes
  // This prevents the flash of content issue
  useEffect(() => {
    // FREE ROAM MODE: Bypass all auth checks and allow free navigation (DEV ONLY)
    // Only initialize once on mount - don't interfere with manual navigation
    if (isDev && FREE_ROAM_MODE) {
      // Only initialize once - use ref to prevent re-initialization
      if (!freeRoamInitialized.current) {
        console.log('🆓 FREE ROAM MODE: Bypassing auth guards - allowing free navigation');
        setProfile(mockProfile);
        // Only set default view if we're still on AUTH (initial state)
        if (view === 'AUTH') {
          setView('SWIPE'); // Default to swipe screen
        }
        freeRoamInitialized.current = true;
      }
      return; // Skip all auth logic - allow free navigation
    }
    
    // DESIGN MODE: Force OnboardingFlow view for styling
    if (DESIGN_MODE_ONBOARDING) {
      console.log('🎨 DESIGN MODE: Forcing OnboardingFlow view');
      // Create a dummy profile for design mode
      const dummyProfile: UserProfile = {
        id: 'design-mode',
        name: 'Design Mode',
        roomId: 'design-room',
        isPartnerConnected: false,
        genderPreference: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
        expectedGender: null,
        nameStyles: [],
        showTrendingOnly: false,
        protectedNames: [],
        blacklistedNames: [],
        dislikedNames: [],
        hasCompletedOnboarding: false
      };
      setProfile(dummyProfile);
      setView('ONBOARDING_FLOW');
      return;
    }
    
    // Wait for auth to be fully initialized (including user profile fetch) before making routing decisions
    if (!effectiveAuthInitialized || effectiveAuthLoading) {
      return; // Still loading - don't render routes yet
    }
    
    // Auth is fully initialized - now we can safely route
    if (!effectiveUser) {
      // No user - show login
      console.log('🔐 No user session - showing login');
      setView('AUTH');
      setProfile(null);
      return;
    }

    // User is authenticated - use profile from AuthContext (already fetched)
    console.log('✅ User authenticated:', effectiveUser.email);
    
    if (authUserProfile) {
      // Profile exists - set it and route accordingly
      console.log('📋 Profile loaded from AuthContext, routing to appropriate view');
      
      // TEMPORARY FIX: Ensure existing users have default preferences and onboarding is skipped
      // This prevents crashes from missing preferences and ensures onboarding is disabled
      const needsUpdate = !authUserProfile.hasCompletedOnboarding || 
                         !authUserProfile.nameStyles || 
                         authUserProfile.nameStyles.length === 0;
      
      if (needsUpdate && currentUser) {
        console.log('🔧 Updating existing user with default preferences...');
        const defaultUpdates: Partial<UserProfile> = {
          hasCompletedOnboarding: true, // Skip onboarding
          expectedGender: authUserProfile.expectedGender ?? null, // Keep existing or set to null (all genders)
          nameStyles: authUserProfile.nameStyles && authUserProfile.nameStyles.length > 0 
            ? authUserProfile.nameStyles 
            : [NameStyle.MODERN, NameStyle.CLASSIC, NameStyle.INTERNATIONAL, NameStyle.UNIQUE, NameStyle.NATURE], // All styles if empty
        };
        // Update profile asynchronously (don't block routing)
        saveUserProfile(currentUser.uid, defaultUpdates).catch(err => {
          console.error('Failed to update user preferences:', err);
        });
        // Update local profile immediately
        const updatedProfile = { ...authUserProfile, ...defaultUpdates };
        setProfile(updatedProfile);
        
        // Route based on updated profile
        if (!updatedProfile.roomId) {
          setView('ROOM_SETUP');
        } else {
          setView('SWIPE');
        }
      } else {
        setProfile(authUserProfile);
        // Skip onboarding - go straight to swipe if room exists, otherwise room setup
        if (!authUserProfile.roomId) {
          setView('ROOM_SETUP');
        } else {
          // User has room - go directly to swipe screen (onboarding removed)
          setView('SWIPE');
        }
      }
    } else {
      // New user - needs room setup
      console.log('👤 New user - starting room setup');
      setView('ROOM_SETUP');
    }
  }, [effectiveUser, authUserProfile, effectiveAuthLoading, effectiveAuthInitialized, profile]);

  // Sync profile from AuthContext when it changes
  useEffect(() => {
    if (authUserProfile) {
      setProfile(authUserProfile);
    } else if (!currentUser) {
      // User logged out - clear profile
      setProfile(null);
    }
  }, [authUserProfile, currentUser]);

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserProfile(currentUser.uid, (updatedProfile) => {
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Onboarding flow removed - this effect is no longer needed
  // Preferences are now only accessible via Settings menu

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
    const userId = currentUserForCode?.uid;
    
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
    if (view === 'SWIPE' && profile?.roomId && currentUserForCode?.uid && swipesLoaded) {
      // IMPORTANT: Double-check user-specific swipe count
      const mySwipeCount = swipes.filter(s => s.userId === currentUserForCode.uid).length;
      const partnerSwipeCount = swipes.length - mySwipeCount;
      
      // Check if we need to (re)initialize:
      // 1. Session not yet initialized
      // 2. Session was initialized for a different user (edge case: user switch)
      // 3. Session names are empty but we have valid data
      const needsInit = !sessionInitialized.current || 
                        swipesLoadedForUser.current !== currentUserForCode.uid ||
                        sessionNames.length === 0;
      
      if (needsInit) {
        console.log(`\n🔄 SESSION INIT TRIGGERED for user ${currentUserForCode.uid.slice(0, 8)}`);
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
        swipesLoadedForUser.current = currentUserForCode.uid;
      }
    }
  }, [view, profile?.roomId, currentUserForCode?.uid, swipes, swipesLoaded, calculateFilteredNames]);

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

  // Watch for partner-suggested names (priorityAction) - Real-time sync
  useEffect(() => {
    if (!roomSettings?.priorityAction || !currentUser || !profile) return;
    
    const priorityAction = roomSettings.priorityAction;
    const currentPriorityId = priorityAction.nameId;
    
    // Check if this is a new priority (different from previous)
    if (previousPriorityActionRef.current === currentPriorityId) {
      return; // Already processed
    }
    
    // Check if timestamp is recent (last 5 seconds)
    const timeDiff = Date.now() - priorityAction.timestamp;
    if (timeDiff > 5000) {
      console.log('⏭️ Priority action is too old, ignoring');
      previousPriorityActionRef.current = currentPriorityId;
      return;
    }
    
    // Check if partner suggested this (not current user)
    if (priorityAction.addedBy === currentUser.uid) {
      console.log('✅ Priority action was set by me, skipping');
      previousPriorityActionRef.current = currentPriorityId;
      return;
    }
    
    // Check if user has already swiped this name
    const hasSwiped = swipes.some(s => s.nameId === currentPriorityId && s.userId === currentUser.uid);
    if (hasSwiped) {
      console.log('⏭️ Already swiped this name, ignoring');
      previousPriorityActionRef.current = currentPriorityId;
      return;
    }
    
    console.log('🎯 Partner suggested a name! Fetching and injecting...', currentPriorityId);
    previousPriorityActionRef.current = currentPriorityId;
    
    // Helper function to inject name into card deck
    const injectPriorityName = (name: BabyName) => {
      setSessionNames((prevNames) => {
        // Check if name is already in sessionNames
        const existingIndex = prevNames.findIndex(n => n.id === name.id);
        if (existingIndex >= 0) {
          // Name already exists, just move to front
          return [name, ...prevNames.filter(n => n.id !== name.id)];
        } else {
          // Name is new, unshift to index 0
          return [name, ...prevNames];
        }
      });
      setCurrentNameIndex(0);
      
      // Show toast notification
      setPartnerSuggestedName(name.hebrew);
      setTimeout(() => {
        setPartnerSuggestedName(null);
      }, 4000); // Hide after 4 seconds
      
      console.log('✅ Priority name injected at index 0:', name.hebrew);
    };
    
    // Fetch the name from Firestore
    getNameById(currentPriorityId).then((name) => {
      if (!name) {
        console.warn('⚠️ Could not find name with ID:', currentPriorityId);
        // Try to find in INITIAL_NAMES as fallback
        const fallbackName = INITIAL_NAMES.find(n => n.id === currentPriorityId);
        if (fallbackName) {
          injectPriorityName(fallbackName);
        }
        return;
      }
      
      injectPriorityName(name);
    }).catch((error) => {
      console.error('❌ Error fetching priority name:', error);
    });
  }, [roomSettings?.priorityAction, currentUser, profile, swipes]);

  // Legacy: Watch for partner-suggested names (priorityNameId) - Real-time sync (backward compatibility)
  useEffect(() => {
    if (!roomSettings?.priorityNameId || !currentUser || !profile) return;
    
    const priorityName = roomSettings.priorityNameId;
    const currentPriorityId = priorityName.id;
    
    // Check if this is a new priority (different from previous)
    if (previousPriorityNameRef.current === currentPriorityId) {
      return; // Already processed
    }
    
    // Check if timestamp is recent (last 10 seconds)
    const timeDiff = Date.now() - priorityName.timestamp;
    if (timeDiff > 10000) {
      console.log('⏭️ Priority name is too old, ignoring');
      previousPriorityNameRef.current = currentPriorityId;
      return;
    }
    
    // Check if partner suggested this (not current user)
    if (roomSettings.updatedBy === currentUser.uid) {
      console.log('✅ Priority name was set by me, skipping');
      previousPriorityNameRef.current = currentPriorityId;
      return;
    }
    
    // Check if user has already swiped this name
    const hasSwiped = swipes.some(s => s.nameId === currentPriorityId && s.userId === currentUser.uid);
    if (hasSwiped) {
      console.log('⏭️ Already swiped this name, ignoring');
      previousPriorityNameRef.current = currentPriorityId;
      return;
    }
    
    console.log('🎯 Partner suggested a name (legacy)! Fetching and injecting...', currentPriorityId);
    previousPriorityNameRef.current = currentPriorityId;
    
    // Helper function to inject name into card deck
    const injectPriorityName = (name: BabyName) => {
      setSessionNames((prevNames) => {
        // Check if name is already in sessionNames
        const existingIndex = prevNames.findIndex(n => n.id === name.id);
        if (existingIndex >= 0) {
          // Name already exists, just move to front
          return [name, ...prevNames.filter(n => n.id !== name.id)];
        } else {
          // Name is new, unshift to index 0
          return [name, ...prevNames];
        }
      });
      setCurrentNameIndex(0);
      
      // Show toast notification
      setPartnerSuggestedName(name.hebrew);
      setTimeout(() => {
        setPartnerSuggestedName(null);
      }, 4000); // Hide after 4 seconds
      
      console.log('✅ Priority name injected at index 0:', name.hebrew);
    };
    
    // Fetch the name from Firestore
    getNameById(currentPriorityId).then((name) => {
      if (!name) {
        console.warn('⚠️ Could not find name with ID:', currentPriorityId);
        // Try to find in INITIAL_NAMES as fallback
        const fallbackName = INITIAL_NAMES.find(n => n.id === currentPriorityId);
        if (fallbackName) {
          injectPriorityName(fallbackName);
        }
        return;
      }
      
      injectPriorityName(name);
    }).catch((error) => {
      console.error('❌ Error fetching priority name:', error);
    });
  }, [roomSettings?.priorityNameId, roomSettings?.updatedBy, currentUser, profile, swipes]);

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
      // TEMPORARY FIX: Ensure existing users have default preferences and onboarding is skipped
      const needsUpdate = !existingProfile.hasCompletedOnboarding || 
                         !existingProfile.nameStyles || 
                         existingProfile.nameStyles.length === 0;
      
      if (needsUpdate) {
        console.log('🔧 Updating existing user with default preferences...');
        const defaultUpdates: Partial<UserProfile> = {
          hasCompletedOnboarding: true, // Skip onboarding
          expectedGender: existingProfile.expectedGender ?? null, // Keep existing or set to null (all genders)
          nameStyles: existingProfile.nameStyles && existingProfile.nameStyles.length > 0 
            ? existingProfile.nameStyles 
            : [NameStyle.MODERN, NameStyle.CLASSIC, NameStyle.INTERNATIONAL, NameStyle.UNIQUE, NameStyle.NATURE], // All styles if empty
        };
        await saveUserProfile(uid, defaultUpdates);
        const updatedProfile = { ...existingProfile, ...defaultUpdates };
        setProfile(updatedProfile);
        
        // Route based on updated profile
        if (!updatedProfile.roomId) {
          setView('ROOM_SETUP');
        } else {
          setView('SWIPE');
        }
      } else {
        setProfile(existingProfile);
        // Skip onboarding - go straight to swipe if room exists, otherwise room setup
        if (!existingProfile.roomId) {
          setView('ROOM_SETUP');
        } else {
          // User has room - go directly to swipe screen (onboarding removed)
          setView('SWIPE');
        }
      }
    } else {
      // New user - create initial profile with default preferences
      // Set default preferences: show all genders, all styles, skip onboarding
      const newProfile: UserProfile = {
        id: uid,
        name: displayName,
        roomId: '',
        isPartnerConnected: false,
        genderPreference: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
        expectedGender: null, // Show all genders by default
        nameStyles: [NameStyle.MODERN, NameStyle.CLASSIC, NameStyle.INTERNATIONAL, NameStyle.UNIQUE, NameStyle.NATURE], // All styles by default
        showTrendingOnly: false,
        protectedNames: [],
        blacklistedNames: [],
        dislikedNames: [],
        hasCompletedOnboarding: true // Skip onboarding - go straight to swipe
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
        expectedGender: null, // Show all genders by default
        nameStyles: [NameStyle.MODERN, NameStyle.CLASSIC, NameStyle.INTERNATIONAL, NameStyle.UNIQUE, NameStyle.NATURE], // All styles by default
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
    // Go directly to swipe screen - onboarding is skipped
    setView('SWIPE');
  };

  // Onboarding flow complete handler
  const handleOnboardingFlowComplete = async () => {
    if (!currentUser || !profile) return;
    
    // Explicitly save hasCompletedOnboarding to Firestore
    await saveUserProfile(currentUser.uid, { hasCompletedOnboarding: true });
    
    // Update local profile state
    setProfile({ ...profile, hasCompletedOnboarding: true });
    
    // Navigate to swipe screen
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

  // Match celebration confetti - Pastel colors, cannon effect
  const triggerMatchConfetti = () => {
    // Vibrant pastel colors: Teal, Pink, Gold, Blue
    const pastelColors = ['#2DD4BF', '#F472B6', '#FBBF24', '#60A5FA'];
    
    // Cannon/spread effect from sides - Extreme z-index to render above everything
    confetti({
      particleCount: 150,
      angle: 60,
      spread: 100,
      origin: { x: 0, y: 0.6 },
      colors: pastelColors,
      startVelocity: 45,
      gravity: 0.8,
      zIndex: 99999, // Maximum z-index to ensure confetti is on top of all layers
    });
    
    confetti({
      particleCount: 150,
      angle: 120,
      spread: 100,
      origin: { x: 1, y: 0.6 },
      colors: pastelColors,
      startVelocity: 45,
      gravity: 0.8,
      zIndex: 99999, // Maximum z-index to ensure confetti is on top of all layers
    });
    
    // Center burst - Extreme z-index to render above everything
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.6 },
      colors: pastelColors,
      startVelocity: 30,
      gravity: 0.6,
      zIndex: 99999, // Maximum z-index to ensure confetti is on top of all layers
    });
    
    // Force all confetti canvas elements to have maximum z-index
    // This ensures they render above the modal backdrop
    requestAnimationFrame(() => {
      const allCanvases = document.querySelectorAll('canvas');
      allCanvases.forEach((canvas) => {
        const htmlCanvas = canvas as HTMLCanvasElement;
        // Check if this is a confetti canvas (usually has specific dimensions)
        if (htmlCanvas.width > 0 && htmlCanvas.height > 0) {
          htmlCanvas.style.position = 'fixed';
          htmlCanvas.style.zIndex = '99999';
          htmlCanvas.style.pointerEvents = 'none';
          htmlCanvas.style.top = '0';
          htmlCanvas.style.left = '0';
        }
      });
    });
  };

  // Trigger confetti when match modal opens
  useEffect(() => {
    if (showMatchCelebration) {
      // Small delay to sync with card pop animation
      setTimeout(() => {
        triggerMatchConfetti();
      }, 300);
    }
  }, [showMatchCelebration]);

  const handleSwipe = async (liked: boolean) => {
    if (!profile || !currentUserForCode) return;
    const currentName = sessionNames[currentNameIndex];
    if (!currentName) return;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎯 SWIPE: ${liked ? '❤️ LIKE' : '👎 DISLIKE'} for "${currentName.hebrew}" (ID: ${currentName.id})`);
    console.log(`👤 User: ${currentUserForCode.uid}`);
    console.log(`🏠 Room: ${profile.roomId}`);
    console.log(`${'='.repeat(50)}`);

    const newSwipe: SwipeRecord = {
      nameId: currentName.id,
      liked,
      userId: currentUserForCode.uid,
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

  // Add name manually (from History screen)
  const handleAddName = async (hebrew: string, gender: Gender) => {
    if (!profile || !currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Step 1: Get or Create Name in Firestore
      const nameId = await findOrCreateName(hebrew, gender);
      console.log('✅ Name found/created:', nameId);

      // Fetch the created name to get full details
      const createdName = await getNameById(nameId);
      if (!createdName) {
        throw new Error('Failed to fetch created name');
      }

      // Step 2: Auto-Like for Current User (Fixes 'My List')
      const swipe: SwipeRecord = {
        nameId,
        liked: true,
        userId: currentUser.uid,
        roomId: profile.roomId,
        timestamp: Date.now()
      };
      await saveSwipe(swipe);
      console.log('✅ Swipe created for added name');

      // Update local swipes state immediately so it appears in the list
      setSwipes(prev => {
        const exists = prev.some(s => s.nameId === nameId && s.userId === currentUser.uid);
        if (exists) {
          return prev;
        }
        return [...prev, swipe];
      });

      // Step 3: Inject to Partner (Fixes 'Room Sync')
      // Update priorityAction in room settings for real-time partner sync
      await saveRoomSettings(profile.roomId, {
        priorityAction: {
          nameId,
          timestamp: Date.now(),
          addedBy: currentUser.uid
        }
      }, currentUser.uid);
      console.log('✅ Room priority action updated - partner will see it soon!');

      // Return the created name so caller can use it if needed
      return createdName;
    } catch (error) {
      console.error('❌ Failed to add name:', error);
      throw error;
    }
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

  // CRITICAL: Show loading screen while auth is initializing
  // This prevents any flash of content - routes are only rendered after loading is false
  // Skip loading screen in free roam mode (DEV ONLY)
  if (!(isDev && FREE_ROAM_MODE) && (effectiveAuthLoading || !effectiveAuthInitialized)) {
    return <AuthLoadingScreen />;
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

      {view === 'ROOM_SETUP' && effectiveUser && (
        <RoomSetup 
          displayName={effectiveUser.displayName || profile?.name || 'משתמש'}
          onComplete={handleRoomSetupComplete}
        />
      )}
      
      {/* TEMPORARILY DISABLED: Onboarding flow is buggy - keeping component for Settings access later */}
      {/* {view === 'ONBOARDING_FLOW' && profile && (
        <OnboardingFlow 
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onComplete={handleOnboardingFlowComplete}
        />
      )} */}
      
      {view === 'SWIPE' && (
        <div className="h-full w-full flex flex-col relative animate-fade-in overflow-hidden overscroll-none" style={{ overscrollBehavior: 'none', touchAction: 'none' }}>
          {/* Card Container - Perfectly centered, takes all available space */}
          {/* Header is fixed in Layout, so content can use full height */}
          <div className="flex-1 flex flex-col items-center justify-center relative w-full touch-action-none" style={{ touchAction: 'none' }}>
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
          currentUserId={effectiveUser?.uid}
          onRate={handleRate}
          onRemoveLike={handleRemoveLike}
          onRemoveMatch={handleRemoveMatch}
          onAddName={handleAddName}
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
          currentUserId={effectiveUser?.uid}
        />
      )}

      {showMatchCelebration && (() => {
        // Determine background image based on matchedName.gender and user preferences
        const matchedName = showMatchCelebration;
        let matchImage: string;
        let backgroundColor: string;

        // Case A: Boy Name -> Use Boy.png
        if (matchedName.gender === Gender.BOY) {
          matchImage = '/Boy.png';
          backgroundColor = 'rgba(59, 130, 246, 0.15)'; // Blue-ish tint
        }
        // Case B: Girl Name -> Use Girl.png
        else if (matchedName.gender === Gender.GIRL) {
          matchImage = '/Girl.png';
          backgroundColor = 'rgba(244, 114, 182, 0.15)'; // Pink-ish tint
        }
        // Case C: Unisex Name -> Check user preferences
        else if (matchedName.gender === Gender.UNISEX) {
          // Check if user is specifically filtering for Boys
          const isFilteringForBoys = effectiveSettings.expectedGender === Gender.BOY ||
            (filters.genders.length === 1 && filters.genders[0] === Gender.BOY);
          
          if (isFilteringForBoys) {
            matchImage = '/Boy.png';
            backgroundColor = 'rgba(59, 130, 246, 0.15)'; // Blue-ish tint
          } else {
            // Default to Girl.png for Girls, All, or No Preference
            matchImage = '/Girl.png';
            backgroundColor = 'rgba(244, 114, 182, 0.15)'; // Pink-ish tint
          }
        }
        // Fallback (shouldn't happen, but just in case)
        else {
          matchImage = '/Girl.png';
          backgroundColor = 'rgba(244, 114, 182, 0.15)'; // Pink-ish tint
        }
        
        return (
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 safe-top safe-bottom"
            style={{
              backgroundColor: backgroundColor,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 9998, // Lower than confetti (99999) to ensure confetti renders on top
            }}
          >
            {/* Pop-up Card */}
            <div 
              className="relative w-[90%] max-w-[360px] rounded-[2rem] shadow-2xl overflow-hidden"
              style={{
                animation: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), float 4s ease-in-out infinite 0.5s',
                backgroundColor: backgroundColor, // Match background color to prevent white bars on tall screens
              }}
            >
              {/* Background Image - Inside card, maintains aspect ratio */}
              <img
                src={matchImage}
                alt="Match celebration"
                className="w-full h-auto object-contain pointer-events-none"
              />
              
              {/* Content Overlay - Absolute positioned over image */}
              <div className="absolute inset-0 flex flex-col">
                {/* Zone 1: Title (Top - Sky Area) */}
                <div className="absolute top-[15%] left-0 right-0 w-full text-center px-4">
                  <h2 
                    className="text-3xl font-bold text-white drop-shadow-md font-heebo"
                    style={{ 
                      filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))',
                    }}
                  >
                    יש התאמה!
                  </h2>
                </div>
                
                {/* Zone 2: Name & Subtitle (Center - Inside White Frame) */}
                <div className="absolute top-[45%] left-0 right-0 w-full text-center px-4">
                  {/* Baby Name - DARK color for white frame background */}
                  <h3 
                    className="text-4xl md:text-5xl font-bold mb-2 text-dreamy-slate-700 leading-none tracking-tight"
                    style={{ 
                      animation: 'pop 0.5s ease-out 0.2s both',
                    }}
                  >
                    {showMatchCelebration.hebrew}
                  </h3>
                  
                  {/* Subtitle - Dark Gray */}
                  <p className="text-base md:text-lg text-dreamy-slate-500 font-medium">
                    שם ששניכם אהבתם!
                  </p>
                </div>

                {/* Zone 3: Buttons (Bottom - Below Animals) */}
                <div className="absolute bottom-[5%] left-0 right-0 w-full px-6">
                  <div className="flex flex-col gap-2 w-full">
                    {/* Primary: Keep Swiping - Gradient Teal/Blue */}
                    <button 
                      onClick={() => setShowMatchCelebration(null)}
                      className="w-full h-11 bg-gradient-to-r from-baby-mint-400 to-baby-blue-400 text-white rounded-full font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all"
                    >
                      המשיכו לחפש
                    </button>
                    
                    {/* Secondary: Go to Favorites - Outlined */}
                    <button 
                      onClick={() => {
                        setShowMatchCelebration(null);
                        setView('MATCHES');
                      }}
                      className="w-full h-11 rounded-full font-semibold text-sm text-dreamy-slate-700 border-2 border-dreamy-slate-300 bg-white/90 hover:bg-white active:scale-95 transition-all"
                    >
                      לרשימת המועדפים
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <InstallPrompt isLoggedIn={profile !== null} />
      
      <NotificationPrompt 
        userId={currentUserForCode?.uid || null}
        show={showNotificationPrompt && view === 'SWIPE'}
        onClose={() => setShowNotificationPrompt(false)}
      />

      {/* Partner Suggested Name Toast - Positioned above navigation */}
      {partnerSuggestedName && (
        <div 
          className="fixed left-1/2 -translate-x-1/2 z-[110] animate-pop"
          style={{
            bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 0.5rem)',
            animation: 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div 
            className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border border-white/50 flex items-center gap-2"
            style={{
              backdropFilter: 'blur(24px) saturate(150%)',
              WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-baby-pink-200 to-baby-blue-200 rounded-full flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm text-dreamy-slate-700">
              השותף/ה הציע/ה שם: <span className="font-extrabold text-baby-pink-600">{partnerSuggestedName}</span>
            </span>
          </div>
        </div>
      )}

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

      {/* Free Roam Mode: Navigation Debug Panel - ONLY in development */}
      {isDev && FREE_ROAM_MODE && (
        <div className="fixed top-4 right-4 z-[200] bg-white/90 backdrop-blur-md rounded-lg p-3 shadow-xl border border-gray-200">
          <div className="text-xs font-bold text-gray-700 mb-2">🆓 Free Roam Mode</div>
          <div className="flex flex-col gap-1">
            {(['SWIPE', 'MATCHES', 'SETTINGS', 'AUTH', 'ROOM_SETUP'] as AppView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  view === v
                    ? 'bg-blue-500 text-white font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-gray-500">
            Current: {view}
          </div>
        </div>
      )}
    </Layout>
  );
};

// Main App component with AuthProvider and Mobile Container
const App: React.FC = () => {
  return (
    <MobileContainer>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MobileContainer>
  );
};

export default App;
