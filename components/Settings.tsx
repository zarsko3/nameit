import React, { useState } from 'react';
import { UserProfile, Gender, NameStyle } from '../types';
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
  Link2
} from 'lucide-react';

interface SettingsProps {
  profile: UserProfile | null;
  isPartnerOnline: boolean;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
}

// Name style options with Hebrew labels
const NAME_STYLE_OPTIONS = [
  { value: NameStyle.MODERN, label: 'מודרני', icon: Sparkles, description: 'שמות עכשוויים ורעננים' },
  { value: NameStyle.CLASSIC, label: 'קלאסי', icon: Crown, description: 'שמות מסורתיים ונצחיים' },
  { value: NameStyle.INTERNATIONAL, label: 'בינלאומי', icon: Globe, description: 'שמות שעובדים בכל שפה' },
  { value: NameStyle.UNIQUE, label: 'ייחודי', icon: Star, description: 'שמות נדירים ומיוחדים' },
];

const Settings: React.FC<SettingsProps> = ({ 
  profile, 
  isPartnerOnline, 
  onUpdateProfile, 
  onLogout 
}) => {
  const [showPreferences, setShowPreferences] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  if (!profile) return null;

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
    <div className="p-6 space-y-6 animate-fade-in overflow-y-auto" dir="rtl">
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-800 tracking-tight font-heebo">הגדרות</h2>
      
      {/* User Profile Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {profile.name?.[0]}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">משתמש</p>
            <p className="font-bold text-2xl text-gray-800 font-heebo">{profile.name}</p>
          </div>
          <User size={24} className="text-gray-300" />
        </div>
        
        {/* Room Code */}
        <div className="px-6 pb-6 pt-2 border-t border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">קוד חדר</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-emerald-500">{profile.roomId}</span>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                isPartnerOnline 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isPartnerOnline ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                {isPartnerOnline ? 'מחובר' : 'ממתין'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Baby Preferences Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <button 
          onClick={() => setShowPreferences(!showPreferences)}
          className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
              <Baby size={22} className="text-pink-400" />
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-gray-800 font-heebo">העדפות תינוק</p>
              <p className="text-sm text-gray-400">מגדר צפוי וסגנון שמות</p>
            </div>
          </div>
          {showPreferences ? <ChevronUp size={22} className="text-gray-400" /> : <ChevronDown size={22} className="text-gray-400" />}
        </button>
        
        {showPreferences && (
          <div className="px-5 pb-5 space-y-5 border-t border-gray-50 pt-4">
            {/* Expected Gender Selection */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">מגדר התינוק הצפוי</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpectedGender(Gender.BOY)}
                  className={`flex-1 py-4 px-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    profile.expectedGender === Gender.BOY
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                      : 'bg-blue-50 text-blue-400 border border-blue-100 hover:bg-blue-100'
                  }`}
                >
                  <span className="text-xl">👦</span>
                  <span>בן</span>
                </button>
                <button
                  onClick={() => setExpectedGender(Gender.GIRL)}
                  className={`flex-1 py-4 px-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    profile.expectedGender === Gender.GIRL
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-200'
                      : 'bg-pink-50 text-pink-400 border border-pink-100 hover:bg-pink-100'
                  }`}
                >
                  <span className="text-xl">👧</span>
                  <span>בת</span>
                </button>
                <button
                  onClick={() => setExpectedGender(null)}
                  className={`flex-1 py-4 px-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    profile.expectedGender === null
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-200'
                      : 'bg-purple-50 text-purple-400 border border-purple-100 hover:bg-purple-100'
                  }`}
                >
                  <span className="text-xl">✨</span>
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
                      className={`p-4 rounded-2xl transition-all text-right ${
                        isSelected
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={18} className={isSelected ? 'text-white' : 'text-emerald-400'} />
                        <span className="font-bold">{option.label}</span>
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
        )}
      </div>

      {/* Trending Filter Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={22} className="text-orange-400" />
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-gray-800 font-heebo">מסננים נוספים</p>
              <p className="text-sm text-gray-400">שמות טרנדיים ופופולריים</p>
            </div>
          </div>
          {showFilters ? <ChevronUp size={22} className="text-gray-400" /> : <ChevronDown size={22} className="text-gray-400" />}
        </button>
        
        {showFilters && (
          <div className="px-5 pb-5 border-t border-gray-50 pt-4">
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  profile.showTrendingOnly ? 'bg-white/20' : 'bg-orange-100'
                }`}>
                  <TrendingUp size={22} className={profile.showTrendingOnly ? 'text-white' : 'text-orange-500'} />
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
                className={`w-14 h-8 rounded-full p-1 transition-all flex items-center ${
                  profile.showTrendingOnly ? 'bg-white/30' : 'bg-gray-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  profile.showTrendingOnly ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </div>
            </div>
            
            {/* Info text */}
            <p className="text-xs text-gray-400 mt-3 text-center">
              הפעלת הסינון תציג רק שמות שנמצאים בטרנד השנה
            </p>
          </div>
        )}
      </div>

      {/* Partner Connection Info */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-100">
        <div className="flex items-center gap-3 mb-3">
          <Users size={22} className="text-emerald-500" />
          <p className="font-bold text-emerald-700 font-heebo">חיבור בן/בת זוג</p>
        </div>
        <p className="text-sm text-emerald-600 leading-relaxed">
          שתפו את קוד החדר <span className="font-mono font-bold bg-white px-2 py-0.5 rounded">{profile.roomId}</span> עם בן/בת הזוג כדי להחליק על שמות ביחד ולמצוא התאמות!
        </p>
      </div>

      {/* Logout Button */}
      <button 
        onClick={onLogout}
        className="w-full p-5 bg-white border border-red-100 text-red-400 font-bold rounded-2xl hover:bg-red-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <LogOut size={20} />
        <span>יציאה מהחשבון</span>
      </button>
      
      {/* Version */}
      <p className="text-center text-xs text-gray-300 pb-4">
        NameIT v1.0.0
      </p>
    </div>
  );
};

export default Settings;

