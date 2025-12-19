
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
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden font-assistant safe-top safe-bottom">
      {/* Header - Clean Logo with Bounce Effect */}
      {showNav && (
        <header className="px-px py-3 flex items-center justify-center shrink-0 bg-transparent">
          <img 
            src="/LOGO.png" 
            alt="NameIT" 
            className="h-[97px] w-auto object-contain cursor-pointer transition-transform duration-300 hover:scale-110"
          />
        </header>
      )}

      {/* Main Content - Transparent for background to show */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>

      {/* Navigation - Soft rounded top corners, integrated look */}
      {showNav && (
        <nav className="glass-card rounded-t-3xl px-10 pt-4 pb-5 flex justify-between items-center shrink-0">
          <button 
            onClick={() => setActiveView('SWIPE')}
            className={`flex flex-col items-center gap-1 transition-all ${activeView === 'SWIPE' ? 'text-baby-pink-500' : 'text-dreamy-slate-400'}`}
          >
            <Heart size={26} className={activeView === 'SWIPE' ? 'fill-baby-pink-400 text-baby-pink-500' : ''} />
            <span className="text-[10px] font-bold">התאמה</span>
          </button>
          <button 
            onClick={() => setActiveView('MATCHES')}
            className={`flex flex-col items-center gap-1 transition-all ${activeView === 'MATCHES' ? 'text-baby-blue-500' : 'text-dreamy-slate-400'}`}
          >
            <List size={26} />
            <span className="text-[10px] font-bold">רשימה</span>
          </button>
          <button 
            onClick={() => setActiveView('SETTINGS')}
            className={`flex flex-col items-center gap-1 transition-all ${activeView === 'SETTINGS' ? 'text-baby-lavender-300' : 'text-dreamy-slate-400'}`}
          >
            <SettingsIcon size={26} />
            <span className="text-[10px] font-bold">הגדרות</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default Layout;
