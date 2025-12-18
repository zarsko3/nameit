import React, { useState } from 'react';
import { UserProfile, Gender, NameStyle, BabyName, SwipeRecord } from '../types';
import { 
  User, 
  Baby, 
  Sparkles, 
  TrendingUp, 
  Crown, 
  Globe, 
  Star, 
  Heart,
  ChevronDown,
  ChevronUp,
  LogOut,
  Users,
  Link2,
  ShieldCheck,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  Settings as SettingsIcon
} from 'lucide-react';

interface SettingsProps {
  profile: UserProfile | null;
  isPartnerOnline: boolean;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
  swipes: SwipeRecord[];
  names: BabyName[];
}

// Name style options
const NAME_STYLE_OPTIONS = [
  { value: NameStyle.MODERN, label: 'מודרני', icon: Sparkles },
  { value: NameStyle.CLASSIC, label: 'קלאסי', icon: Crown },
  { value: NameStyle.INTERNATIONAL, label: 'בינלאומי', icon: Globe },
  { value: NameStyle.UNIQUE, label: 'ייחודי', icon: Star },
];

// Premium Tag Input
const PremiumTagInput: React.FC<{
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  emptyMessage: string;
  variant: 'protected' | 'blacklist';
}> = ({ tags, onAdd, onRemove, placeholder, emptyMessage, variant }) => {
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
          className={`flex-1 px-4 py-3 bg-white/60 rounded-xl border border-white/40 outline-none text-right font-medium placeholder:text-gray-300 transition-all focus:bg-white focus:ring-2 ${
            isBlacklist ? 'focus:ring-red-200' : 'focus:ring-slate-200'
          }`}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={`w-11 h-11 rounded-xl font-bold disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center ${
            isBlacklist 
              ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200/40' 
              : 'bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-200/40'
          }`}
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-300 italic">{emptyMessage}</p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/70 border border-white/50 shadow-sm ${
                isBlacklist ? 'text-red-700' : 'text-slate-700'
              }`}
            >
              {isBlacklist ? <AlertTriangle size={12} className="text-red-400" /> : <ShieldCheck size={12} className="text-slate-400" />}
              {tag}
              <button
                onClick={() => onRemove(tag)}
                className="w-5 h-5 rounded-full bg-white/60 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-all"
              >
                <X size={11} />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
};

// Premium Collapsible Section
const PremiumSection: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconGradient: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  delay?: number;
}> = ({ title, subtitle, icon, iconGradient, isOpen, onToggle, children, delay = 0 }) => (
  <div 
    className="glass-card rounded-3xl overflow-hidden animate-fade-up"
    style={{ animationDelay: `${delay}s` }}
  >
    <button 
      onClick={onToggle}
      className="w-full p-5 flex items-center justify-between hover:bg-white/30 transition-all press-effect"
    >
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br ${iconGradient} shadow-lg`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="font-bold text-base text-gray-800 font-heebo">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className={`shrink-0 ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
        <ChevronDown size={20} className="text-gray-400" />
      </div>
    </button>
    
    <div className={`transition-all duration-300 ease-out overflow-hidden ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="px-5 pb-5 pt-2 border-t border-white/30">
        {children}
      </div>
    </div>
  </div>
);

