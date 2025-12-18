
import React, { useState } from 'react';
import { BabyName, SwipeRecord, Match, Gender } from '../types';
import { Heart, Star, Share2, Award, Trash2, X, AlertTriangle } from 'lucide-react';

interface HistoryProps {
  names: BabyName[];
  swipes: SwipeRecord[];
  matches: Match[];
  currentUserId?: string;
  onRate: (nameId: string, rating: number) => void;
  onRemoveLike: (nameId: string) => void;
  onRemoveMatch: (nameId: string) => void;
}

const History: React.FC<HistoryProps> = ({ 
  names, 
  swipes, 
  matches, 
  currentUserId,
  onRate, 
  onRemoveLike,
  onRemoveMatch 
}) => {
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'like' | 'match', nameId: string, name: string } | null>(null);
  
  const sortedMatches = [...matches].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const matchedNames = sortedMatches.map(m => ({
    ...names.find(n => n.id === m.nameId)!,
    rating: m.rating
  })).filter(n => n); // Filter out undefined

  // Get names that only the current user liked (not matched)
  const likedNames = names.filter(n => 
    swipes.some(s => s.nameId === n.id && s.liked && s.userId === currentUserId) && 
    !matches.some(m => m.nameId === n.id)
  );

  const shareOnWhatsApp = (name: BabyName) => {
    const text = `מצאנו שם פוטנציאלי ב-NameIT! 😍\n\nשם: ${name.hebrew}\nפירוש: ${name.meaning}`;
    window.open(`whatsapp://send?text=${encodeURIComponent(text)}`);
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    
    if (confirmDelete.type === 'like') {
      onRemoveLike(confirmDelete.nameId);
    } else {
      onRemoveMatch(confirmDelete.nameId);
    }
    setConfirmDelete(null);
  };

  return (
    <div 
      className="h-full overflow-y-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="p-6 space-y-8 pb-10">
        {/* Matches Section */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Award className="text-emerald-400" size={22} />
              <h2 className="text-lg font-bold text-gray-700">התאמות משותפות</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-500 rounded-full text-xs font-bold">
              {matches.length} שמות
            </span>
          </div>
          
          {matchedNames.length === 0 ? (
            <div className="p-10 text-center bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-3xl">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="text-emerald-400" size={32} />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">עדיין אין התאמות</p>
              <p className="text-xs text-gray-400">כאן יופיעו שמות ששניכם אהבתם</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchedNames.map(name => (
                <div 
                  key={name.id} 
                  className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl 
                        ${name.gender === Gender.BOY 
                          ? 'bg-blue-50 text-blue-400 border border-blue-100' 
                          : name.gender === Gender.GIRL 
                            ? 'bg-rose-50 text-rose-400 border border-rose-100' 
                            : 'bg-purple-50 text-purple-400 border border-purple-100'
                        }`}
                      >
                        {name.hebrew[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-700 text-lg">{name.hebrew}</h3>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{name.transliteration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => shareOnWhatsApp(name)}
                        className="p-2.5 text-emerald-400 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="שתף"
                      >
                        <Share2 size={18} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ type: 'match', nameId: name.id, name: name.hebrew })}
                        className="p-2.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                        title="הסר התאמה"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">דירוג</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => onRate(name.id, star)}
                          className={`p-0.5 transition-all ${star <= (name.rating || 0) ? 'text-amber-400 scale-110' : 'text-gray-200 hover:text-amber-200'}`}
                        >
                          <Star size={18} fill={star <= (name.rating || 0) ? 'currentColor' : 'none'} strokeWidth={2} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Liked Names Section */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Heart className="text-rose-300" size={20} />
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">שמות שאהבתי</h2>
            </div>
            <span className="text-xs text-gray-400">{likedNames.length} שמות</span>
          </div>
          
          {likedNames.length === 0 ? (
            <p className="text-xs text-gray-300 text-center py-6 bg-gray-50 rounded-2xl">
              אין עדיין שמות שרק את/ה אהבת
            </p>
          ) : (
            <div className="space-y-2">
              {likedNames.map(name => (
                <div 
                  key={name.id} 
                  className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      name.gender === Gender.BOY 
                        ? 'bg-blue-300' 
                        : name.gender === Gender.GIRL 
                          ? 'bg-rose-300' 
                          : 'bg-purple-300'
                    }`} />
                    <span className="font-bold text-gray-600">{name.hebrew}</span>
                    <span className="text-xs text-gray-300 uppercase">{name.transliteration}</span>
                  </div>
                  <button
                    onClick={() => setConfirmDelete({ type: 'like', nameId: name.id, name: name.hebrew })}
                    className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="הסר לייק"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-pop">
            <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mx-auto mb-4">
              <AlertTriangle className="text-red-400" size={32} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-700 text-center mb-2">
              {confirmDelete.type === 'match' ? 'הסרת התאמה' : 'הסרת לייק'}
            </h3>
            
            <p className="text-gray-500 text-center mb-6 text-sm leading-relaxed">
              {confirmDelete.type === 'match' 
                ? `בטוח/ה שברצונך להסיר את ההתאמה לשם "${confirmDelete.name}"? פעולה זו תסיר את השם מרשימת ההתאמות של שני בני הזוג.`
                : `בטוח/ה שברצונך להסיר את הלייק לשם "${confirmDelete.name}"? השם יחזור להופיע בהחלקות עתידיות.`
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                הסר
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
