import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, AlertCircle, Terminal } from 'lucide-react';

// Check if we're in development mode (Vite)
const isDev = import.meta.env.DEV;

// Dev admin credentials - only works locally
const DEV_ADMIN = {
  uid: 'dev-admin-001',
  email: 'admin@nameit.dev',
  displayName: 'Admin (Dev)',
  roomId: 'dev-test-room'
};

interface AuthScreenProps {
  onAuthSuccess: (uid: string, email: string, displayName: string) => void;
  onDevLogin?: (uid: string, email: string, displayName: string, roomId: string) => void;
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
}

// Google Logo SVG Component
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
);

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onDevLogin, signUp, login, loginWithGoogle }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  // Quick dev login handler - only works in development
  const handleDevLogin = async () => {
    if (!isDev) {
      console.warn('🚫 Dev login attempted in production - blocked!');
      return;
    }
    
    console.log('🔧 DEV MODE: Quick admin login...');
    setDevLoading(true);
    setError('');
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (onDevLogin) {
      // Use the special dev login handler that skips Firebase
      onDevLogin(DEV_ADMIN.uid, DEV_ADMIN.email, DEV_ADMIN.displayName, DEV_ADMIN.roomId);
    } else {
      // Fallback: use regular auth success
      onAuthSuccess(DEV_ADMIN.uid, DEV_ADMIN.email, DEV_ADMIN.displayName);
    }
    
    setDevLoading(false);
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'המשתמש כבר קיים במערכת';
      case 'auth/invalid-email':
        return 'אימייל לא תקין';
      case 'auth/weak-password':
        return 'הסיסמה חלשה מדי (מינימום 6 תווים)';
      case 'auth/user-not-found':
        return 'משתמש לא נמצא';
      case 'auth/wrong-password':
        return 'סיסמה שגויה';
      case 'auth/invalid-credential':
        return 'פרטי התחברות שגויים';
      case 'auth/too-many-requests':
        return 'יותר מדי ניסיונות, נסו שוב מאוחר יותר';
      case 'auth/popup-closed-by-user':
        return 'החלון נסגר לפני השלמת ההתחברות';
      case 'auth/cancelled-popup-request':
        return 'בקשת ההתחברות בוטלה';
      case 'auth/network-request-failed':
        return 'בעיית רשת, בדקו את החיבור לאינטרנט';
      default:
        return 'שגיאה בהתחברות, נסו שוב';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check for admin shortcut (only in development)
    if (isDev && email === 'admin' && password === 'admin') {
      console.log('🔧 DEV MODE: Admin credentials detected, using quick login...');
      await handleDevLogin();
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const user = await login(email, password);
        onAuthSuccess(user.uid, user.email || '', user.displayName || '');
      } else {
        if (!displayName.trim()) {
          setError('נא להזין שם');
          setLoading(false);
          return;
        }
        const user = await signUp(email, password, displayName);
        onAuthSuccess(user.uid, user.email || '', displayName);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const user = await loginWithGoogle();
      onAuthSuccess(user.uid, user.email || '', user.displayName || '');
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(getErrorMessage(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col mesh-gradient" dir="rtl">
      {/* Scrollable container with hidden scrollbar */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style>{`
          .auth-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {/* Content wrapper - centers on large screens, flows naturally on small */}
        <div className="auth-scroll min-h-full flex flex-col items-center justify-center px-6 py-8 safe-top safe-bottom">
          
          {/* Spacer for top breathing room */}
          <div className="flex-shrink-0 h-4 sm:h-8" />
          
          {/* Logo */}
          <div className="text-center animate-fade-up flex-shrink-0 mb-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 w-28 h-28 sm:w-36 sm:h-36 mx-auto bg-gradient-to-br from-pink-300/30 via-purple-300/20 to-teal-300/30 blur-2xl animate-pulse" />
              <img 
                src="/LOGO.png" 
                alt="NameIT" 
                className="relative w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
          
          {/* Auth Card */}
          <div className="w-full max-w-sm animate-fade-up flex-shrink-0" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card rounded-[2rem] p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl shadow-black/5">
              {/* Tabs */}
              <div className="flex gap-2 p-1.5 bg-gray-100/60 rounded-2xl">
                <button
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    !isLogin 
                      ? 'bg-white text-gray-800 shadow-md' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  הרשמה
                </button>
                <button
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    isLogin 
                      ? 'bg-white text-gray-800 shadow-md' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  התחברות
                </button>
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full py-3.5 sm:py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm press-effect"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <GoogleLogo />
                    <span>המשך עם Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400 font-medium">או</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Display Name (only for signup) */}
                {!isLogin && (
                  <div className="animate-fade-in">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1.5 block">
                      שם תצוגה
                    </label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="איך קוראים לך?"
                        className="w-full px-5 py-3.5 sm:py-4 pr-12 rounded-2xl bg-white/70 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none text-right font-medium placeholder:text-gray-300 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1.5 block">
                    אימייל
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      dir="ltr"
                      className="w-full px-5 py-3.5 sm:py-4 pr-12 rounded-2xl bg-white/70 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none text-left font-medium placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1.5 block">
                    סיסמה
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full px-12 py-3.5 sm:py-4 rounded-2xl bg-white/70 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none text-left font-medium placeholder:text-gray-300 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 sm:p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm animate-fade-in">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || googleLoading || !email || !password || (!isLogin && !displayName)}
                  className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-emerald-200/40 hover:shadow-emerald-200/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all press-effect"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'התחברות' : 'הרשמה'}
                      <ArrowLeft size={20} />
                    </>
                  )}
                </button>
              </form>

              {/* Dev Login Button - Only visible in development mode */}
              {isDev && (
                <div className="pt-2 border-t border-dashed border-orange-200/50">
                  <button
                    onClick={handleDevLogin}
                    disabled={devLoading || loading || googleLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-400/20 to-amber-400/20 border border-orange-300/50 text-orange-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:from-orange-400/30 hover:to-amber-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {devLoading ? (
                      <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Terminal size={16} />
                        <span>Dev Login (localhost only)</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-orange-400/70 text-center mt-1.5">
                    Or type: admin / admin
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Toggle */}
          <p className="text-center text-sm text-gray-400 animate-fade-up flex-shrink-0 mt-6" style={{ animationDelay: '0.2s' }}>
            {isLogin ? 'עדיין אין לך חשבון?' : 'כבר יש לך חשבון?'}{' '}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-emerald-500 font-bold hover:underline"
            >
              {isLogin ? 'הרשמה' : 'התחברות'}
            </button>
          </p>
          
          {/* Bottom safe area spacer */}
          <div className="flex-shrink-0 h-10 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
