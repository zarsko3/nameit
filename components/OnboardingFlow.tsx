import React, { useState } from 'react';
import { UserProfile, Gender, NameStyle } from '../types';
import { 
  Sparkles, 
  Crown, 
  Globe, 
  Star, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  Trash2,
  Plus,
  X,
  Check,
  Baby,
  Palette,
  ListX
} from 'lucide-react';

interface OnboardingFlowProps {
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

// Name style options
const NAME_STYLE_OPTIONS = [
  { value: NameStyle.MODERN, label: 'מודרני', icon: Sparkles, description: 'שמות עכשוויים ורעננים', color: 'emerald' },
  { value: NameStyle.CLASSIC, label: 'קלאסי', icon: Crown, description: 'שמות מסורתיים ונצחיים', color: 'amber' },
  { value: NameStyle.INTERNATIONAL, label: 'בינלאומי', icon: Globe, description: 'שמות שעובדים בכל שפה', color: 'blue' },
  { value: NameStyle.UNIQUE, label: 'ייחודי', icon: Star, description: 'שמות נדירים ומיוחדים', color: 'purple' },
];

// Simple Tag Input for exclusions
const SimpleTagInput: React.FC<{
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  variant: 'protected' | 'blacklist';
}> = ({ tags, onAdd, onRemove, placeholder, variant }) => {
  const [inputValue, setInputValue] = useState('');
  const isBlacklist = variant === 'blacklist';

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInputValue('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          className={`flex-1 p-3.5 bg-white rounded-xl border ${isBlacklist ? 'border-red-200 focus:ring-red-100' : 'border-slate-200 focus:ring-slate-100'} focus:ring-2 outline-none text-right font-medium placeholder:text-gray-300 transition-all`}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={`px-4 ${isBlacklist ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-500 hover:bg-slate-600'} text-white rounded-xl font-bold disabled:opacity-30 transition-all active:scale-95`}
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${isBlacklist ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'} rounded-full text-sm font-medium`}
          >
            {tag}
            <button onClick={() => onRemove(tag)} className="hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  profile, 
  onUpdateProfile, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  // Local state for preferences before saving
  const [selectedGender, setSelectedGender] = useState<Gender | null>(profile.expectedGender);
  const [selectedStyles, setSelectedStyles] = useState<NameStyle[]>(profile.nameStyles || []);
  const [protectedNames, setProtectedNames] = useState<string[]>(profile.protectedNames || []);
  const [blacklistedNames, setBlacklistedNames] = useState<string[]>(profile.blacklistedNames || []);

