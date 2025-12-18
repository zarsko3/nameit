
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-sm relative overflow-hidden font-assistant safe-top safe-bottom">
      {/* Header - only show on main app screens */}
      {showNav && (
        <header className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-center shrink-0">
          <img 
            src="/LOGO.png" 
            alt="NameIT" 
            className="h-14 w-auto object-contain"
          />
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-white">
        {children}
      </main>

      {/* Navigation */}
      {showNav && (
        <nav className="border-t border-gray-100 bg-white px-10 pt-3 pb-4 flex justify-between items-center shrink-0">
          <button 
            onClick={() => setActiveView('SWIPE')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'SWIPE' ? 'text-coral-400' : 'text-gray-300'}`}
          >
            <Heart size={26} className={activeView === 'SWIPE' ? 'fill-emerald-400 text-emerald-400' : ''} style={activeView === 'SWIPE' ? { color: '#FFAB91', fill: '#FFAB91' } : {}} />
            <span className="text-[10px] font-bold">התאמה</span>
          </button>
          <button 
            onClick={() => setActiveView('MATCHES')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'MATCHES' ? 'text-gray-600' : 'text-gray-300'}`}
          >
            <List size={26} />
            <span className="text-[10px] font-bold">רשימה</span>
          </button>
          <button 
            onClick={() => setActiveView('SETTINGS')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'SETTINGS' ? 'text-gray-600' : 'text-gray-300'}`}
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
