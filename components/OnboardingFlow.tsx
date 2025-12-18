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
          className={`flex-1 p-3 bg-white/80 rounded-xl border ${isBlacklist ? 'border-red-200 focus:ring-red-100' : 'border-slate-200 focus:ring-slate-100'} focus:ring-2 outline-none text-right font-medium placeholder:text-gray-300 transition-all`}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={`px-4 ${isBlacklist ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-500 hover:bg-slate-600'} text-white rounded-xl font-bold disabled:opacity-30 transition-all active:scale-95`}
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-3 py-1 ${isBlacklist ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'} rounded-full text-sm font-medium`}
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
    <div className="flex justify-center gap-2 mb-8">
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

  // Step indicator text
  const StepIndicator = () => (
    <p className="text-center text-sm text-gray-400 mb-2">
      שלב {currentStep} מתוך {TOTAL_STEPS}
    </p>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white to-gray-50 overflow-hidden" dir="rtl">
      {/* Header with Skip */}
      <div className="p-6 flex justify-between items-center shrink-0">
        {currentStep > 1 ? (
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowRight size={20} />
            <span className="text-sm font-medium">חזרה</span>
          </button>
        ) : (
          <div />
        )}
        <button 
          onClick={handleSkip}
          className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
        >
          דלג לאפליקציה
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 overflow-hidden">
        <StepIndicator />
        <ProgressDots />

        {/* Step Content with Animation */}
        <div 
          className={`flex-1 flex flex-col transition-all duration-200 ${
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
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Baby size={32} className="text-pink-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-heebo">
                  מה המגדר הצפוי?
                </h2>
                <p className="text-gray-400 text-sm">
                  בחרו את המגדר כדי שנציג לכם שמות מתאימים
                </p>
              </div>

              <div className="space-y-3 flex-1">
                <button
                  onClick={() => setSelectedGender(Gender.BOY)}
                  className={`w-full p-5 rounded-2xl font-bold transition-all flex items-center gap-4 ${
                    selectedGender === Gender.BOY
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                      : 'bg-white text-blue-500 border-2 border-blue-100 hover:border-blue-200'
                  }`}
                >
                  <span className="text-3xl">👦</span>
                  <div className="text-right">
                    <span className="text-lg">בן</span>
                    <p className={`text-sm ${selectedGender === Gender.BOY ? 'text-blue-100' : 'text-gray-400'}`}>
                      נציג שמות לבנים
                    </p>
                  </div>
                  {selectedGender === Gender.BOY && (
                    <Check size={24} className="mr-auto" />
                  )}
                </button>

                <button
                  onClick={() => setSelectedGender(Gender.GIRL)}
                  className={`w-full p-5 rounded-2xl font-bold transition-all flex items-center gap-4 ${
                    selectedGender === Gender.GIRL
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-200'
                      : 'bg-white text-pink-500 border-2 border-pink-100 hover:border-pink-200'
                  }`}
                >
                  <span className="text-3xl">👧</span>
                  <div className="text-right">
                    <span className="text-lg">בת</span>
                    <p className={`text-sm ${selectedGender === Gender.GIRL ? 'text-pink-100' : 'text-gray-400'}`}>
                      נציג שמות לבנות
                    </p>
                  </div>
                  {selectedGender === Gender.GIRL && (
                    <Check size={24} className="mr-auto" />
                  )}
                </button>

                <button
                  onClick={() => setSelectedGender(null)}
                  className={`w-full p-5 rounded-2xl font-bold transition-all flex items-center gap-4 ${
                    selectedGender === null
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-200'
                      : 'bg-white text-purple-500 border-2 border-purple-100 hover:border-purple-200'
                  }`}
                >
                  <span className="text-3xl">✨</span>
                  <div className="text-right">
                    <span className="text-lg">עדיין לא יודעים</span>
                    <p className={`text-sm ${selectedGender === null ? 'text-purple-100' : 'text-gray-400'}`}>
                      נציג את כל השמות
                    </p>
                  </div>
                  {selectedGender === null && (
                    <Check size={24} className="mr-auto" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Style Preferences */}
          {currentStep === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Palette size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-heebo">
                  איזה סגנון שמות?
                </h2>
                <p className="text-gray-400 text-sm">
                  בחרו סגנון אחד או יותר (או דלגו לכל השמות)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1">
                {NAME_STYLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedStyles.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleStyle(option.value)}
                      className={`p-4 rounded-2xl transition-all text-right relative overflow-hidden ${
                        isSelected
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-white text-gray-700 border-2 border-gray-100 hover:border-emerald-200'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 left-2">
                          <Check size={18} />
                        </div>
                      )}
                      <Icon size={28} className={`mb-2 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                      <p className="font-bold text-lg mb-1">{option.label}</p>
                      <p className={`text-xs ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedStyles.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-4">
                  לא בחרתם? נציג לכם את כל סגנונות השמות
                </p>
              )}
            </div>
          )}

          {/* Step 3: Exclusions */}
          {currentStep === 3 && (
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ListX size={32} className="text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-heebo">
                  שמות להחריג
                </h2>
                <p className="text-gray-400 text-sm">
                  הוסיפו שמות שלא תרצו לראות (אופציונלי)
                </p>
              </div>

              <div className="space-y-6 flex-1">
                {/* Protected Names */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={20} className="text-slate-500" />
                    <h3 className="font-bold text-gray-800">שמות מוגנים</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    שמות של בני משפחה שכבר קיימים
                  </p>
                  <SimpleTagInput
                    tags={protectedNames}
                    onAdd={(name) => setProtectedNames(prev => [...prev, name])}
                    onRemove={(name) => setProtectedNames(prev => prev.filter(n => n !== name))}
                    placeholder="למשל: סבתא שרה..."
                    variant="protected"
                  />
                </div>

                {/* Blacklist */}
                <div className="bg-white rounded-2xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Trash2 size={20} className="text-red-400" />
                    <h3 className="font-bold text-gray-800">רשימה שחורה</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    שמות שמעדיפים להימנע מהם
                  </p>
                  <SimpleTagInput
                    tags={blacklistedNames}
                    onAdd={(name) => setBlacklistedNames(prev => [...prev, name])}
                    onRemove={(name) => setBlacklistedNames(prev => prev.filter(n => n !== name))}
                    placeholder="הקלידו שם..."
                    variant="blacklist"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="p-6 shrink-0 bg-white border-t border-gray-100">
        <button
          onClick={handleNext}
          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-200"
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
            className="w-full mt-3 py-3 text-gray-400 font-medium text-sm hover:text-gray-600 transition-colors"
          >
            אעשה את זה אחר כך
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;

