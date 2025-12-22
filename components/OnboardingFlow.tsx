import React, { useState, useEffect } from 'react';
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
  ListX,
  Mars,
  Venus,
  Gift
} from 'lucide-react';

interface OnboardingFlowProps {
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

// Name style options
const NAME_STYLE_OPTIONS = [
  { value: NameStyle.MODERN, label: 'מודרני', icon: Sparkles, description: 'שמות עכשוויים ורעננים' },
  { value: NameStyle.CLASSIC, label: 'קלאסי', icon: Crown, description: 'שמות מסורתיים ונצחיים' },
  { value: NameStyle.INTERNATIONAL, label: 'בינלאומי', icon: Globe, description: 'שמות שעובדים בכל שפה' },
  { value: NameStyle.UNIQUE, label: 'ייחודי', icon: Star, description: 'שמות נדירים ומיוחדים' },
];

// Premium Tag Input
const PremiumTagInput: React.FC<{
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
          className={`flex-1 px-4 py-3.5 glass-card rounded-2xl outline-none text-right font-medium placeholder:text-gray-300 transition-all focus:ring-2 ${
            isBlacklist ? 'focus:ring-red-200' : 'focus:ring-emerald-200'
          }`}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={`w-12 h-12 rounded-2xl font-bold disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center ${
            isBlacklist 
              ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200/50' 
              : 'bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-200/50'
          }`}
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {tags.map((tag, index) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium animate-scale-in glass-card ${
              isBlacklist ? 'text-red-700' : 'text-slate-700'
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {tag}
            <button 
              onClick={() => onRemove(tag)} 
              className="w-5 h-5 rounded-full bg-white/60 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-all"
            >
              <X size={12} />
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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Local state for preferences
  const [selectedGender, setSelectedGender] = useState<Gender | null>(profile.expectedGender);
  const [hasSelectedGender, setHasSelectedGender] = useState(false); // Track if user has made a selection
  const [selectedStyles, setSelectedStyles] = useState<NameStyle[]>(profile.nameStyles || []);
  const [protectedNames, setProtectedNames] = useState<string[]>(profile.protectedNames || []);
  const [blacklistedNames, setBlacklistedNames] = useState<string[]>(profile.blacklistedNames || []);

  const goToStep = (step: number, direction: 'left' | 'right') => {
    setSlideDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(step);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
  };

  const handleNext = () => {
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
      onUpdateProfile({ hasCompletedOnboarding: true });
      onComplete();
    }
  };

  const handleSkip = () => {
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

  // Get animation class based on transition state
  const getAnimationClass = () => {
    if (isTransitioning) {
      return slideDirection === 'left' 
        ? 'opacity-0 translate-x-8' 
        : 'opacity-0 -translate-x-8';
    }
    return 'opacity-100 translate-x-0';
  };

  return (
    <div className="h-full flex flex-col mesh-gradient overflow-hidden" dir="rtl">
      {/* Premium Header */}
      <div className="shrink-0 glass-solid safe-top">
        <div className="px-5 py-4 flex justify-between items-center">
          {currentStep > 1 ? (
            <button 
              onClick={handleBack}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-all py-2 press-effect"
            >
              <ArrowRight size={18} />
              <span className="text-sm font-medium">חזרה</span>
            </button>
          ) : (
            <div className="w-16" />
          )}
          
          {/* Progress Indicator */}
          <div className="flex flex-col items-center">
            <div className="flex gap-2 mb-1">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i + 1 === currentStep 
                      ? 'w-8 bg-gradient-to-r from-emerald-400 to-teal-500' 
                      : i + 1 < currentStep 
                        ? 'w-1.5 bg-emerald-300' 
                        : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              {currentStep} / {TOTAL_STEPS}
            </p>
          </div>
          
          <button 
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-all py-2"
          >
            דלג
          </button>
        </div>
      </div>

      {/* Full-Height Content Area */}
      <div className="flex-1 flex flex-col scroll-hidden">
        <div 
          className={`flex-1 flex flex-col px-6 py-6 transition-all duration-300 ease-out ${getAnimationClass()}`}
        >
          {/* Step 1: Gender Selection */}
          {currentStep === 1 && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-dreamy-slate-700 font-heebo mb-2">
                  מה המגדר הצפוי?
                </h2>
                <p className="text-dreamy-slate-500 text-sm max-w-[280px] mx-auto">
                  בחרו כדי שנציג לכם שמות מתאימים
                </p>
              </div>

              {/* Gender Selection Cards - Grid Layout */}
              <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-4">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {/* Boy Card - Square */}
                  {(() => {
                    const isSelected = selectedGender === Gender.BOY;
                    return (
                      <button
                        onClick={() => {
                          setSelectedGender(Gender.BOY);
                          setHasSelectedGender(true);
                        }}
                        className={`
                          aspect-square rounded-2xl transition-all duration-300
                          flex flex-col items-center justify-center gap-3
                          press-effect animate-fade-up
                          ${isSelected 
                            ? 'ring-4 ring-blue-200 bg-blue-50/80 shadow-lg shadow-blue-200/20' 
                            : 'bg-white/60 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-md hover:bg-white/80'
                          }
                        `}
                        style={{ animationDelay: '0s' }}
                      >
                        <div className={`
                          w-12 h-12 flex items-center justify-center
                          ${isSelected ? 'text-blue-500' : 'text-dreamy-slate-400'}
                        `}>
                          <Mars size={48} strokeWidth={1.5} />
                        </div>
                        <span className={`
                          text-lg font-bold font-heebo
                          ${isSelected ? 'text-blue-600' : 'text-dreamy-slate-700'}
                        `}>
                          בן
                        </span>
                      </button>
                    );
                  })()}

                  {/* Girl Card - Square */}
                  {(() => {
                    const isSelected = selectedGender === Gender.GIRL;
                    return (
                      <button
                        onClick={() => {
                          setSelectedGender(Gender.GIRL);
                          setHasSelectedGender(true);
                        }}
                        className={`
                          aspect-square rounded-2xl transition-all duration-300
                          flex flex-col items-center justify-center gap-3
                          press-effect animate-fade-up
                          ${isSelected 
                            ? 'ring-4 ring-pink-200 bg-pink-50/80 shadow-lg shadow-pink-200/20' 
                            : 'bg-white/60 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-md hover:bg-white/80'
                          }
                        `}
                        style={{ animationDelay: '0.1s' }}
                      >
                        <div className={`
                          w-12 h-12 flex items-center justify-center
                          ${isSelected ? 'text-pink-500' : 'text-dreamy-slate-400'}
                        `}>
                          <Venus size={48} strokeWidth={1.5} />
                        </div>
                        <span className={`
                          text-lg font-bold font-heebo
                          ${isSelected ? 'text-pink-600' : 'text-dreamy-slate-700'}
                        `}>
                          בת
                        </span>
                      </button>
                    );
                  })()}

                  {/* Surprise Card - Full Width */}
                  {(() => {
                    const isSelected = selectedGender === null;
                    return (
                      <button
                        onClick={() => {
                          setSelectedGender(null);
                          setHasSelectedGender(true);
                        }}
                        className={`
                          col-span-2 rounded-2xl transition-all duration-300
                          flex items-center justify-center gap-4 py-5
                          press-effect animate-fade-up
                          ${isSelected 
                            ? 'ring-4 ring-yellow-200 bg-yellow-50/80 shadow-lg shadow-yellow-200/20' 
                            : 'bg-white/60 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-md hover:bg-white/80'
                          }
                        `}
                        style={{ animationDelay: '0.2s' }}
                      >
                        <div className={`
                          w-12 h-12 flex items-center justify-center
                          ${isSelected ? 'text-yellow-500' : 'text-dreamy-slate-400'}
                        `}>
                          <Gift size={48} strokeWidth={1.5} />
                        </div>
                        <span className={`
                          text-lg font-bold font-heebo
                          ${isSelected ? 'text-yellow-600' : 'text-dreamy-slate-700'}
                        `}>
                          הפתעה
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Spacer */}
              <div className="h-4" />
            </div>
          )}

          {/* Step 2: Style Preferences */}
          {currentStep === 2 && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-50 flex items-center justify-center shadow-lg shadow-emerald-100/50">
                  <Palette size={36} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 font-heebo mb-2">
                  איזה סגנון שמות?
                </h2>
                <p className="text-gray-400 text-sm max-w-[260px] mx-auto">
                  בחרו אחד או יותר, או דלגו לכל השמות
                </p>
              </div>

              {/* Grid - Centered */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
                  {NAME_STYLE_OPTIONS.map((option, index) => {
                    const Icon = option.icon;
                    const isSelected = selectedStyles.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => toggleStyle(option.value)}
                        className={`p-5 rounded-3xl transition-all text-right relative overflow-hidden press-effect animate-fade-up ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-200/50'
                            : 'glass-card hover:shadow-lg'
                        }`}
                        style={{ animationDelay: `${index * 0.08}s` }}
                      >
                        {isSelected && (
                          <div className="absolute top-3 left-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <Check size={14} />
                          </div>
                        )}
                        <Icon size={28} className={`mb-3 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                        <p className="font-bold text-base mb-0.5">{option.label}</p>
                        <p className={`text-xs leading-snug ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {selectedStyles.length === 0 && (
                  <p className="text-center text-sm text-gray-400 mt-6 animate-fade-in">
                    לא בחרתם? נציג את כל סגנונות השמות
                  </p>
                )}
              </div>

              {/* Spacer */}
              <div className="h-4" />
            </div>
          )}

          {/* Step 3: Exclusions */}
          {currentStep === 3 && (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-50 flex items-center justify-center shadow-lg shadow-slate-100/50">
                  <ListX size={36} className="text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 font-heebo mb-2">
                  שמות להחריג
                </h2>
                <p className="text-gray-400 text-sm max-w-[260px] mx-auto">
                  הוסיפו שמות שלא תרצו לראות (אופציונלי)
                </p>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-4 max-w-sm mx-auto w-full">
                {/* Protected Names Card */}
                <div className="glass-card rounded-3xl p-5 animate-fade-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                      <ShieldCheck size={22} className="text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">שמות מוגנים</h3>
                      <p className="text-xs text-gray-400">שמות של בני משפחה קיימים</p>
                    </div>
                  </div>
                  <PremiumTagInput
                    tags={protectedNames}
                    onAdd={(name) => setProtectedNames(prev => [...prev, name])}
                    onRemove={(name) => setProtectedNames(prev => prev.filter(n => n !== name))}
                    placeholder="למשל: סבתא שרה..."
                    variant="protected"
                  />
                </div>

                {/* Blacklist Card */}
                <div className="glass-card rounded-3xl p-5 animate-fade-up border-red-100/50" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl flex items-center justify-center">
                      <Trash2 size={22} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">רשימה שחורה</h3>
                      <p className="text-xs text-gray-400">שמות שמעדיפים להימנע מהם</p>
                    </div>
                  </div>
                  <PremiumTagInput
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

      {/* Fixed Bottom Navigation - Glassmorphism */}
      <div className="shrink-0 glass-solid safe-bottom">
        <div className="px-6 py-5">
          {/* Step 1: Show button only after selection, with fade-in animation */}
          {currentStep === 1 ? (
            hasSelectedGender ? (
              <div className="animate-fade-in">
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-gradient-to-r from-baby-pink-300 to-baby-blue-300 text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-pink-200/30 hover:shadow-xl hover:shadow-pink-200/40 transition-all press-effect"
                >
                  <span>המשך</span>
                  <ArrowLeft size={22} />
                </button>
              </div>
            ) : null
          ) : (
            <>
              <button
                onClick={handleNext}
                className="w-full py-4 bg-gradient-to-r from-baby-pink-300 to-baby-blue-300 text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-pink-200/30 hover:shadow-xl hover:shadow-pink-200/40 transition-all press-effect"
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
                  className="w-full mt-2 py-3 text-gray-400 font-medium text-sm hover:text-gray-600 transition-all"
                >
                  אעשה את זה אחר כך
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
