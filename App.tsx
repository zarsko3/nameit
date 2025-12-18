
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import OnboardingFlow from './components/OnboardingFlow';
import SwipeCard from './components/SwipeCard';
import History from './components/History';
import InstallPrompt from './components/InstallPrompt';
import Settings from './components/Settings';
import { BabyName, AppView, UserProfile, SwipeRecord, Match, Gender, NameStyle, FilterConfig } from './types';
import { INITIAL_NAMES } from './constants';
import { Sparkles, SlidersHorizontal, X, CircleCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [isSplash, setIsSplash] = useState(true);
  const [view, setView] = useState<AppView>('ONBOARDING');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [swipes, setSwipes] = useState<SwipeRecord[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const [showMatchCelebration, setShowMatchCelebration] = useState<BabyName | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Mock partner connection for demo purposes
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);

  const [filters, setFilters] = useState<FilterConfig>({
    genders: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
    minLength: 0,
    maxLength: 10,
    startingLetter: '',
    nameStyles: [],
    showTrendingOnly: false
  });

  // Minimal Splash Timer
  useEffect(() => {
    const timer = setTimeout(() => setIsSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Persistence & Simulation
  useEffect(() => {
    const savedProfile = localStorage.getItem('nm_profile');
    const savedSwipes = localStorage.getItem('nm_swipes');
    const savedMatches = localStorage.getItem('nm_matches');
    
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      // Check if user has completed onboarding
      if (parsed.hasCompletedOnboarding) {
        setView('SWIPE');
      } else {
        setView('ONBOARDING_FLOW');
      }
      // Simulate partner "logging in" after a few seconds if they have a room
      setTimeout(() => setIsPartnerOnline(true), 3000);
    }
    if (savedSwipes) setSwipes(JSON.parse(savedSwipes));
    if (savedMatches) setMatches(JSON.parse(savedMatches));
  }, []);

  useEffect(() => {
    if (profile) localStorage.setItem('nm_profile', JSON.stringify(profile));
    localStorage.setItem('nm_swipes', JSON.stringify(swipes));
    localStorage.setItem('nm_matches', JSON.stringify(matches));
  }, [profile, swipes, matches]);

  const filteredNames = useMemo(() => {
    // Normalize exclusion lists (lowercase for case-insensitive matching)
    const protectedNames = (profile?.protectedNames || []).map(n => n.toLowerCase());
    const blacklistedNames = (profile?.blacklistedNames || []).map(n => n.toLowerCase());
    
    return INITIAL_NAMES.filter(name => {
      // Exclusion filter - check protected names (family) and blacklisted names
      const nameHebrew = name.hebrew.toLowerCase();
      const nameTranslit = name.transliteration.toLowerCase();
      
      // Check if name is protected (family member name)
      const isProtected = protectedNames.some(p => 
        nameHebrew.includes(p) || nameTranslit.includes(p) || p.includes(nameHebrew)
      );
      
      // Check if name is blacklisted (names to avoid)
      const isBlacklisted = blacklistedNames.some(b => 
        nameHebrew.includes(b) || nameTranslit.includes(b) || b.includes(nameHebrew)
      );
      
      // Exclude both protected and blacklisted names from swipe deck
      if (isProtected || isBlacklisted) return false;
      
      // Gender filter - use profile preference if set, otherwise use filter
      let gendersToMatch = filters.genders;
      if (profile?.expectedGender && profile.expectedGender !== Gender.UNISEX) {
        gendersToMatch = [profile.expectedGender, Gender.UNISEX];
      }
      const matchesGender = gendersToMatch.includes(name.gender);
      
      // Length filter
      const matchesLength = name.hebrew.length >= filters.minLength && name.hebrew.length <= filters.maxLength;
      
      // Starting letter filter
      const matchesLetter = filters.startingLetter === '' || name.hebrew.startsWith(filters.startingLetter);
      
      // Name style filter - from profile preferences
      const userStyles = profile?.nameStyles || [];
      const matchesStyle = userStyles.length === 0 || 
        (name.style && name.style.some(s => userStyles.includes(s)));
      
      // Trending filter - from profile preferences
      const matchesTrending = !profile?.showTrendingOnly || name.isTrending;
      
      return matchesGender && matchesLength && matchesLetter && matchesStyle && matchesTrending;
    });
  }, [filters, profile?.expectedGender, profile?.nameStyles, profile?.showTrendingOnly, profile?.protectedNames, profile?.blacklistedNames]);

  useEffect(() => {
    if (currentNameIndex >= filteredNames.length && filteredNames.length > 0) {
      setCurrentNameIndex(0);
    }
  }, [filteredNames, currentNameIndex]);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    // Redirect to onboarding flow for new users
    setView('ONBOARDING_FLOW');
    // Simulate partner connection
    setTimeout(() => setIsPartnerOnline(true), 4000);
  };

  // Called when onboarding flow is completed or skipped
  const handleOnboardingFlowComplete = () => {
    setView('SWIPE');
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#A7F3D0', '#BAE6FD', '#FED7AA', '#FDE68A']
    });
  };

  const handleSwipe = (liked: boolean) => {
    if (!profile) return;
    const currentName = filteredNames[currentNameIndex];
    if (!currentName) return;

    const newSwipe: SwipeRecord = {
      nameId: currentName.id,
      liked,
      userId: profile.id,
      roomId: profile.roomId,
      timestamp: Date.now()
    };

    setSwipes(prev => [...prev, newSwipe]);

    // Simulated partner match logic (if partner likes it too)
    // In real app, you'd fetch swipes from roomId/swipes and check intersection
    if (liked && Math.random() > 0.65) {
      const newMatch: Match = {
        nameId: currentName.id,
        timestamp: Date.now(),
        rating: 0
      };
      setMatches(prev => [...prev, newMatch]);
      setTimeout(() => {
        setShowMatchCelebration(currentName);
        triggerConfetti();
      }, 350);
    }
    setCurrentNameIndex(prev => prev + 1);
  };

  const undoLastSwipe = () => {
    if (swipes.length === 0 || currentNameIndex === 0) return;
    const lastSwipe = swipes[swipes.length - 1];
    setSwipes(prev => prev.slice(0, -1));
    setMatches(prev => prev.filter(m => !(m.nameId === lastSwipe.nameId && m.timestamp >= lastSwipe.timestamp - 100)));
    setCurrentNameIndex(prev => prev - 1);
  };

  const handleRate = (nameId: string, rating: number) => {
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

  // Update user profile preferences
  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (isSplash) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[200]">
        <div className="animate-splash flex flex-col items-center">
            <img 
              src="/LOGO.png" 
              alt="NameIT" 
              className="w-48 h-48 object-contain"
            />
        </div>
      </div>
    );
  }

  const currentBabyName = filteredNames[currentNameIndex];

  return (
    <Layout 
      activeView={view} 
      setActiveView={setView} 
      showNav={view !== 'ONBOARDING' && view !== 'ONBOARDING_FLOW'} 
      isConnected={isPartnerOnline}
    >
      {view === 'ONBOARDING' && <Onboarding onComplete={handleOnboardingComplete} />}
      
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
                canUndo={swipes.length > 0 && currentNameIndex > 0}
                progress={currentNameIndex / filteredNames.length}
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
            onRate={handleRate}
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
        <div className="fixed inset-0 z-[100] bg-emerald-50/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 safe-top safe-bottom">
            <div className="mb-8 p-6 bg-white rounded-[3rem] shadow-xl animate-bounce">
                <Sparkles size={72} className="text-emerald-400" />
            </div>
            
            <h2 className="text-4xl font-bold mb-4 text-gray-800 leading-tight px-4 animate-in slide-in-from-top-4">
               !או יופי, החלטתם על משהו ביחד
            </h2>
            <p className="text-lg mb-10 text-gray-500 font-medium">מצאתם שם ששניכם אוהבים:</p>
            
            <div className="w-72 h-72 bg-white rounded-[4rem] border-4 border-emerald-100 flex flex-col items-center justify-center mb-14 animate-pop shadow-[0_0_60px_rgba(16,185,129,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50/30 blur-2xl rounded-full scale-75"></div>
                <h3 className="relative z-10 text-[84px] font-bold text-gray-800 mb-2 font-heebo tracking-tighter leading-none">{showMatchCelebration.hebrew}</h3>
                <p className="relative z-10 text-emerald-400 font-bold text-xl tracking-widest uppercase opacity-70">{showMatchCelebration.transliteration}</p>
            </div>

            <button 
                onClick={() => setShowMatchCelebration(null)}
                className="w-full max-w-[280px] py-6 bg-emerald-400 text-white rounded-[2.5rem] font-bold text-2xl shadow-[0_15px_30px_-5px_rgba(16,185,129,0.3)] hover:bg-emerald-500 active:scale-95 transition-all animate-in slide-in-from-bottom-8 duration-700"
            >
                ממשיכים להחליק
            </button>
        </div>
      )}

      {/* PWA Install Prompt - Shows only on mobile, when logged in, and not in standalone mode */}
      <InstallPrompt isLoggedIn={profile !== null} />
    </Layout>
  );
};

export default App;
