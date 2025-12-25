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
  Settings as SettingsIcon,
  Database,
  Upload,
  Terminal,
  Leaf
} from 'lucide-react';
import { uploadExistingNames, countNamesInFirestore, syncNamesToFirestore } from '../services/migrationService';

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Admin user IDs - only these users can see the Sync Names button
const ADMIN_IDS: string[] = [
  // TODO: Add your user ID here after checking console log
  // 'your-user-id-here'
];

interface SettingsProps {
  profile: UserProfile | null;
  isPartnerOnline: boolean;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
  onResetProgress: () => Promise<void>;
  swipes: SwipeRecord[];
  names: BabyName[];
  currentUserId: string | undefined;
}

// Name style options
const NAME_STYLE_OPTIONS = [
  { value: NameStyle.MODERN, label: 'מודרני', icon: Sparkles },
  { value: NameStyle.CLASSIC, label: 'קלאסי', icon: Crown },
  { value: NameStyle.INTERNATIONAL, label: 'בינלאומי', icon: Globe },
  { value: NameStyle.UNIQUE, label: 'ייחודי', icon: Star },
  { value: NameStyle.NATURE, label: 'טבע', icon: Leaf },
];

// Premium Tag Input - Dreamy pastel style
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
          className={`flex-1 px-4 py-3 bg-white/60 rounded-full border border-white/50 outline-none text-right font-medium text-dreamy-slate-700 placeholder:text-dreamy-slate-400/60 transition-all focus:bg-white/80 focus:ring-2 ${
            isBlacklist ? 'focus:ring-baby-pink-200' : 'focus:ring-baby-blue-200'
          }`}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={`w-11 h-11 rounded-full font-bold disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center ${
            isBlacklist 
              ? 'bg-gradient-to-br from-baby-pink-300 to-baby-pink-400 text-white shadow-soft-pink' 
              : 'bg-gradient-to-br from-baby-blue-200 to-baby-blue-300 text-dreamy-slate-700 shadow-soft-blue'
          }`}
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {tags.length === 0 ? (
          <p className="text-sm text-dreamy-slate-400 italic">{emptyMessage}</p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/70 border border-white/50 shadow-sm ${
                isBlacklist ? 'text-baby-pink-500' : 'text-baby-blue-500'
              }`}
            >
              {isBlacklist ? <AlertTriangle size={12} className="text-baby-pink-400" /> : <ShieldCheck size={12} className="text-baby-blue-400" />}
              {tag}
              <button
                onClick={() => onRemove(tag)}
                className="w-5 h-5 rounded-full bg-white/60 hover:bg-baby-pink-100 hover:text-baby-pink-500 flex items-center justify-center transition-all"
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

// Premium Collapsible Section - Dreamy pastel style
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
      className="w-full p-5 flex items-center justify-between hover:bg-white/40 transition-all press-effect"
    >
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br ${iconGradient}`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="font-bold text-base text-dreamy-slate-700 font-heebo">{title}</p>
          <p className="text-xs text-dreamy-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className={`shrink-0 ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
        <ChevronDown size={20} className="text-dreamy-slate-400" />
      </div>
    </button>
    
    <div className={`transition-all duration-300 ease-out overflow-hidden ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="px-5 pb-5 pt-2 border-t border-white/40">
        {children}
      </div>
    </div>
  </div>
);

// Dev Admin Panel - Only shows in development mode
const DevAdminPanel: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<{ uploaded: number; errors: number; skipped?: number } | null>(null);
  const [firestoreCount, setFirestoreCount] = useState<number | null>(null);

  const handleCheckCount = async () => {
    const count = await countNamesInFirestore();
    setFirestoreCount(count);
    console.log(`📊 Names in Firestore: ${count}`);
  };

  const handleUploadNames = async () => {
    if (isUploading) return;
    
    const confirmed = window.confirm(
      '⚠️ This will upload all 306 names to Firestore.\n\n' +
      'Existing names with the same ID will be overwritten.\n\n' +
      'Continue?'
    );
    
    if (!confirmed) return;
    
    setIsUploading(true);
    setResult(null);
    
    try {
      const uploadResult = await uploadExistingNames();
      setResult({
        uploaded: uploadResult.uploaded,
        errors: uploadResult.errors.length
      });
      
      // Refresh count
      const count = await countNamesInFirestore();
      setFirestoreCount(count);
      
    } catch (error) {
      console.error('Migration failed:', error);
      setResult({ uploaded: 0, errors: 1 });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSyncNames = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setResult(null);
    
    try {
      const syncResult = await syncNamesToFirestore();
      setResult({
        uploaded: syncResult.uploaded,
        skipped: syncResult.skipped,
        errors: syncResult.errors.length
      });
      
      // Show alert
      if (syncResult.uploaded > 0) {
        alert(`✅ הועלו ${syncResult.uploaded} שמות חדשים למסד הנתונים!`);
      } else {
        alert('✅ כל השמות כבר קיימים במסד הנתונים.');
      }
      
      // Refresh count
      const count = await countNamesInFirestore();
      setFirestoreCount(count);
      
    } catch (error) {
      console.error('Sync failed:', error);
      setResult({ uploaded: 0, errors: 1 });
      alert('❌ שגיאה בסנכרון. בדקו את הקונסול.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-5 border-2 border-dashed border-baby-yellow-200/50 animate-fade-up" style={{ animationDelay: '0.38s' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-baby-yellow-100 to-baby-yellow-200 rounded-full flex items-center justify-center shadow-lg">
          <Terminal size={18} className="text-dreamy-slate-600" />
        </div>
        <div>
          <p className="font-bold text-dreamy-slate-600 font-heebo">Dev Admin Panel</p>
          <p className="text-[10px] text-dreamy-slate-400">localhost only</p>
        </div>
      </div>
      
      {/* Database Stats */}
      <div className="bg-white/60 rounded-full p-3 px-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-baby-blue-400" />
          <span className="text-sm text-dreamy-slate-600">Names in Firestore:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-dreamy-slate-700">
            {firestoreCount !== null ? firestoreCount : '—'}
          </span>
          <button
            onClick={handleCheckCount}
            className="text-xs bg-white/60 hover:bg-white/80 px-2 py-1 rounded-full text-dreamy-slate-500 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Sync Names Button - Only uploads missing names */}
      <button
        onClick={handleSyncNames}
        disabled={isSyncing || isUploading}
        className="w-full py-3 bg-gradient-to-r from-baby-blue-200 to-baby-blue-300 text-white font-bold rounded-full flex items-center justify-center gap-2 hover:from-baby-blue-300 hover:to-baby-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft-blue mb-2"
      >
        {isSyncing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>מסנכרן...</span>
          </>
        ) : (
          <>
            <Database size={18} />
            <span>סנכרן שמות למסד הנתונים</span>
          </>
        )}
      </button>

      {/* Upload Button - Overwrites all */}
      <button
        onClick={handleUploadNames}
        disabled={isUploading || isSyncing}
        className="w-full py-3 bg-gradient-to-r from-baby-yellow-100 to-baby-yellow-200 text-dreamy-slate-700 font-bold rounded-full flex items-center justify-center gap-2 hover:from-baby-yellow-200 hover:to-baby-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
      >
        {isUploading ? (
          <>
            <div className="w-5 h-5 border-2 border-dreamy-slate-300 border-t-dreamy-slate-600 rounded-full animate-spin" />
            <span>מעלה...</span>
          </>
        ) : (
          <>
            <Upload size={18} />
            <span>העלה כל השמות (דורס קיימים)</span>
          </>
        )}
      </button>
      
      {/* Result */}
      {result && (
        <div className={`mt-3 p-3 rounded-full text-sm ${
          result.errors === 0 
            ? 'bg-baby-mint-100 text-dreamy-slate-700' 
            : 'bg-baby-pink-100 text-dreamy-slate-700'
        }`}>
          {result.errors === 0 ? (
            <>
              ✅ הועלו {result.uploaded} שמות
              {result.skipped !== undefined && result.skipped > 0 && ` (${result.skipped} כבר קיימים)`}
            </>
          ) : (
            <>❌ שגיאה עם {result.errors} שמות. בדקו את הקונסול.</>
          )}
        </div>
      )}
      
      <p className="text-[10px] text-dreamy-slate-400/70 text-center mt-3">
        This panel is only visible in development mode
      </p>
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ 
  profile, 
  isPartnerOnline, 
  onUpdateProfile, 
  onLogout,
  onResetProgress,
  swipes,
  names,
  currentUserId
}) => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [showProtected, setShowProtected] = useState(false);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ uploaded: number; skipped?: number } | null>(null);

  if (!profile) return null;

  // Log current user ID for admin setup (remove after adding to ADMIN_IDS)
  if (currentUserId) {
    console.log('🔑 Current User ID (copy this to ADMIN_IDS):', currentUserId);
  }

  // Check if current user is admin
  const isAdmin = currentUserId ? ADMIN_IDS.includes(currentUserId) : false;

  // Count only current user's swipes
  const mySwipeCount = currentUserId 
    ? swipes.filter(s => s.userId === currentUserId).length 
    : 0;

  const handleResetProgress = async () => {
    const confirmed = window.confirm(
      `⚠️ אפס את ההתקדמות שלי\n\n` +
      `פעולה זו תמחק את כל ${mySwipeCount} ההחלקות שלך ותאפשר לך להתחיל מחדש.\n\n` +
      `ההחלקות של בן/בת הזוג לא יימחקו.\n\n` +
      `להמשיך?`
    );
    
    if (!confirmed) return;
    
    setIsResetting(true);
    try {
      await onResetProgress();
      // Force reload to reset all state
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset progress:', error);
      alert('שגיאה באיפוס ההתקדמות. נסו שוב.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSyncNames = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await syncNamesToFirestore();
      setSyncResult({
        uploaded: result.uploaded,
        skipped: result.skipped
      });
      
      if (result.uploaded > 0) {
        alert(`✅ הועלו ${result.uploaded} שמות חדשים למסד הנתונים!`);
      } else {
        alert('✅ כל השמות כבר קיימים במסד הנתונים.');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('❌ שגיאה בסנכרון. בדקו את הקונסול.');
    } finally {
      setIsSyncing(false);
    }
  };

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
    <div className="h-full w-full flex flex-col" dir="rtl">
      {/* Scrollable Content - Header is fixed, content scrolls below it */}
      <div 
        className="flex-1 overflow-y-auto overscroll-none"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="px-5 pt-6 pb-24 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 animate-fade-up">
            <h2 className="text-2xl font-bold text-dreamy-slate-700 tracking-tight font-heebo">הגדרות</h2>
            <div className="w-10 h-10 glass-card rounded-full flex items-center justify-center">
              <SettingsIcon size={18} className="text-baby-pink-400" />
            </div>
          </div>
          
          {/* User Profile Card - Glassmorphism */}
          <div className="glass-card-strong rounded-3xl p-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-baby-pink-300 to-baby-lavender-200 rounded-2xl flex items-center justify-center text-dreamy-slate-700 text-xl font-bold shadow-soft-pink">
                {profile.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-dreamy-slate-400 uppercase tracking-wider mb-0.5">משתמש</p>
                <p className="font-bold text-xl text-dreamy-slate-700 font-heebo truncate">{profile.name}</p>
              </div>
            </div>
            
            {/* Room Code */}
            <div className="flex items-center justify-between p-3 bg-white/50 rounded-full">
              <div className="flex items-center gap-2">
                <Link2 size={14} className="text-baby-blue-400" />
                <span className="text-[10px] font-bold text-dreamy-slate-400 uppercase tracking-wider">קוד חדר</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-baby-blue-500">{profile.roomId}</span>
                <div className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isPartnerOnline 
                    ? 'bg-baby-mint-100 text-baby-mint-400' 
                    : 'bg-baby-yellow-100 text-dreamy-slate-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? 'bg-baby-mint-400' : 'bg-baby-yellow-200'} animate-pulse`}></div>
                  {isPartnerOnline ? 'מחובר' : 'ממתין'}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <PremiumSection
            title="העדפות"
            subtitle="מגדר, סגנון וטרנדים"
            icon={<Baby size={20} className="text-white" />}
            iconGradient="from-baby-lavender-200 to-baby-lavender-300 shadow-lg"
            isOpen={showPreferences}
            onToggle={() => setShowPreferences(!showPreferences)}
            delay={0.15}
          >
            <div className="space-y-6">
              {/* Gender Selection */}
              <div>
                <p className="text-[10px] font-bold text-dreamy-slate-400 uppercase tracking-wider mb-3">מגדר צפוי</p>
                <div className="flex gap-2">
                  {[
                    { value: Gender.BOY, emoji: '👦', label: 'בן', color: 'blue' },
                    { value: Gender.GIRL, emoji: '👧', label: 'בת', color: 'pink' },
                    { value: null, emoji: '✨', label: 'הפתעה', color: 'purple' },
                  ].map((option) => {
                    const isSelected = profile.expectedGender === option.value;
                    const gradients = {
                      blue: 'from-baby-blue-200 to-baby-blue-300 shadow-soft-blue',
                      pink: 'from-baby-pink-200 to-baby-pink-300 shadow-soft-pink',
                      purple: 'from-baby-lavender-200 to-baby-lavender-300 shadow-lg',
                    };
                    return (
                      <button
                        key={option.label}
                        onClick={() => setExpectedGender(option.value)}
                        className={`flex-1 py-3 rounded-full font-bold transition-all flex items-center justify-center gap-1.5 press-effect ${
                          isSelected
                            ? `bg-gradient-to-br ${gradients[option.color as keyof typeof gradients]} text-dreamy-slate-700`
                            : 'bg-white/60 text-dreamy-slate-500 border border-white/50 hover:bg-white/80'
                        }`}
                      >
                        <span className="text-lg">{option.emoji}</span>
                        <span className="text-sm">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Styles - Chip/Tag Layout */}
              <div>
                <p className="text-[10px] font-bold text-dreamy-slate-400 uppercase tracking-wider mb-3">סגנון שם</p>
                <div className="flex flex-wrap gap-2">
                  {NAME_STYLE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = (profile.nameStyles || []).includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => toggleNameStyle(option.value)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all press-effect ${
                          isSelected
                            ? 'bg-gradient-to-br from-baby-mint-200 to-baby-mint-300 text-dreamy-slate-700 shadow-soft-mint border-2 border-baby-mint-300'
                            : 'bg-white/60 text-dreamy-slate-500 border-2 border-white/50 hover:bg-white/80 hover:border-white/70'
                        }`}
                      >
                        <Icon size={16} className={isSelected ? 'text-baby-mint-500' : 'text-dreamy-slate-400'} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                {profile.nameStyles && profile.nameStyles.length > 0 && (
                  <p className="text-xs text-dreamy-slate-400 mt-2 text-right">
                    נבחרו {profile.nameStyles.length} סגנונות
                  </p>
                )}
              </div>

              {/* Trending Toggle */}
              <div>
                <p className="text-[10px] font-bold text-dreamy-slate-400 uppercase tracking-wider mb-3">טרנדים</p>
                <div
                  onClick={toggleTrending}
                  className={`p-4 rounded-full cursor-pointer transition-all flex items-center justify-between press-effect ${
                    profile.showTrendingOnly
                      ? 'bg-gradient-to-r from-baby-yellow-100 to-baby-yellow-200 text-dreamy-slate-700 shadow-lg border-2 border-baby-yellow-200'
                      : 'bg-white/60 border-2 border-white/50 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      profile.showTrendingOnly ? 'bg-white/40' : 'bg-baby-yellow-100'
                    }`}>
                      <TrendingUp size={18} className={profile.showTrendingOnly ? 'text-dreamy-slate-600' : 'text-baby-yellow-300'} />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-dreamy-slate-700">
                        רק שמות טרנדיים
                      </p>
                      <p className="text-[11px] text-dreamy-slate-400">
                        הצג רק שמות פופולריים
                      </p>
                    </div>
                  </div>
                  <div
                    dir="ltr"
                    className={`w-11 h-6 rounded-full p-0.5 transition-all flex items-center ${
                      profile.showTrendingOnly ? 'bg-white/50' : 'bg-white/40'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      profile.showTrendingOnly ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>
          </PremiumSection>

          {/* Protected Names */}
          <PremiumSection
            title="שמות מוגנים"
            subtitle={`${(profile.protectedNames || []).length} שמות`}
            icon={<ShieldCheck size={20} className="text-white" />}
            iconGradient="from-baby-blue-200 to-baby-blue-300 shadow-soft-blue"
            isOpen={showProtected}
            onToggle={() => setShowProtected(!showProtected)}
            delay={0.2}
          >
            <div className="bg-baby-blue-50/80 rounded-full p-2.5 px-4 mb-3 flex items-start gap-2">
              <ShieldCheck size={14} className="text-baby-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-dreamy-slate-500 leading-relaxed">
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
            iconGradient="from-baby-pink-300 to-baby-pink-400 shadow-soft-pink"
            isOpen={showBlacklist}
            onToggle={() => setShowBlacklist(!showBlacklist)}
            delay={0.25}
          >
            <div className="bg-baby-pink-50/80 border border-baby-pink-200 rounded-full p-2.5 px-4 mb-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-baby-pink-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-dreamy-slate-500 leading-relaxed">
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

          {/* Partner Connection */}
          <div className="glass-card rounded-3xl p-5 animate-fade-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-baby-mint-200 to-baby-mint-300 rounded-full flex items-center justify-center shadow-soft-mint">
                <Users size={18} className="text-white" />
              </div>
              <p className="font-bold text-dreamy-slate-700 font-heebo">חיבור בן/בת זוג</p>
            </div>
            <p className="text-sm text-dreamy-slate-500 leading-relaxed">
              שתפו את קוד החדר <span className="font-mono font-bold bg-white/60 px-2 py-0.5 rounded-full text-baby-blue-500">{profile.roomId}</span> כדי להחליק ביחד!
            </p>
          </div>

          {/* Sync Names Button - Admin only */}
          {isAdmin && (
            <div className="glass-card rounded-3xl p-5 animate-fade-up" style={{ animationDelay: '0.36s' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-baby-blue-200 to-baby-blue-300 rounded-full flex items-center justify-center shadow-soft-blue">
                  <Database size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-dreamy-slate-700 font-heebo">סנכרון שמות (מנהל)</p>
                  <p className="text-[10px] text-dreamy-slate-400">העלה שמות חסרים למסד הנתונים</p>
                </div>
              </div>
              
              <button
                onClick={handleSyncNames}
                disabled={isSyncing}
                className="w-full py-3 bg-gradient-to-r from-baby-blue-200 to-baby-blue-300 text-white font-bold rounded-full flex items-center justify-center gap-2 hover:from-baby-blue-300 hover:to-baby-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft-blue"
              >
                {isSyncing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>מסנכרן...</span>
                  </>
                ) : (
                  <>
                    <Database size={18} />
                    <span>סנכרן שמות למסד הנתונים</span>
                  </>
                )}
              </button>
              
              {syncResult && (
                <div className={`mt-3 p-3 rounded-full text-sm text-center ${
                  syncResult.uploaded > 0
                    ? 'bg-baby-mint-100 text-dreamy-slate-700'
                    : 'bg-baby-blue-50 text-dreamy-slate-600'
                }`}>
                  {syncResult.uploaded > 0 ? (
                    <>✅ הועלו {syncResult.uploaded} שמות חדשים</>
                  ) : (
                    <>✅ כל השמות כבר קיימים {syncResult.skipped && `(${syncResult.skipped} שמות)`}</>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dev Admin Panel - Only visible in development */}
          {isDev && <DevAdminPanel />}

          {/* Danger Zone - Reset Progress */}
          <div className="glass-card rounded-3xl p-5 border border-baby-pink-200/50 animate-fade-up" style={{ animationDelay: '0.38s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-baby-pink-200 to-baby-pink-300 rounded-full flex items-center justify-center shadow-soft-pink">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-dreamy-slate-700 font-heebo">אזור סכנה</p>
                <p className="text-[10px] text-dreamy-slate-400">פעולות שלא ניתן לבטל</p>
              </div>
            </div>
            
            <div className="bg-baby-pink-50/80 rounded-2xl p-3 mb-3">
              <p className="text-xs text-dreamy-slate-500 leading-relaxed">
                איפוס ההתקדמות ימחק את כל ההחלקות שלך ({mySwipeCount} החלקות) ויאפשר לך להתחיל מחדש. 
                ההחלקות של בן/בת הזוג לא יימחקו.
              </p>
            </div>
            
            <button 
              onClick={handleResetProgress}
              disabled={isResetting || mySwipeCount === 0}
              className="w-full p-3 bg-gradient-to-r from-baby-pink-300 to-baby-pink-400 text-white font-bold rounded-full hover:from-baby-pink-400 hover:to-baby-pink-500 transition-all press-effect flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft-pink"
            >
              {isResetting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>מאפס...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>אפס את ההתקדמות שלי</span>
                </>
              )}
            </button>
          </div>

          {/* Logout */}
          <button 
            onClick={onLogout}
            className="w-full p-4 glass-card text-baby-pink-500 font-bold rounded-full hover:bg-baby-pink-50/50 transition-all press-effect flex items-center justify-center gap-2 animate-fade-up"
            style={{ animationDelay: '0.42s' }}
          >
            <LogOut size={18} />
            <span>יציאה מהחשבון</span>
          </button>
          
          {/* Version */}
          <p className="text-center text-[10px] text-dreamy-slate-400/60 pt-2 animate-fade-up" style={{ animationDelay: '0.45s' }}>
            NameIT v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
