import React, { useState, useEffect } from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
}

/**
 * Mobile Container Wrapper
 * On desktop (>500px): Wraps app in phone-like container (centered, rounded, shadowed)
 * On mobile (<=500px): Renders normally full screen
 */
const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth > 500);
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mobile: Render normally (full screen)
  if (!isDesktop) {
    return <>{children}</>;
  }

  // Desktop: Wrap in phone-like container
  return (
    <div 
      className="w-full h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Phone Frame Container */}
      <div
        className="relative"
        style={{
          width: '430px',
          height: '90vh',
          maxHeight: '932px', // iPhone 14 Pro Max height
          minHeight: '667px', // iPhone SE height
          borderRadius: '2.5rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 8px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          backgroundColor: '#000',
          padding: '8px',
        }}
      >
        {/* Inner Screen - Rounded corners */}
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            borderRadius: '2rem',
            backgroundColor: '#fff',
          }}
        >
          {/* Notch simulation (optional) */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-[200]"
            style={{
              width: '150px',
              height: '30px',
              backgroundColor: '#000',
              borderBottomLeftRadius: '20px',
              borderBottomRightRadius: '20px',
            }}
          />
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileContainer;
