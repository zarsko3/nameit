
import React from 'react';
import { AppView } from '../types';
import { Heart, List, Settings as SettingsIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  showNav: boolean;
  isConnected: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, showNav, isConnected }) => {
  return (
    <>
      {/* Main App Container - Locked viewport, no scroll */}
      <div className={`flex flex-col h-[100dvh] w-full md:max-w-md mx-auto relative overflow-hidden overscroll-none font-assistant safe-top ${showNav ? 'pb-24' : ''}`} style={{ overscrollBehavior: 'none' }}>
        {/* FIXED HEADER - Stays at top, outside scrollable content */}
        {showNav && (
          <header 
            className="fixed top-0 left-0 right-0 z-[90] px-4 py-1 flex items-center justify-center shrink-0 bg-transparent w-full max-w-full md:max-w-md md:mx-auto md:left-1/2 md:-translate-x-1/2 safe-top"
            style={{
              background: 'rgba(255, 255, 255, 0.70)',
              backdropFilter: 'blur(24px) saturate(150%)',
              WebkitBackdropFilter: 'blur(24px) saturate(150%)',
              boxShadow: '0 2px 20px rgba(69, 90, 100, 0.04)',
              height: 'calc(4rem + env(safe-area-inset-top, 0px))',
            }}
          >
            <img 
              src="/logo_new.png" 
              alt="maybe?" 
              className="h-16 md:h-20 w-auto object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
            />
          </header>
        )}

        {/* Main Content - Flex grow to fill available space, accounts for fixed header */}
        {/* Children (History/Settings) handle their own scrolling internally */}
        <main 
          className="flex-1 flex flex-col overflow-hidden overscroll-none relative" 
          style={{ 
            overscrollBehavior: 'none',
            paddingTop: showNav ? 'calc(4rem + env(safe-area-inset-top, 0px))' : '0'
          }}
        >
          {children}
        </main>
      </div>

      {/* Fixed Bottom Navigation - OUTSIDE the scrollable container */}
      {showNav && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-[100] rounded-t-3xl px-10 pt-3 flex justify-center items-center border-t border-white/50 w-full max-w-full md:max-w-md md:mx-auto md:left-1/2 md:-translate-x-1/2"
          style={{
            background: 'rgba(255, 255, 255, 0.70)',
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 -4px 30px rgba(69, 90, 100, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          }}
        >
          <div className="flex justify-between items-center w-full max-w-sm">
            <button 
              onClick={() => setActiveView('SWIPE')}
              className={`flex flex-col items-center gap-1 transition-all ${activeView === 'SWIPE' ? 'text-baby-pink-500' : 'text-dreamy-slate-400'}`}
            >
              <Heart size={24} className={activeView === 'SWIPE' ? 'fill-baby-pink-400 text-baby-pink-500' : ''} />
              <span className="text-[10px] font-bold">התאמה</span>
            </button>
            <button 
              onClick={() => setActiveView('MATCHES')}
              className={`flex flex-col items-center gap-1 transition-all ${activeView === 'MATCHES' ? 'text-baby-blue-500' : 'text-dreamy-slate-400'}`}
            >
              <List size={24} />
              <span className="text-[10px] font-bold">רשימה</span>
            </button>
            <button 
              onClick={() => setActiveView('SETTINGS')}
              className={`flex flex-col items-center gap-1 transition-all ${activeView === 'SETTINGS' ? 'text-baby-lavender-300' : 'text-dreamy-slate-400'}`}
            >
              <SettingsIcon size={24} />
              <span className="text-[10px] font-bold">הגדרות</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};

export default Layout;