  const goToStep = (step: number, direction: 'left' | 'right') => {
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsAnimating(false);
    }, 200);
  };

  const handleNext = () => {
    // Save current step data
    if (currentStep === 1) {
      onUpdateProfile({ expectedGender: selectedGender });
    } else if (currentStep === 2) {
      onUpdateProfile({ nameStyles: selectedStyles });
    } else if (currentStep === 3) {
      onUpdateProfile({ protectedNames, blacklistedNames });
    }

    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1, 'left');
    } else {
      // Complete onboarding
      onUpdateProfile({ hasCompletedOnboarding: true });
      onComplete();
    }
  };

  const handleSkip = () => {
    // Mark as completed and go to main app
    onUpdateProfile({ hasCompletedOnboarding: true });
    onComplete();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1, 'right');
    }
  };

  const toggleStyle = (style: NameStyle) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  // Progress dots
  const ProgressDots = () => (
    <div className="flex justify-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i + 1 === currentStep 
              ? 'w-8 bg-emerald-500' 
              : i + 1 < currentStep 
                ? 'w-2 bg-emerald-300' 
                : 'w-2 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white via-gray-50/50 to-gray-100" dir="rtl">
      {/* Fixed Header with Safe Area */}
      <div className="shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 safe-top">
        <div className="px-5 py-4 flex justify-between items-center">
          {currentStep > 1 ? (
            <button 
              onClick={handleBack}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              <ArrowRight size={20} />
              <span className="text-sm font-medium">חזרה</span>
            </button>
          ) : (
            <div className="w-16" />
          )}
          
          {/* Step indicator in header */}
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-400 mb-1.5">שלב {currentStep} מתוך {TOTAL_STEPS}</p>
            <ProgressDots />
          </div>
          
          <button 
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors py-2"
          >
            דלג
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div 
          className={`min-h-full flex flex-col px-6 py-8 transition-all duration-200 ${
            isAnimating 
              ? slideDirection === 'left' 
                ? 'opacity-0 -translate-x-4' 
                : 'opacity-0 translate-x-4'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Step 1: Gender Selection */}
          {currentStep === 1 && (
            <div className="flex-1 flex flex-col">
              {/* Header Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Baby size={28} className="text-pink-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 font-heebo mb-1">
                      מה המגדר הצפוי?
                    </h2>
                    <p className="text-gray-400 text-sm">
                      בחרו כדי שנציג שמות מתאימים
                    </p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedGender(Gender.BOY)}
                  className={`w-full p-5 rounded-2xl font-bold transition-all flex items-center gap-4 ${
                    selectedGender === Gender.BOY
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-200/50'
                      : 'bg-white text-blue-600 border-2 border-blue-100 hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                >
                  <span className="text-3xl">👦</span>
                  <div className="text-right flex-1">
                    <span className="text-lg block">בן</span>
                    <p className={`text-sm ${selectedGender === Gender.BOY ? 'text-blue-100' : 'text-gray-400'}`}>
                      נציג שמות לבנים
                    </p>
                  </div>
                  {selectedGender === Gender.BOY && (
                    <Check size={24} />
                  )}
                </button>

                <button
                  onClick={() => setSelectedGender(Gender.GIRL)}
                  className={`w-full p-5 rounded-2xl font-bold transition-all flex items-center gap-4 ${
                    selectedGender === Gender.GIRL
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-200/50'
                      : 'bg-white text-pink-600 border-2 border-pink-100 hover:border-pink-200 hover:bg-pink-50/50'
                  }`}
                >
                  <span className="text-3xl">👧</span>
                  <div className="text-right flex-1">
                    <span className="text-lg block">בת</span>
                    <p className={`text-sm ${selectedGender === Gender.GIRL ? 'text-pink-100' : 'text-gray-400'}`}>
                      נציג שמות לבנות
                    </p>
                  </div>
                  {selectedGender === Gender.GIRL && (
                    <Check size={24} />
                  )}
                </button>

                <button
                  onClick={() => setSelectedGender(null)}
                  className={`w-full p-5 rounded-2xl font-bold transition-all flex items-center gap-4 ${
                    selectedGender === null
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-200/50'
                      : 'bg-white text-purple-600 border-2 border-purple-100 hover:border-purple-200 hover:bg-purple-50/50'
                  }`}
                >
                  <span className="text-3xl">✨</span>
                  <div className="text-right flex-1">
                    <span className="text-lg block">עדיין לא יודעים</span>
                    <p className={`text-sm ${selectedGender === null ? 'text-purple-100' : 'text-gray-400'}`}>
                      נציג את כל השמות
                    </p>
                  </div>
                  {selectedGender === null && (
                    <Check size={24} />
                  )}
                </button>
              </div>
              
              {/* Spacer for bottom button */}
              <div className="h-32" />
            </div>
          )}

          {/* Step 2: Style Preferences */}
          {currentStep === 2 && (
            <div className="flex-1 flex flex-col">
              {/* Header Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Palette size={28} className="text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 font-heebo mb-1">
                      איזה סגנון שמות?
                    </h2>
                    <p className="text-gray-400 text-sm">
                      בחרו אחד או יותר (אופציונלי)
                    </p>
                  </div>
                </div>
              </div>

              {/* Style Grid */}
              <div className="grid grid-cols-2 gap-3">
                {NAME_STYLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedStyles.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleStyle(option.value)}
                      className={`p-5 rounded-2xl transition-all text-right relative overflow-hidden ${
                        isSelected
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50'
                          : 'bg-white text-gray-700 border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 left-3">
                          <Check size={18} />
                        </div>
                      )}
                      <Icon size={28} className={`mb-3 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                      <p className="font-bold text-lg mb-1">{option.label}</p>
                      <p className={`text-xs leading-relaxed ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedStyles.length === 0 && (
                <div className="mt-6 bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-sm text-gray-400">
                    לא בחרתם? נציג לכם את כל סגנונות השמות
                  </p>
                </div>
              )}
              
              {/* Spacer for bottom button */}
              <div className="h-32" />
            </div>
          )}

          {/* Step 3: Exclusions */}
          {currentStep === 3 && (
            <div className="flex-1 flex flex-col">
              {/* Header Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                    <ListX size={28} className="text-slate-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 font-heebo mb-1">
                      שמות להחריג
                    </h2>
                    <p className="text-gray-400 text-sm">
                      שמות שלא תרצו לראות (אופציונלי)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Protected Names Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <ShieldCheck size={20} className="text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">שמות מוגנים</h3>
                      <p className="text-xs text-gray-400">שמות של בני משפחה קיימים</p>
                    </div>
                  </div>
                  <SimpleTagInput
                    tags={protectedNames}
                    onAdd={(name) => setProtectedNames(prev => [...prev, name])}
                    onRemove={(name) => setProtectedNames(prev => prev.filter(n => n !== name))}
                    placeholder="למשל: סבתא שרה..."
                    variant="protected"
                  />
                </div>

                {/* Blacklist Card */}
                <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <Trash2 size={20} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">רשימה שחורה</h3>
                      <p className="text-xs text-gray-400">שמות שמעדיפים להימנע מהם</p>
                    </div>
                  </div>
                  <SimpleTagInput
                    tags={blacklistedNames}
                    onAdd={(name) => setBlacklistedNames(prev => [...prev, name])}
                    onRemove={(name) => setBlacklistedNames(prev => prev.filter(n => n !== name))}
                    placeholder="הקלידו שם..."
                    variant="blacklist"
                  />
                </div>
              </div>
              
              {/* Spacer for bottom button */}
              <div className="h-32" />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Navigation with Safe Area */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-bottom">
        <div className="px-6 py-4">
          <button
            onClick={handleNext}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-200/50"
          >
            {currentStep === TOTAL_STEPS ? (
              <>
                <span>יוצאים לדרך!</span>
                <Sparkles size={22} />
              </>
            ) : (
              <>
                <span>המשך</span>
                <ArrowLeft size={22} />
              </>
            )}
          </button>
          
          {currentStep < TOTAL_STEPS && (
            <button
              onClick={handleSkip}
              className="w-full mt-2 py-3 text-gray-400 font-medium text-sm hover:text-gray-600 transition-colors"
            >
              אעשה את זה אחר כך
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
