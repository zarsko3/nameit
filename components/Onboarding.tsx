import React, { useState } from 'react';
import { UserProfile, Gender } from '../types';
import { ArrowLeft, Sparkles, Users } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleFinish = () => {
    if (!name || !roomId) return;
    onComplete({
      id: Math.random().toString(36).substring(7),
      name,
      roomId: roomId.trim().toLowerCase(),
      isPartnerConnected: false, // In a real app, this would check Firebase
      genderPreference: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
      // Preferences with defaults
      expectedGender: null,        // Not specified yet
      nameStyles: [],              // All styles
      showTrendingOnly: false,     // Show all names
      // Exclusion lists
      protectedNames: [],          // No protected family names
      blacklistedNames: [],        // No blacklisted names
      // Onboarding
      hasCompletedOnboarding: false // Will go through onboarding flow
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white via-white to-gray-50" dir="rtl">
      {/* Scrollable Content with Safe Areas */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="min-h-full flex flex-col items-center justify-center px-8 py-12 safe-top safe-bottom">
          {/* Logo / Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-100/50">
            <Sparkles size={40} className="text-emerald-500" />
          </div>
          
          {/* Header */}
          <h2 className="text-3xl font-bold text-gray-800 mb-2 font-heebo text-center">
            ברוכים הבאים ל-NameIT
          </h2>
          <p className="text-gray-400 mb-10 max-w-[260px] text-center leading-relaxed">
            בחירת שמות יחד, בפשטות ובאהבה.
          </p>
          
          {/* Form Card */}
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
            {/* Name Input */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2 block">
                איך קוראים לך?
              </label>
              <input 
                type="text" 
                placeholder="הזינו שם..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-200 outline-none text-center text-lg font-bold placeholder:font-normal placeholder:text-gray-300 transition-all"
              />
            </div>

            {/* Room Code Input */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2 block">
                הזינו קוד משותף
              </label>
              <div className="relative">
                <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text" 
                  placeholder="למשל: baby2025"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-200 outline-none text-center text-lg font-bold placeholder:font-normal placeholder:text-gray-300 transition-all"
                />
              </div>
              <p className="mt-2.5 text-xs text-gray-400 text-center leading-relaxed">
                הזינו קוד זהה לשל בן/בת הזוג כדי להתחבר
              </p>
            </div>
          </div>
          
          {/* Submit Button */}
          <button 
            disabled={!name || !roomId}
            onClick={handleFinish}
            className="w-full max-w-sm mt-8 p-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200/50 active:scale-[0.98]"
          >
            יוצאים לדרך
            <ArrowLeft size={20} />
          </button>
          
          {/* Bottom spacing */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
