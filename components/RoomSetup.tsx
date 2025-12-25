import React, { useState } from 'react';
import { ArrowLeft, Users, Heart } from 'lucide-react';

interface RoomSetupProps {
  displayName: string;
  onComplete: (roomId: string) => void;
}

const RoomSetup: React.FC<RoomSetupProps> = ({ displayName, onComplete }) => {
  const [roomId, setRoomId] = useState('');

  const handleSubmit = () => {
    if (!roomId.trim()) return;
    onComplete(roomId.trim().toLowerCase());
  };

  return (
    <div className="h-full flex flex-col mesh-gradient overflow-hidden" dir="rtl">
      <div className="flex-1 flex flex-col items-center justify-between px-8 py-12 safe-top safe-bottom">
        
        {/* Header */}
        <div className="text-center animate-fade-up">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 w-40 h-40 mx-auto bg-gradient-to-br from-pink-300/30 via-purple-300/20 to-teal-300/30 blur-2xl animate-pulse" />
            <img 
              src="/LOGO.png" 
              alt="NameIT" 
              className="relative w-40 h-40 object-contain drop-shadow-2xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-heebo">
            שלום, {displayName}! 👋
          </h2>
          <p className="text-gray-400 max-w-[260px] mx-auto text-sm leading-relaxed">
            הזינו קוד משותף כדי להתחבר עם בן/בת הזוג
          </p>
        </div>
        
        {/* Room Code Input */}
        <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card rounded-[2rem] p-6 space-y-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2 block">
                קוד חדר משותף
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
              <p className="mt-3 text-xs text-gray-400 text-center leading-relaxed">
                הזינו קוד זהה לשל בן/בת הזוג כדי לראות את ההתאמות שלכם
              </p>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <button 
            disabled={!roomId.trim()}
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-emerald-200/40 hover:shadow-emerald-200/60 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all press-effect"
          >
            המשך
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

export default RoomSetup;








