import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, ArrowDown } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  isLoggedIn: boolean; // User must be logged in to see the prompt
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ isLoggedIn }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check conditions for showing the prompt
    const checkConditions = () => {
      // 1. Check if user dismissed the prompt before (stored in localStorage)
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        // Don't show again for 7 days
        if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
          return false;
        }
      }

      // 2. Check if already running in standalone mode (already installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone === true;
      if (isStandalone) {
        return false;
      }

      // 3. Check if mobile device (screen width < 768px)
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        return false;
      }

      // 4. Check if user is logged in
      if (!isLoggedIn) {
        return false;
      }

      return true;
    };

    // Detect iOS Safari
    const checkIOS = () => {
      const ua = window.navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
      const isIOSSafari = isIOSDevice && isSafari;
      setIsIOS(isIOSSafari);
      return isIOSSafari;
    };

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent the default mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (checkConditions() && !checkIOS()) {
        // Delay showing the prompt for better UX
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    // For iOS Safari, show manual instructions
    if (checkIOS() && checkConditions()) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isLoggedIn]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Trigger the native install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA installed');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  // Android/Chrome: Floating Card above navigation bar
  if (!isIOS && deferredPrompt) {
    return (
      <div 
        className="fixed left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[110] animate-fade-up"
        style={{
          bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 0.5rem)',
        }}
      >
        <div 
          className="relative w-full rounded-2xl overflow-hidden shadow-xl animate-pop"
          style={{
            background: 'rgba(255, 255, 255, 0.90)',
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.50)',
          }}
        >
          {/* Close Button - Small, subtle gray */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 left-3 z-10 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/60 text-dreamy-slate-400 hover:text-dreamy-slate-600 transition-all active:scale-90"
            aria-label="סגור"
          >
            <X size={14} strokeWidth={2} />
          </button>

          {/* Content */}
          <div className="p-5 pt-4">
            <div className="flex items-start gap-4 mb-4">
              {/* Icon with gradient circle background */}
              <div className="w-12 h-12 bg-gradient-to-br from-baby-mint-200 to-baby-blue-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Smartphone size={24} className="text-white" strokeWidth={1.5} />
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Title - Dark text */}
                <h3 className="font-bold text-dreamy-slate-700 mb-1 text-base font-heebo">
                  התקן את NameIT
                </h3>
                {/* Message - Dark text */}
                <p className="text-dreamy-slate-600 text-sm leading-relaxed mb-4">
                  גישה מהירה מהמסך הראשי
                </p>
                
                {/* Action Button - Pill-shaped gradient (Teal/Blue) */}
                <button
                  onClick={handleInstall}
                  className="w-full py-3 bg-gradient-to-r from-baby-mint-400 to-baby-blue-400 text-white rounded-full font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  <span>התקן עכשיו</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari: Floating Tooltip pointing to Share button
  if (isIOS) {
    return (
      <div 
        className="fixed left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[110] animate-fade-up"
        style={{
          bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 0.5rem)',
        }}
      >
        <div 
          className="relative w-full rounded-2xl overflow-hidden shadow-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.90)',
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.50)',
          }}
        >
          {/* Arrow pointing down to Share button */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent" style={{ borderTopColor: 'rgba(255, 255, 255, 0.90)' }} />
          
          {/* Content */}
          <div className="p-5">
            {/* Close Button - Small, subtle gray */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 left-3 z-10 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/60 text-dreamy-slate-400 hover:text-dreamy-slate-600 transition-colors"
              aria-label="סגור"
            >
              <X size={14} strokeWidth={2} />
            </button>
            
            <div className="flex items-start gap-3 pr-6">
              <div className="w-10 h-10 bg-gradient-to-br from-baby-pink-200 to-baby-blue-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Share2 size={20} className="text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-dreamy-slate-700 mb-1 text-sm font-heebo">
                  כדי להתקין:
                </h3>
                <p className="text-dreamy-slate-600 text-xs leading-relaxed">
                  לחצו על כפתור השיתוף 👇<br />
                  ובחרו 'הוסף למסך הבית'
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InstallPrompt;


