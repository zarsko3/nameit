import React, { useState } from 'react';
import { UserProfile, Gender } from '../types';
import { ArrowLeft, Users, Heart } from 'lucide-react';

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
      isPartnerConnected: false,
      genderPreference: [Gender.BOY, Gender.GIRL, Gender.UNISEX],
      expectedGender: null,
      nameStyles: [],
      showTrendingOnly: false,
      protectedNames: [],
      blacklistedNames: [],
      hasCompletedOnboarding: false
    });
  };

  return (
    <div className="h-full flex flex-col mesh-gradient overflow-hidden" dir="rtl">
      {/* Full-Height Centered Layout */}
      <div className="flex-1 flex flex-col items-center justify-between px-8 py-12 safe-top safe-bottom">
        
        {/* Top Section - Logo & Welcome */}
        <div className="text-center animate-fade-up">
          <div className="relative inline-block mb-4">
            {/* Logo with glow effect */}
            <div className="absolute inset-0 w-52 h-52 mx-auto bg-gradient-to-br from-pink-300/30 via-purple-300/20 to-teal-300/30 blur-2xl animate-pulse" />
            <img 
              src="/logo_new.png" 
              alt="maybe?" 
              className="relative h-52 w-auto object-contain drop-shadow-2xl"
            />
          </div>
          <p className="text-gray-400 max-w-[220px] mx-auto text-sm leading-relaxed">
            בחירת שמות לתינוק שלכם, יחד ובקלות
          </p>
        </div>
        
        {/* Middle Section - Form Card */}
        <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card rounded-[2rem] p-6 space-y-5">
            {/* Name Input */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2 block">
                איך קוראים לך?
              </label>
              <input 
                type="text" 
                placeholder="הזינו שם..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-white/60 border border-white/50 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-center text-lg font-bold placeholder:font-normal placeholder:text-gray-300 transition-all"
              />
            </div>

            {/* Room Code Input */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2 block">
                קוד משותף
              </label>
              <div className="relative">
                <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text" 
                  placeholder="למשל: baby2025"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-5 py-4 pr-12 rounded-2xl bg-white/60 border border-white/50 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-center text-lg font-bold placeholder:font-normal placeholder:text-gray-300 transition-all"
                />
              </div>
              <p className="mt-3 text-[11px] text-gray-400 text-center leading-relaxed">
                הזינו קוד זהה לשל בן/בת הזוג כדי להתחבר
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Section - CTA Button */}
        <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <button 
            disabled={!name || !roomId}
            onClick={handleFinish}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-emerald-200/40 hover:shadow-emerald-200/60 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all press-effect"
          >
            יוצאים לדרך
            <ArrowLeft size={20} />
          </button>
          
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-6 text-gray-300">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
              <Heart size={12} className="text-pink-300" />
              <span>פרטיות מלאה</span>
            </div>
            <div className="w-1 h-1 bg-gray-200 rounded-full" />
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
              <Users size={12} className="text-emerald-300" />
              <span>סנכרון מיידי</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
