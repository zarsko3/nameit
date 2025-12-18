
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
      blacklist: [],               // No blacklisted names
      familyNames: []              // No family names to exclude
    });
  };

  return (
    <div className="h-full flex flex-col p-10 bg-white">
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8">
          <Sparkles size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-700 mb-2">ברוכים הבאים ל-NameIT</h2>
        <p className="text-gray-400 mb-10 max-w-[240px] text-sm">בחירת שמות יחד, בפשטות ובאהבה.</p>
        
        <div className="w-full space-y-4">
          <div className="text-right">
            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2 mb-1 block">איך קוראים לך?</label>
            <input 
                type="text" 
                placeholder="הזינו שם..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-100 outline-none text-center text-lg font-bold placeholder:font-normal placeholder:text-gray-300 transition-all"
            />
          </div>

          <div className="text-right">
            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2 mb-1 block">הזינו קוד משותף</label>
            <div className="relative">
              <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                  type="text" 
                  placeholder="למשל: baby2025"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-100 outline-none text-center text-lg font-bold placeholder:font-normal placeholder:text-gray-300 transition-all"
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-400 text-center">הזינו קוד זהה לשל בן/בת הזוג כדי להתחבר</p>
          </div>
        </div>
        
        <button 
          disabled={!name || !roomId}
          onClick={handleFinish}
          className="w-full mt-10 p-5 bg-emerald-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 disabled:opacity-30 transition-all shadow-md active:scale-95"
        >
          יוצאים לדרך
          <ArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
