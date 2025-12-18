import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

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

    // Detect iOS for special instructions
    const checkIOS = () => {
      const ua = window.navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
      return isIOSDevice;
    };

    // Listen for the beforeinstallprompt event (Chrome, Edge, Samsung Internet)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (checkConditions()) {
        // Delay showing the prompt for better UX
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // For iOS, we need to show manual instructions
    if (checkIOS() && checkConditions()) {
      setTimeout(() => setShowPrompt(true), 3000);
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
        console.log('PWA installed');
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-fade-in">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-400 to-teal-400 p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <Smartphone size={24} className="text-white" />
          </div>
          <div className="flex-1 text-white">
            <h3 className="font-bold text-lg">התקן את NameIT</h3>
            <p className="text-white/80 text-sm">גישה מהירה מהמסך הראשי</p>
          </div>
          <button 
            onClick={handleDismiss}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isIOS ? (
            // iOS Instructions (Safari doesn't support beforeinstallprompt)
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                להוספת האפליקציה למסך הבית:
              </p>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center font-bold">1</div>
                <p className="text-gray-700">לחץ על כפתור השיתוף <span className="inline-block px-2 py-1 bg-gray-200 rounded text-sm">⬆️</span> בתחתית הדפדפן</p>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center font-bold">2</div>
                <p className="text-gray-700">גלול ובחר "הוסף למסך הבית"</p>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center font-bold">3</div>
                <p className="text-gray-700">לחץ "הוסף" בפינה הימנית העליונה</p>
              </div>
              <button
                onClick={handleDismiss}
                className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                הבנתי, תודה!
              </button>
            </div>
          ) : (
            // Android/Chrome Install Button
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                התקן את האפליקציה לגישה מהירה וחוויה טובה יותר - בלי צורך בחנות האפליקציות!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  לא עכשיו
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-4 bg-emerald-400 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  התקן
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;

