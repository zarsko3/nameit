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
  AlertTriangle
} from 'lucide-react';

interface SettingsProps {
  profile: UserProfile | null;
  isPartnerOnline: boolean;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
  swipes: SwipeRecord[];
  names: BabyName[];
}

// Name style options with Hebrew labels
const NAME_STYLE_OPTIONS = [
  { value: NameStyle.MODERN, label: 'מודרני', icon: Sparkles, description: 'שמות עכשוויים ורעננים' },
  { value: NameStyle.CLASSIC, label: 'קלאסי', icon: Crown, description: 'שמות מסורתיים ונצחיים' },
  { value: NameStyle.INTERNATIONAL, label: 'בינלאומי', icon: Globe, description: 'שמות שעובדים בכל שפה' },
  { value: NameStyle.UNIQUE, label: 'ייחודי', icon: Star, description: 'שמות נדירים ומיוחדים' },
];

// Styled Tag Input Component with variant support
const TagInput: React.FC<{
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  emptyMessage: string;
  variant: 'protected' | 'blacklist';
}> = ({ tags, onAdd, onRemove, placeholder, emptyMessage, variant }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  // Variant-specific styling
  const isBlacklist = variant === 'blacklist';
  const buttonBg = isBlacklist ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-500 hover:bg-slate-600';
  const tagBg = isBlacklist ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-700 border-slate-100';
  const tagHover = isBlacklist ? 'hover:bg-red-100' : 'hover:bg-slate-100';
  const removeHover = isBlacklist ? 'group-hover:bg-red-200 group-hover:text-red-600' : 'group-hover:bg-slate-200 group-hover:text-slate-600';
  const inputRing = isBlacklist ? 'focus:ring-red-100' : 'focus:ring-slate-100';

  return (
    <div className="space-y-3">
      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 p-3.5 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 ${inputRing} outline-none text-right font-medium placeholder:text-gray-300 transition-all`}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={`px-4 ${buttonBg} text-white rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95`}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Tags display */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-300 italic">{emptyMessage}</p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${tagBg} border rounded-full text-sm font-medium group ${tagHover} transition-colors`}
            >
              {isBlacklist && <AlertTriangle size={12} className="text-red-400" />}
              {!isBlacklist && <ShieldCheck size={12} className="text-slate-400" />}
              {tag}
              <button
                onClick={() => onRemove(tag)}
                className={`w-5 h-5 rounded-full bg-white/60 ${removeHover} flex items-center justify-center transition-colors`}
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
};

