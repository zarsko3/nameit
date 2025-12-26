import React from 'react';
import { Smartphone } from 'lucide-react';

/**
 * Mobile Only Blocking Screen
 * Shown when user tries to access the app on desktop/tablet
 */
const MobileOnlyBlock: React.FC = () => {
  return (
    <div 
      className="w-full h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #FFF5F7 0%, #FFECF0 30%, #E3F2FD 70%, #F0FFF4 100%)',
        minHeight: '100vh',
      }}
    >
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Phone Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-white/80 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-xl">
            <Smartphone size={48} className="text-baby-pink-400" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-dreamy-slate-700 font-heebo mb-3">
            חוויה למובייל בלבד
          </h1>
          <p className="text-lg text-dreamy-slate-500 font-medium leading-relaxed">
            אפליקציה זו מותאמת לטלפונים ניידים. אנא היכנסו דרך הטלפון לחוויה המלאה.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center gap-2 pt-4">
          <div className="w-2 h-2 bg-baby-pink-300 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-baby-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-baby-mint-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

export default MobileOnlyBlock;


