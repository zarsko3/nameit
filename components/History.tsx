
import React, { useState } from 'react';
import { BabyName, SwipeRecord, Match, Gender } from '../types';
import { Heart, Star, Share2, Award, Trash2, X, AlertTriangle, Plus } from 'lucide-react';
import AddNameModal from './AddNameModal';

interface HistoryProps {
  names: BabyName[];
  swipes: SwipeRecord[];
  matches: Match[];
  currentUserId?: string;
  onRate: (nameId: string, rating: number) => void;
  onRemoveLike: (nameId: string) => void;
  onRemoveMatch: (nameId: string) => void;
  onAddName?: (hebrew: string, gender: Gender) => Promise<void>;
}

const History: React.FC<HistoryProps> = ({ 
  names, 
  swipes, 
  matches, 
  currentUserId,
  onRate, 
  onRemoveLike,
  onRemoveMatch,
  onAddName
}) => {
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'like' | 'match', nameId: string, name: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
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
        {/* Add Name Button - Floating Action Button */}
        {onAddName && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-baby-pink-300 to-baby-blue-300 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Plus size={20} />
              <span>הוסף שם</span>
            </button>
          </div>
        )}

        {/* Matches Section */}
        <section>
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-full px-6 py-2.5 shadow-sm">
              <Award className="text-baby-pink-400" size={20} />
              <h2 className="text-base font-bold text-dreamy-slate-700">התאמות משותפות</h2>
              <span className="px-2.5 py-0.5 bg-baby-pink-100/80 text-baby-pink-500 rounded-full text-xs font-bold">
                {matches.length}
              </span>
            </div>
          </div>
          
          {matchedNames.length === 0 ? (
            <div className="p-10 text-center glass-card rounded-3xl">
              <div className="w-16 h-16 bg-baby-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-baby-pink-400" size={32} />
              </div>
              <p className="text-sm font-bold text-dreamy-slate-600 mb-1">עדיין אין התאמות</p>
              <p className="text-xs text-dreamy-slate-400">כאן יופיעו שמות ששניכם אהבתם</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchedNames.map(name => (
                <div 
                  key={name.id} 
                  className="p-4 glass-card rounded-2xl hover:bg-white/70 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl 
                        ${name.gender === Gender.BOY 
                          ? 'bg-baby-blue-100 text-baby-blue-500 border border-baby-blue-200' 
                          : name.gender === Gender.GIRL 
                            ? 'bg-baby-pink-100 text-baby-pink-500 border border-baby-pink-200' 
                            : 'bg-baby-lavender-100 text-baby-lavender-300 border border-baby-lavender-200'
                        }`}
                      >
                        {name.hebrew[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-dreamy-slate-700 text-lg">{name.hebrew}</h3>
                        <p className="text-[10px] text-dreamy-slate-400 font-medium uppercase tracking-wider">{name.transliteration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => shareOnWhatsApp(name)}
                        className="p-2.5 text-baby-mint-400 hover:bg-baby-mint-50 rounded-full transition-colors"
                        title="שתף"
                      >
                        <Share2 size={18} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ type: 'match', nameId: name.id, name: name.hebrew })}
                        className="p-2.5 text-dreamy-slate-400 hover:text-baby-pink-500 hover:bg-baby-pink-50 rounded-full transition-colors"
                        title="הסר התאמה"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/50">
                    <span className="text-[9px] font-bold text-dreamy-slate-400 uppercase tracking-widest">דירוג</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => onRate(name.id, star)}
                          className={`p-0.5 transition-all ${star <= (name.rating || 0) ? 'text-baby-yellow-300 scale-110' : 'text-white/50 hover:text-baby-yellow-200'}`}
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
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-full px-5 py-2 shadow-sm">
              <Heart className="text-baby-pink-300" size={18} />
              <h2 className="text-sm font-bold text-dreamy-slate-600">שמות שאהבתי</h2>
              <span className="px-2 py-0.5 bg-baby-lavender-100/80 text-baby-lavender-400 rounded-full text-xs font-bold">
                {likedNames.length}
              </span>
            </div>
          </div>
          
          {likedNames.length === 0 ? (
            <p className="text-xs text-dreamy-slate-400 text-center py-6 glass-card rounded-full">
              אין עדיין שמות שרק את/ה אהבת
            </p>
          ) : (
            <div className="space-y-2">
              {likedNames.map(name => (
                <div 
                  key={name.id} 
                  className="px-4 py-3 rounded-full glass-card flex items-center justify-between group hover:bg-white/70 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      name.gender === Gender.BOY 
                        ? 'bg-baby-blue-300' 
                        : name.gender === Gender.GIRL 
                          ? 'bg-baby-pink-300' 
                          : 'bg-baby-lavender-300'
                    }`} />
                    <span className="font-bold text-dreamy-slate-600">{name.hebrew}</span>
                    <span className="text-xs text-dreamy-slate-400 uppercase">{name.transliteration}</span>
                  </div>
                  <button
                    onClick={() => setConfirmDelete({ type: 'like', nameId: name.id, name: name.hebrew })}
                    className="p-2 text-dreamy-slate-400 hover:text-baby-pink-500 hover:bg-baby-pink-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
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

      {/* Delete Confirmation Modal - Dreamy style */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] overlay-dreamy flex items-center justify-center p-6">
          <div className="glass-card-strong rounded-3xl p-6 max-w-sm w-full shadow-dreamy-lg animate-pop">
            <div className="flex items-center justify-center w-16 h-16 bg-baby-pink-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="text-baby-pink-400" size={32} />
            </div>
            
            <h3 className="text-xl font-bold text-dreamy-slate-700 text-center mb-2">
              {confirmDelete.type === 'match' ? 'הסרת התאמה' : 'הסרת לייק'}
            </h3>
            
            <p className="text-dreamy-slate-500 text-center mb-6 text-sm leading-relaxed">
              {confirmDelete.type === 'match' 
                ? `בטוח/ה שברצונך להסיר את ההתאמה לשם "${confirmDelete.name}"? פעולה זו תסיר את השם מרשימת ההתאמות של שני בני הזוג.`
                : `בטוח/ה שברצונך להסיר את הלייק לשם "${confirmDelete.name}"? השם יחזור להופיע בהחלקות עתידיות.`
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3.5 glass-button text-dreamy-slate-600 rounded-full font-bold hover:bg-white/80 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3.5 bg-gradient-to-r from-baby-pink-300 to-baby-pink-400 text-dreamy-slate-700 rounded-full font-bold shadow-soft-pink hover:shadow-lg transition-all"
              >
                הסר
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Name Modal */}
      {onAddName && (
        <AddNameModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={onAddName}
        />
      )}
    </div>
  );
};

export default History;
