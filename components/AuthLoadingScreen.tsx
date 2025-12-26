import React from 'react';

/**
 * Full-screen loading component shown while waiting for auth initialization
 * Displays app logo with pulsing scale animation on white background
 */
const AuthLoadingScreen: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-[200] bg-white"
      style={{
        background: 'linear-gradient(135deg, #FFF5F7 0%, #FFECF0 30%, #E3F2FD 70%, #F0FFF4 100%)',
      }}
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-baby-pink-200/30 blur-3xl rounded-full scale-150 animate-pulse" />
          {/* Logo with pulsing animation */}
          <img 
            src="/logo_new.png" 
            alt="maybe?" 
            className="relative h-72 w-auto object-contain drop-shadow-2xl animate-pulse-scale"
            style={{
              animation: 'pulse-scale 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default AuthLoadingScreen;



