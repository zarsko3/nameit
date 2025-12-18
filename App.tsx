import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import RoomSetup from './components/RoomSetup';
import OnboardingFlow from './components/OnboardingFlow';
import SwipeCard from './components/SwipeCard';
import History from './components/History';
import InstallPrompt from './components/InstallPrompt';
import Settings from './components/Settings';
import { BabyName, AppView, UserProfile, SwipeRecord, Match, Gender, FilterConfig, RoomSettings } from './types';
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
  subscribeToRoomSwipes,
  saveMatch,
  deleteMatch,
  subscribeToRoomMatches,
  subscribeToPartnerConnection,
  saveRoomSettings,
  getRoomSettings,
  subscribeToRoomSettings
} from './services/firestoreService';

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
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Session-stable name list to prevent jumping during swipes
  const [sessionNames, setSessionNames] = useState<BabyName[]>([]);
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const sessionInitialized = useRef(false);

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
  const effectiveSettings = useMemo(() => {
    // Merge disliked names from both user profile and room settings
    const userDisliked = profile?.dislikedNames ?? [];
    const roomDisliked = roomSettings?.dislikedNames ?? [];
    const mergedDisliked = [...new Set([...userDisliked, ...roomDisliked])];
    
    return {
      expectedGender: roomSettings?.expectedGender ?? profile?.expectedGender ?? null,
      nameStyles: roomSettings?.nameStyles ?? profile?.nameStyles ?? [],
      showTrendingOnly: roomSettings?.showTrendingOnly ?? profile?.showTrendingOnly ?? false,
      protectedNames: roomSettings?.protectedNames ?? profile?.protectedNames ?? [],
      blacklistedNames: roomSettings?.blacklistedNames ?? profile?.blacklistedNames ?? [],
      dislikedNames: mergedDisliked, // Combined from user + room
    };
  }, [roomSettings, profile]);

  // Calculate available names (used for session initialization)
  // TRIPLE-LAYER FILTERING: Blacklist + Protected + Disliked
  const calculateFilteredNames = useCallback(() => {
    const protectedNames = (effectiveSettings.protectedNames).map(n => n.toLowerCase());
    const blacklistedNames = (effectiveSettings.blacklistedNames).map(n => n.toLowerCase());
    const dislikedNameIds = effectiveSettings.dislikedNames; // Already name IDs
    const swipedNameIds = swipes.filter(s => s.userId === currentUser?.uid).map(s => s.nameId);
    
    return INITIAL_NAMES.filter(name => {
      // LAYER 1: Skip already swiped names in this session
      if (swipedNameIds.includes(name.id)) return false;
      
      // LAYER 2: Skip permanently disliked names (swiped left previously)
      if (dislikedNameIds.includes(name.id)) return false;

      const nameHebrew = name.hebrew.toLowerCase();
      const nameTranslit = name.transliteration.toLowerCase();
      
      // LAYER 3a: Skip protected/family names
      const isProtected = protectedNames.some(p => 
        nameHebrew.includes(p) || nameTranslit.includes(p) || p.includes(nameHebrew)
      );
      
      // LAYER 3b: Skip manually blacklisted names
      const isBlacklisted = blacklistedNames.some(b => 
        nameHebrew.includes(b) || nameTranslit.includes(b) || b.includes(nameHebrew)
      );
      
      if (isProtected || isBlacklisted) return false;
      
      // Apply preference filters
      let gendersToMatch = filters.genders;
      if (effectiveSettings.expectedGender && effectiveSettings.expectedGender !== Gender.UNISEX) {
        gendersToMatch = [effectiveSettings.expectedGender, Gender.UNISEX];
      }
      const matchesGender = gendersToMatch.includes(name.gender);
      
      const matchesLength = name.hebrew.length >= filters.minLength && name.hebrew.length <= filters.maxLength;
      const matchesLetter = filters.startingLetter === '' || name.hebrew.startsWith(filters.startingLetter);
      
      const userStyles = effectiveSettings.nameStyles;
      const matchesStyle = userStyles.length === 0 || 
        (name.style && name.style.some(s => userStyles.includes(s)));
      
      const matchesTrending = !effectiveSettings.showTrendingOnly || name.isTrending;
      
      return matchesGender && matchesLength && matchesLetter && matchesStyle && matchesTrending;
    });
  }, [filters, effectiveSettings, swipes, currentUser?.uid]);

  // Initialize session names when entering SWIPE view or when settings change significantly
  useEffect(() => {
    if (view === 'SWIPE' && profile?.roomId) {
      // Only initialize once per session, or when coming back from settings
      if (!sessionInitialized.current || sessionNames.length === 0) {
        const newNames = calculateFilteredNames();
        setSessionNames(newNames);
        setCurrentNameIndex(0);
        sessionInitialized.current = true;
        console.log('📋 Session initialized with', newNames.length, 'names');
      }
    }
  }, [view, profile?.roomId]);

  // Reset session when leaving SWIPE view
  useEffect(() => {
    if (view !== 'SWIPE') {
      sessionInitialized.current = false;
    }
  }, [view]);

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
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#A7F3D0', '#BAE6FD', '#FED7AA', '#FDE68A']
    });
  };

  const handleSwipe = async (liked: boolean) => {
    if (!profile || !currentUser) return;
    const currentName = sessionNames[currentNameIndex];
    if (!currentName) return;

    const newSwipe: SwipeRecord = {
      nameId: currentName.id,
      liked,
      userId: currentUser.uid,
      roomId: profile.roomId,
      timestamp: Date.now()
    };

    // Save swipe to Firestore
    await saveSwipe(newSwipe);

    // If DISLIKED (swiped left) - add to permanent disliked list
    if (!liked) {
      const currentDisliked = profile.dislikedNames || [];
      if (!currentDisliked.includes(currentName.id)) {
        const updatedDisliked = [...currentDisliked, currentName.id];
        
        // Save to user profile
        await saveUserProfile(currentUser.uid, { dislikedNames: updatedDisliked });
        
        // Sync to room for partner (so they also skip this name)
        if (profile.roomId) {
          const roomDisliked = roomSettings?.dislikedNames || [];
          const mergedRoomDisliked = [...new Set([...roomDisliked, currentName.id])];
          await saveRoomSettings(profile.roomId, { dislikedNames: mergedRoomDisliked }, currentUser.uid);
        }
        
        // Update local state immediately
        setProfile(prev => prev ? { ...prev, dislikedNames: updatedDisliked } : prev);
        
        console.log('👎 Name disliked and saved:', currentName.hebrew);
      }
    }

    // Check for match (both partners liked the same name)
    if (liked) {
      const partnerLiked = swipes.some(s => 
        s.nameId === currentName.id && 
        s.userId !== currentUser.uid && 
        s.liked
      );
      
      if (partnerLiked) {
        const newMatch: Match = {
          nameId: currentName.id,
          timestamp: Date.now(),
          rating: 0
        };
        await saveMatch(profile.roomId, newMatch);
        setTimeout(() => {
          setShowMatchCelebration(currentName);
          triggerConfetti();
        }, 350);
      }
    }
    
    // Track this swipe for potential undo
    lastSwipedNameRef.current = { nameId: currentName.id, liked };
    
    // Move to next name in the stable session list
    setCurrentNameIndex(prev => prev + 1);
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

  // Show splash screen (waits for both min time AND auth initialization)
  if (isSplash) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[200]">
        <div className="animate-splash flex flex-col items-center">
          <img 
            src="/LOGO.png" 
            alt="NameIT" 
            className="w-72 h-72 object-contain"
          />
          {/* Show subtle loading indicator if still checking auth */}
          {!authInitialized && (
            <div className="mt-8">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading while fetching user data (after auth is confirmed)
  if (dataLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[200]">
        <img 
          src="/LOGO.png" 
          alt="NameIT" 
          className="w-24 h-24 object-contain mb-6 opacity-30"
        />
        <div className="w-10 h-10 border-3 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
        <p className="mt-4 text-gray-400 text-sm font-medium">מתחברים...</p>
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
        <div className="h-full flex flex-col relative animate-fade-in overflow-hidden">
          <div className="px-8 py-2 flex justify-end z-20">
            <button 
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 text-gray-400 font-bold bg-white px-4 py-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              <SlidersHorizontal size={16} />
              <span className="text-[11px] uppercase tracking-wider">סינון</span>
            </button>
          </div>

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
              <div className="text-center p-12 bg-gray-50 rounded-[3rem] border-none animate-pop mx-8">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CircleCheck size={48} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2 tracking-tight">סיימנו הכל</h3>
                <p className="text-gray-400 mb-8 max-w-[200px] mx-auto text-[16px]">אין עוד שמות להציג כרגע. בואו נבדוק את ההתאמות!</p>
                <button 
                  onClick={() => setView('MATCHES')}
                  className="w-full py-5 bg-emerald-400 text-white rounded-2xl font-bold text-lg shadow-sm hover:bg-emerald-500 transition-all active:scale-95"
                >
                  לרשימת ההתאמות
                </button>
              </div>
            )}
          </div>

          {showFilters && (
            <div className="absolute inset-0 z-[60] bg-black/10 flex items-end">
              <div className="w-full bg-white rounded-t-[3rem] p-10 animate-fade-in shadow-2xl border-t border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-gray-700 tracking-tight">סינון</h3>
                  <button onClick={() => setShowFilters(false)} className="p-2 text-gray-300 rounded-full hover:bg-gray-50 active:scale-90"><X size={24} /></button>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-4">קטגוריה</p>
                    <div className="flex gap-3">
                      {[Gender.BOY, Gender.GIRL, Gender.UNISEX].map(g => (
                        <button
                          key={g}
                          onClick={() => toggleGenderFilter(g)}
                          className={`flex-1 py-4 rounded-xl font-bold transition-all border ${filters.genders.includes(g) ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-white border-gray-100 text-gray-300'}`}
                        >
                          {g === Gender.BOY ? 'בן' : g === Gender.GIRL ? 'בת' : 'יוניסקס'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-4">אות פותחת</p>
                    <input 
                      type="text"
                      maxLength={1}
                      placeholder="למשל: א"
                      value={filters.startingLetter}
                      onChange={(e) => setFilters(prev => ({ ...prev, startingLetter: e.target.value }))}
                      className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-50 outline-none text-center font-bold text-3xl text-gray-700 transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-10 py-5 bg-emerald-400 text-white rounded-2xl font-bold text-lg hover:bg-emerald-500 transition-all shadow-sm active:scale-95"
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
          swipes={swipes}
          names={INITIAL_NAMES}
        />
      )}

      {showMatchCelebration && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center safe-top safe-bottom overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
          }}
        >
          {/* Animated background hearts */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute text-emerald-200/40 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: `${20 + Math.random() * 40}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                💚
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Animated hearts icon */}
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-emerald-300/30 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="relative p-5 bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-200/50">
                <div className="flex items-center gap-1">
                  <span className="text-5xl animate-bounce" style={{ animationDelay: '0ms' }}>💚</span>
                  <span className="text-5xl animate-bounce" style={{ animationDelay: '100ms' }}>💚</span>
                </div>
              </div>
            </div>
            
            {/* Match text */}
            <h2 
              className="text-5xl font-black mb-2 text-emerald-600 leading-tight font-heebo"
              style={{ 
                textShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              !יש התאמה
            </h2>
            <p className="text-lg mb-8 text-emerald-700/70 font-medium">מצאתם שם ששניכם אוהבים</p>
            
            {/* Name card */}
            <div 
              className="w-80 bg-white rounded-[3rem] p-8 mb-10 shadow-2xl shadow-emerald-300/30 relative overflow-hidden"
              style={{
                animation: 'pop 0.5s ease-out',
              }}
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400" />
              
              {/* Sparkle decorations */}
              <div className="absolute top-4 right-4 text-2xl animate-spin" style={{ animationDuration: '3s' }}>✨</div>
              <div className="absolute bottom-4 left-4 text-2xl animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>✨</div>
              
              <div className="text-center py-4">
                <h3 className="text-[72px] font-black text-gray-800 mb-3 font-heebo tracking-tight leading-none">
                  {showMatchCelebration.hebrew}
                </h3>
                <p className="text-emerald-500 font-bold text-xl tracking-[0.3em] uppercase mb-4">
                  {showMatchCelebration.transliteration}
                </p>
                <div className="mx-auto w-16 h-1 bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 rounded-full" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full max-w-[300px]">
              <button 
                onClick={() => {
                  setShowMatchCelebration(null);
                  setView('MATCHES');
                }}
                className="w-full py-5 bg-white text-emerald-600 rounded-2xl font-bold text-lg border-2 border-emerald-200 hover:bg-emerald-50 active:scale-95 transition-all shadow-lg"
              >
                צפייה ברשימת ההתאמות
              </button>
              <button 
                onClick={() => setShowMatchCelebration(null)}
                className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-300/40 hover:bg-emerald-600 active:scale-95 transition-all"
              >
                ממשיכים להחליק 💚
              </button>
            </div>
          </div>
        </div>
      )}

      <InstallPrompt isLoggedIn={profile !== null} />
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
