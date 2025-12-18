import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (uid: string, email: string, displayName: string) => void;
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, signUp, login }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'כתובת האימייל כבר בשימוש';
      case 'auth/invalid-email':
        return 'כתובת אימייל לא תקינה';
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
      default:
        return 'שגיאה בהתחברות, נסו שוב';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col mesh-gradient overflow-hidden" dir="rtl">
      <div className="flex-1 flex flex-col items-center justify-between px-8 py-12 safe-top safe-bottom">
        
        {/* Logo */}
        <div className="text-center animate-fade-up">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 w-44 h-44 mx-auto bg-gradient-to-br from-pink-300/30 via-purple-300/20 to-teal-300/30 blur-2xl animate-pulse" />
            <img 
              src="/LOGO.png" 
              alt="NameIT" 
              className="relative w-44 h-44 object-contain drop-shadow-2xl"
            />
          </div>
        </div>
        
        {/* Auth Form */}
        <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card rounded-[2rem] p-6 space-y-5">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100/50 rounded-2xl">
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  !isLogin 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                הרשמה
              </button>
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  isLogin 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                התחברות
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name (only for signup) */}
              {!isLogin && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2 block">
                    שם תצוגה
                  </label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="איך קוראים לך?"
                      className="w-full px-5 py-4 pr-12 rounded-2xl bg-white/60 border border-white/50 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-right font-medium placeholder:text-gray-300 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2 block">
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
                    className="w-full px-5 py-4 pr-12 rounded-2xl bg-white/60 border border-white/50 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-left font-medium placeholder:text-gray-300 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2 block">
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
                    className="w-full px-12 py-4 rounded-2xl bg-white/60 border border-white/50 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-left font-medium placeholder:text-gray-300 transition-all"
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
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email || !password || (!isLogin && !displayName)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-emerald-200/40 hover:shadow-emerald-200/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all press-effect"
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
          </div>
        </div>
        
        {/* Bottom Text */}
        <p className="text-center text-xs text-gray-400 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {isLogin ? 'עדיין אין לך חשבון?' : 'כבר יש לך חשבון?'}{' '}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-emerald-500 font-bold hover:underline"
          >
            {isLogin ? 'הרשמה' : 'התחברות'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;

