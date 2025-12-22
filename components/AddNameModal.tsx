import React, { useState } from 'react';
import { Gender } from '../types';
import { X, Plus, Baby } from 'lucide-react';

interface AddNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (hebrew: string, gender: Gender) => Promise<void>;
}

const AddNameModal: React.FC<AddNameModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [hebrew, setHebrew] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.UNISEX);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hebrew.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(hebrew.trim(), gender);
      // Reset form
      setHebrew('');
      setGender(Gender.UNISEX);
      onClose();
    } catch (error) {
      console.error('Error adding name:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const genderOptions = [
    { value: Gender.BOY, emoji: '👦', label: 'בן', color: 'blue' },
    { value: Gender.GIRL, emoji: '👧', label: 'בת', color: 'pink' },
    { value: Gender.UNISEX, emoji: '✨', label: 'יוניסקס', color: 'purple' },
  ];

  return (
    <div className="fixed inset-0 z-[100] overlay-dreamy flex items-center justify-center p-6">
      <div className="glass-card-strong rounded-3xl p-6 max-w-sm w-full shadow-dreamy-lg animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-baby-pink-200 to-baby-blue-200 rounded-full flex items-center justify-center">
              <Plus className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-dreamy-slate-700">הוסף שם</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dreamy-slate-400 hover:text-dreamy-slate-600 hover:bg-white/60 rounded-full transition-colors"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hebrew Name Input */}
          <div>
            <label className="block text-sm font-bold text-dreamy-slate-600 mb-2">
              שם בעברית
            </label>
            <input
              type="text"
              value={hebrew}
              onChange={(e) => setHebrew(e.target.value)}
              placeholder="למשל: גאיה"
              className="w-full p-4 bg-white/60 rounded-2xl border border-white/50 focus:ring-2 focus:ring-baby-pink-200 focus:border-baby-pink-300 outline-none text-right text-lg font-bold text-dreamy-slate-700 transition-all"
              dir="rtl"
              required
              autoFocus
            />
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-bold text-dreamy-slate-600 mb-3">
              מגדר
            </label>
            <div className="flex gap-2">
              {genderOptions.map((option) => {
                const isSelected = gender === option.value;
                const gradients = {
                  blue: 'from-baby-blue-200 to-baby-blue-300 shadow-soft-blue',
                  pink: 'from-baby-pink-200 to-baby-pink-300 shadow-soft-pink',
                  purple: 'from-baby-lavender-200 to-baby-lavender-300 shadow-soft-lavender',
                };

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGender(option.value)}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? `bg-gradient-to-br ${gradients[option.color as keyof typeof gradients]} border-transparent text-white shadow-lg scale-105`
                        : 'bg-white/40 border-white/50 text-dreamy-slate-500 hover:bg-white/60'
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-xs font-bold">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!hebrew.trim() || isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-baby-pink-300 to-baby-blue-300 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>מוסיף...</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                <span>הוסף והצע</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNameModal;

