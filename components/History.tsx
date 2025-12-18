
import React from 'react';
import { BabyName, SwipeRecord, Match, Gender } from '../types';
import { Heart, Star, Share2, Award } from 'lucide-react';

interface HistoryProps {
  names: BabyName[];
  swipes: SwipeRecord[];
  matches: Match[];
  onRate: (nameId: string, rating: number) => void;
}

const History: React.FC<HistoryProps> = ({ names, swipes, matches, onRate }) => {
  const sortedMatches = [...matches].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const matchedNames = sortedMatches.map(m => ({
    ...names.find(n => n.id === m.nameId)!,
    rating: m.rating
  }));

  const likedNames = names.filter(n => 
    swipes.some(s => s.nameId === n.id && s.liked) && 
    !matches.some(m => m.nameId === n.id)
  );

  const shareOnWhatsApp = (name: BabyName) => {
    const text = `מצאנו שם פוטנציאלי ב-NameIT! 😍\n\nשם: ${name.hebrew}\nפירוש: ${name.meaning}`;
    window.open(`whatsapp://send?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="p-8 space-y-10 bg-white">
      {/* Matches Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award className="text-emerald-400" size={24} />
            <h2 className="text-xl font-bold text-gray-700">התאמות משותפות</h2>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-400 rounded-md text-[10px] font-bold">
            {matches.length} שמות
          </span>
        </div>
        
        {matchedNames.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-3xl border-none text-gray-400">
            <p className="text-sm font-bold mb-1">עדיין אין התאמות</p>
            <p className="text-[11px]">כאן יופיעו שמות ששניכם אהבתם.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchedNames.map(name => (
              <div key={name.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl bg-white border border-gray-100 text-gray-400`}>
                      {name.hebrew[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-700 text-lg">{name.hebrew}</h3>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{name.transliteration}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => shareOnWhatsApp(name)}
                    className="p-3 text-emerald-400 hover:bg-white rounded-xl transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
                
                {/* Rating Stars */}
                <div className="flex items-center justify-between pt-4 border-t border-white">
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">דירוג</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => onRate(name.id, star)}
                        className={`transition-all ${star <= (name.rating || 0) ? 'text-amber-300 scale-110' : 'text-gray-200'}`}
                      >
                        <Star size={20} fill={star <= (name.rating || 0) ? 'currentColor' : 'none'} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Liked Section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Heart className="text-gray-300" size={20} />
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">שמות שרק את/ה אהבת</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {likedNames.length === 0 ? (
            <p className="text-[11px] text-gray-300 italic">בינתיים אין שמות כאלה.</p>
          ) : (
            likedNames.map(name => (
              <div key={name.id} className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 flex items-center gap-2">
                <span className="font-bold text-sm">{name.hebrew}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${name.gender === Gender.BOY ? 'bg-blue-200' : name.gender === Gender.GIRL ? 'bg-rose-200' : 'bg-purple-200'}`}></div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default History;