// Collapsible Section Component
const Section: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  isOpen: boolean;
  onToggle: () => void;
  borderColor?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, iconBg, isOpen, onToggle, borderColor = 'border-gray-100', children }) => (
  <div className={`bg-white rounded-3xl border ${borderColor} shadow-sm overflow-hidden`}>
    <button 
      onClick={onToggle}
      className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-800 font-heebo">{title}</p>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="shrink-0 ml-2">
        {isOpen ? <ChevronUp size={22} className="text-gray-400" /> : <ChevronDown size={22} className="text-gray-400" />}
      </div>
    </button>
    
    {isOpen && (
      <div className="px-5 pb-5 border-t border-gray-50 pt-4">
        {children}
      </div>
    )}
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

  // Get liked names from swipes
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

  // Protected Names handlers
  const addProtectedName = (name: string) => {
    const current = profile.protectedNames || [];
    if (!current.includes(name)) {
      onUpdateProfile({ protectedNames: [...current, name] });
    }
  };

  const removeProtectedName = (name: string) => {
    const current = profile.protectedNames || [];
    onUpdateProfile({ protectedNames: current.filter(n => n !== name) });
  };

  // Blacklist handlers
  const addToBlacklist = (name: string) => {
    const current = profile.blacklistedNames || [];
    if (!current.includes(name)) {
      onUpdateProfile({ blacklistedNames: [...current, name] });
    }
  };

  const removeFromBlacklist = (name: string) => {
    const current = profile.blacklistedNames || [];
    onUpdateProfile({ blacklistedNames: current.filter(n => n !== name) });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white via-gray-50/30 to-gray-100" dir="rtl">
      {/* Scrollable Content with Safe Areas */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="px-5 pt-6 pb-8 space-y-5 safe-top">
          {/* Header */}
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight font-heebo px-1">הגדרות</h2>
          
          {/* User Profile Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
                {profile.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">משתמש</p>
                <p className="font-bold text-xl text-gray-800 font-heebo truncate">{profile.name}</p>
              </div>
              <User size={22} className="text-gray-300 shrink-0" />
            </div>
            
            {/* Room Code */}
            <div className="px-5 pb-5 pt-3 border-t border-gray-50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <Link2 size={16} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">קוד חדר</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-base font-bold text-emerald-500 truncate">{profile.roomId}</span>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 shrink-0 ${
                    isPartnerOnline 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                    {isPartnerOnline ? 'מחובר' : 'ממתין'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shared Liked Names Section */}
          <Section
            title="שמות שאהבנו"
            subtitle={`${likedNames.length} שמות שסומנו בלייק`}
            icon={<Heart size={22} className="text-rose-400" />}
            iconBg="bg-rose-50"
            isOpen={showLikedNames}
            onToggle={() => setShowLikedNames(!showLikedNames)}
          >
            {likedNames.length === 0 ? (
              <p className="text-center text-gray-400 py-6">עדיין לא סימנתם שמות שאהבתם</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {likedNames.map((name) => (
                  <div
                    key={name.id}
                    className="px-3.5 py-2 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-xl flex items-center gap-2"
                  >
                    <Heart size={14} className="text-rose-400 fill-rose-400 shrink-0" />
                    <span className="font-bold text-gray-700">{name.hebrew}</span>
                    <span className="text-xs text-gray-400">({name.transliteration})</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4 text-center">
              רשימה זו משותפת לכל המשתמשים בחדר
            </p>
          </Section>

          {/* Baby Preferences Section */}
          <Section
            title="העדפות תינוק"
            subtitle="מגדר צפוי וסגנון שמות"
            icon={<Baby size={22} className="text-pink-400" />}
            iconBg="bg-pink-50"
            isOpen={showPreferences}
            onToggle={() => setShowPreferences(!showPreferences)}
          >
            <div className="space-y-6">
              {/* Expected Gender Selection */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">מגדר התינוק הצפוי</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpectedGender(Gender.BOY)}
                    className={`flex-1 py-3.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                      profile.expectedGender === Gender.BOY
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-200/50'
                        : 'bg-blue-50 text-blue-500 border border-blue-100 hover:bg-blue-100'
                    }`}
                  >
                    <span className="text-lg">👦</span>
                    <span>בן</span>
                  </button>
                  <button
                    onClick={() => setExpectedGender(Gender.GIRL)}
                    className={`flex-1 py-3.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                      profile.expectedGender === Gender.GIRL
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-200/50'
                        : 'bg-pink-50 text-pink-500 border border-pink-100 hover:bg-pink-100'
                    }`}
                  >
                    <span className="text-lg">👧</span>
                    <span>בת</span>
                  </button>
                  <button
                    onClick={() => setExpectedGender(null)}
                    className={`flex-1 py-3.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                      profile.expectedGender === null
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-200/50'
                        : 'bg-purple-50 text-purple-500 border border-purple-100 hover:bg-purple-100'
                    }`}
                  >
                    <span className="text-lg">✨</span>
                    <span>הפתעה</span>
                  </button>
                </div>
              </div>

              {/* Name Style Selection */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">סגנון שמות מועדף</p>
                <div className="grid grid-cols-2 gap-2">
                  {NAME_STYLE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = (profile.nameStyles || []).includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => toggleNameStyle(option.value)}
                        className={`p-3.5 rounded-xl transition-all text-right ${
                          isSelected
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50'
                            : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={16} className={isSelected ? 'text-white' : 'text-emerald-400'} />
                          <span className="font-bold text-sm">{option.label}</span>
                        </div>
                        <p className={`text-xs ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Section>

          {/* Protected Names Section */}
          <Section
            title="שמות מוגנים"
            subtitle={`${(profile.protectedNames || []).length} שמות של בני משפחה`}
            icon={<ShieldCheck size={22} className="text-slate-500" />}
            iconBg="bg-slate-100"
            isOpen={showProtected}
            onToggle={() => setShowProtected(!showProtected)}
            borderColor="border-slate-100"
          >
            {/* Info banner */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-start gap-2">
              <ShieldCheck size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                שמות של בני משפחה אהובים שכבר "תפוסים". אנו מכבדים אותם, אך לא נציג אותם בהחלקות.
              </p>
            </div>
            
            <TagInput
              tags={profile.protectedNames || []}
              onAdd={addProtectedName}
              onRemove={removeProtectedName}
              placeholder="למשל: סבתא שרה, דוד משה..."
              emptyMessage="אין שמות מוגנים עדיין"
              variant="protected"
            />
          </Section>

          {/* Blacklist Section */}
          <Section
            title="רשימה שחורה"
            subtitle={`${(profile.blacklistedNames || []).length} שמות חסומים`}
            icon={<Trash2 size={22} className="text-red-400" />}
            iconBg="bg-red-50"
            isOpen={showBlacklist}
            onToggle={() => setShowBlacklist(!showBlacklist)}
            borderColor="border-red-100"
          >
            {/* Warning banner */}
            <div className="bg-red-50 rounded-xl p-3 mb-4 flex items-start gap-2 border border-red-100">
              <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600 leading-relaxed">
                שמות שמעדיפים להימנע מהם מסיבות אישיות. שמות אלו לעולם לא יופיעו בהחלקות.
              </p>
            </div>
            
            <TagInput
              tags={profile.blacklistedNames || []}
              onAdd={addToBlacklist}
              onRemove={removeFromBlacklist}
              placeholder="הקלידו שם להוספה..."
              emptyMessage="אין שמות ברשימה השחורה"
              variant="blacklist"
            />
          </Section>

          {/* Trending Filter Section */}
          <Section
            title="מסננים נוספים"
            subtitle="שמות טרנדיים ופופולריים"
            icon={<TrendingUp size={22} className="text-orange-400" />}
            iconBg="bg-orange-50"
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          >
            {/* Trending Toggle */}
            <div 
              onClick={toggleTrending}
              className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                profile.showTrendingOnly
                  ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-lg'
                  : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  profile.showTrendingOnly ? 'bg-white/20' : 'bg-orange-100'
                }`}>
                  <TrendingUp size={20} className={profile.showTrendingOnly ? 'text-white' : 'text-orange-500'} />
                </div>
                <div className="text-right">
                  <p className={`font-bold ${profile.showTrendingOnly ? 'text-white' : 'text-gray-800'}`}>
                    שמות טרנדיים בלבד
                  </p>
                  <p className={`text-sm ${profile.showTrendingOnly ? 'text-orange-100' : 'text-gray-400'}`}>
                    הצג רק שמות פופולריים עכשיו
                  </p>
                </div>
              </div>
              <div 
                dir="ltr"
                className={`w-12 h-7 rounded-full p-1 transition-all flex items-center shrink-0 ${
                  profile.showTrendingOnly ? 'bg-white/30' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  profile.showTrendingOnly ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </div>
            
            {/* Info text */}
            <p className="text-xs text-gray-400 mt-4 text-center">
              הפעלת הסינון תציג רק שמות שנמצאים בטרנד השנה
            </p>
          </Section>

          {/* Partner Connection Info */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <Users size={20} className="text-emerald-500" />
              <p className="font-bold text-emerald-700 font-heebo">חיבור בן/בת זוג</p>
            </div>
            <p className="text-sm text-emerald-600 leading-relaxed">
              שתפו את קוד החדר <span className="font-mono font-bold bg-white px-2 py-0.5 rounded">{profile.roomId}</span> עם בן/בת הזוג כדי להחליק על שמות ביחד ולמצוא התאמות!
            </p>
          </div>

          {/* Logout Button */}
          <button 
            onClick={onLogout}
            className="w-full p-4 bg-white border border-red-100 text-red-400 font-bold rounded-2xl hover:bg-red-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            <span>יציאה מהחשבון</span>
          </button>
          
          {/* Version with extra bottom padding for safe area */}
          <p className="text-center text-xs text-gray-300 pt-2 pb-8 safe-bottom">
            NameIT v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