const Settings: React.FC<SettingsProps> = ({ 
  profile, 
  isPartnerOnline, 
  onUpdateProfile, 
  onLogout,
  swipes,
  names
}) => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showProtected, setShowProtected] = useState(false);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [showLikedNames, setShowLikedNames] = useState(false);

  if (!profile) return null;

  const likedNames = swipes
    .filter(s => s.liked && s.roomId === profile.roomId)
    .map(s => names.find(n => n.id === s.nameId))
    .filter((n): n is BabyName => n !== undefined);

  const toggleNameStyle = (style: NameStyle) => {
    const currentStyles = profile.nameStyles || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    onUpdateProfile({ nameStyles: newStyles });
  };

  const setExpectedGender = (gender: Gender | null) => {
    onUpdateProfile({ expectedGender: gender });
  };

  const toggleTrending = () => {
    onUpdateProfile({ showTrendingOnly: !profile.showTrendingOnly });
  };

  return (
    <div className="h-full flex flex-col mesh-gradient overflow-hidden" dir="rtl">
      {/* Scrollable Content */}
      <div className="flex-1 scroll-hidden">
        <div className="px-5 pt-6 pb-32 space-y-4 safe-top">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 animate-fade-up">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight font-heebo">הגדרות</h2>
            <div className="w-10 h-10 glass-card rounded-2xl flex items-center justify-center">
              <SettingsIcon size={18} className="text-gray-400" />
            </div>
          </div>
          
          {/* User Profile Card - Premium */}
          <div className="card-elevated p-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl shadow-emerald-200/40">
                {profile.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">משתמש</p>
                <p className="font-bold text-xl text-gray-800 font-heebo truncate">{profile.name}</p>
              </div>
            </div>
            
            {/* Room Code */}
            <div className="flex items-center justify-between p-3 bg-gray-50/80 rounded-2xl">
              <div className="flex items-center gap-2">
                <Link2 size={14} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">קוד חדר</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-emerald-500">{profile.roomId}</span>
                <div className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isPartnerOnline 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                  {isPartnerOnline ? 'מחובר' : 'ממתין'}
                </div>
              </div>
            </div>
          </div>

          {/* Liked Names */}
          <PremiumSection
            title="שמות שאהבנו"
            subtitle={`${likedNames.length} שמות`}
            icon={<Heart size={20} className="text-white" />}
            iconGradient="from-rose-400 to-pink-500 shadow-rose-200/40"
            isOpen={showLikedNames}
            onToggle={() => setShowLikedNames(!showLikedNames)}
            delay={0.1}
          >
            {likedNames.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">עדיין לא סימנתם שמות</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {likedNames.map((name) => (
                  <div
                    key={name.id}
                    className="px-3 py-1.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-xl flex items-center gap-1.5"
                  >
                    <Heart size={12} className="text-rose-400 fill-rose-400" />
                    <span className="font-bold text-sm text-gray-700">{name.hebrew}</span>
                  </div>
                ))}
              </div>
            )}
          </PremiumSection>

          {/* Baby Preferences */}
          <PremiumSection
            title="העדפות תינוק"
            subtitle="מגדר וסגנון שמות"
            icon={<Baby size={20} className="text-white" />}
            iconGradient="from-pink-400 to-rose-500 shadow-pink-200/40"
            isOpen={showPreferences}
            onToggle={() => setShowPreferences(!showPreferences)}
            delay={0.15}
          >
            <div className="space-y-5">
              {/* Gender Selection */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">מגדר צפוי</p>
                <div className="flex gap-2">
                  {[
                    { value: Gender.BOY, emoji: '👦', label: 'בן', color: 'blue' },
                    { value: Gender.GIRL, emoji: '👧', label: 'בת', color: 'pink' },
                    { value: null, emoji: '✨', label: 'הפתעה', color: 'purple' },
                  ].map((option) => {
                    const isSelected = profile.expectedGender === option.value;
                    const gradients = {
                      blue: 'from-blue-500 to-blue-600 shadow-blue-200/50',
                      pink: 'from-pink-500 to-rose-500 shadow-pink-200/50',
                      purple: 'from-purple-500 to-violet-500 shadow-purple-200/50',
                    };
                    return (
                      <button
                        key={option.label}
                        onClick={() => setExpectedGender(option.value)}
                        className={`flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-1.5 press-effect ${
                          isSelected
                            ? `bg-gradient-to-br ${gradients[option.color as keyof typeof gradients]} text-white shadow-lg`
                            : 'bg-white/60 text-gray-600 border border-white/50 hover:bg-white/80'
                        }`}
                      >
                        <span className="text-lg">{option.emoji}</span>
                        <span className="text-sm">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Styles */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">סגנון שמות</p>
                <div className="grid grid-cols-2 gap-2">
                  {NAME_STYLE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = (profile.nameStyles || []).includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => toggleNameStyle(option.value)}
                        className={`p-3 rounded-2xl transition-all flex items-center gap-2 press-effect ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/40'
                            : 'bg-white/60 text-gray-600 border border-white/50 hover:bg-white/80'
                        }`}
                      >
                        <Icon size={16} className={isSelected ? 'text-white' : 'text-emerald-400'} />
                        <span className="font-bold text-sm">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </PremiumSection>

          {/* Protected Names */}
          <PremiumSection
            title="שמות מוגנים"
            subtitle={`${(profile.protectedNames || []).length} שמות`}
            icon={<ShieldCheck size={20} className="text-white" />}
            iconGradient="from-slate-400 to-slate-500 shadow-slate-200/40"
            isOpen={showProtected}
            onToggle={() => setShowProtected(!showProtected)}
            delay={0.2}
          >
            <div className="bg-slate-50/80 rounded-xl p-2.5 mb-3 flex items-start gap-2">
              <ShieldCheck size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                שמות של בני משפחה שכבר "תפוסים"
              </p>
            </div>
            <PremiumTagInput
              tags={profile.protectedNames || []}
              onAdd={(name) => onUpdateProfile({ protectedNames: [...(profile.protectedNames || []), name] })}
              onRemove={(name) => onUpdateProfile({ protectedNames: (profile.protectedNames || []).filter(n => n !== name) })}
              placeholder="למשל: סבתא שרה..."
              emptyMessage="אין שמות מוגנים"
              variant="protected"
            />
          </PremiumSection>

          {/* Blacklist */}
          <PremiumSection
            title="רשימה שחורה"
            subtitle={`${(profile.blacklistedNames || []).length} שמות`}
            icon={<Trash2 size={20} className="text-white" />}
            iconGradient="from-red-400 to-rose-500 shadow-red-200/40"
            isOpen={showBlacklist}
            onToggle={() => setShowBlacklist(!showBlacklist)}
            delay={0.25}
          >
            <div className="bg-red-50/80 border border-red-100 rounded-xl p-2.5 mb-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-red-600 leading-relaxed">
                שמות שמעדיפים להימנע מהם
              </p>
            </div>
            <PremiumTagInput
              tags={profile.blacklistedNames || []}
              onAdd={(name) => onUpdateProfile({ blacklistedNames: [...(profile.blacklistedNames || []), name] })}
              onRemove={(name) => onUpdateProfile({ blacklistedNames: (profile.blacklistedNames || []).filter(n => n !== name) })}
              placeholder="הקלידו שם..."
              emptyMessage="אין שמות ברשימה"
              variant="blacklist"
            />
          </PremiumSection>

          {/* Trending Filter */}
          <PremiumSection
            title="מסננים נוספים"
            subtitle="שמות טרנדיים"
            icon={<TrendingUp size={20} className="text-white" />}
            iconGradient="from-orange-400 to-amber-500 shadow-orange-200/40"
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
            delay={0.3}
          >
            <div 
              onClick={toggleTrending}
              className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between press-effect ${
                profile.showTrendingOnly
                  ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-lg shadow-orange-200/40'
                  : 'bg-white/60 border border-white/50 hover:bg-white/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  profile.showTrendingOnly ? 'bg-white/20' : 'bg-orange-100'
                }`}>
                  <TrendingUp size={18} className={profile.showTrendingOnly ? 'text-white' : 'text-orange-500'} />
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${profile.showTrendingOnly ? 'text-white' : 'text-gray-800'}`}>
                    שמות טרנדיים בלבד
                  </p>
                  <p className={`text-[11px] ${profile.showTrendingOnly ? 'text-orange-100' : 'text-gray-400'}`}>
                    הצג רק שמות פופולריים
                  </p>
                </div>
              </div>
              <div 
                dir="ltr"
                className={`w-11 h-6 rounded-full p-0.5 transition-all flex items-center ${
                  profile.showTrendingOnly ? 'bg-white/30' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  profile.showTrendingOnly ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </div>
          </PremiumSection>

          {/* Partner Connection */}
          <div className="glass-card rounded-3xl p-5 animate-fade-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40">
                <Users size={18} className="text-white" />
              </div>
              <p className="font-bold text-gray-800 font-heebo">חיבור בן/בת זוג</p>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              שתפו את קוד החדר <span className="font-mono font-bold bg-white/60 px-2 py-0.5 rounded text-emerald-600">{profile.roomId}</span> כדי להחליק ביחד!
            </p>
          </div>

          {/* Logout */}
          <button 
            onClick={onLogout}
            className="w-full p-4 glass-card text-red-400 font-bold rounded-2xl hover:bg-red-50/50 transition-all press-effect flex items-center justify-center gap-2 animate-fade-up"
            style={{ animationDelay: '0.4s' }}
          >
            <LogOut size={18} />
            <span>יציאה מהחשבון</span>
          </button>
          
          {/* Version */}
          <p className="text-center text-[10px] text-gray-300 pt-2 animate-fade-up" style={{ animationDelay: '0.45s' }}>
            NameIT v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
