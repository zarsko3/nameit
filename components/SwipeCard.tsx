
import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BabyName, Gender } from '../types';
import { Heart, X, Info, Sparkles, RotateCcw } from 'lucide-react';
import { getNameInsights } from '../services/gemini';

interface SwipeCardProps {
  name: BabyName;
  onSwipe: (liked: boolean) => void;
  onUndo: () => void;
  canUndo: boolean;
  progress: number; // 0 to 1
}

// Swipe configuration constants
const SWIPE_THRESHOLD = 100; // Minimum pixels to trigger a swipe
const SWIPE_VELOCITY_THRESHOLD = 0.5; // Minimum velocity (px/ms) for quick flicks
const MAX_ROTATION = 15; // Maximum rotation in degrees during drag

const SwipeCard: React.FC<SwipeCardProps> = ({ name, onSwipe, onUndo, canUndo, progress }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);

  // Swipe gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate swipe intensity for visual feedback (0 to 1)
  const swipeIntensity = Math.min(Math.abs(dragOffset.x) / SWIPE_THRESHOLD, 1);
  const swipeDirection = dragOffset.x > 0 ? 'right' : dragOffset.x < 0 ? 'left' : null;

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (showInfo || swipeDir) return;
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setIsDragging(true);
  }, [showInfo, swipeDir]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY * 0.3 }); // Reduce vertical movement
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    handleDragEnd();
  }, [isDragging, dragOffset]);

  // Mouse event handlers (for desktop testing)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (showInfo || swipeDir) return;
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setIsDragging(true);
  }, [showInfo, swipeDir]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY * 0.3 });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    handleDragEnd();
  }, [isDragging, dragOffset]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, dragOffset]);

  // Common drag end logic - evaluates horizontal displacement (dx) against threshold
  const handleDragEnd = () => {
    const dx = dragOffset.x; // Horizontal displacement
    const elapsed = Date.now() - dragStartRef.current.time;
    const velocity = Math.abs(dx) / elapsed;
    
    // Check if swipe threshold or velocity threshold is met
    const isSwipe = Math.abs(dx) >= SWIPE_THRESHOLD || velocity >= SWIPE_VELOCITY_THRESHOLD;
    
    if (isSwipe && Math.abs(dx) > 30) {
      /**
       * SWIPE DIRECTION LOGIC:
       * - dx > threshold  → Right swipe → LIKE (positive action)
       * - dx < -threshold → Left swipe  → DISLIKE (negative action)
       */
      const liked = dx > 0; // Positive dx = right = LIKE | Negative dx = left = DISLIKE
      setSwipeDir(liked ? 'right' : 'left');
      setTimeout(() => {
        onSwipe(liked);
      }, 200); // Reduced from 300ms to 200ms for faster interaction
    } else {
      // Below threshold - reset position with spring animation
      setDragOffset({ x: 0, y: 0 });
    }
    
    setIsDragging(false);
    
    // Debug log (can be removed in production)
    console.log(`[Swipe Debug] dx: ${dx.toFixed(0)}px, Velocity: ${velocity.toFixed(2)}px/ms, Action: ${dx > 0 ? 'LIKE' : 'DISLIKE'}, Triggered: ${isSwipe}`);
  };

  const getGenderStyle = (gender: Gender) => {
    switch (gender) {
      case Gender.BOY: return { bg: 'bg-baby-blue-100/80', text: 'text-baby-blue-500', border: 'border-baby-blue-200' };
      case Gender.GIRL: return { bg: 'bg-baby-pink-100/80', text: 'text-baby-pink-500', border: 'border-baby-pink-200' };
      default: return { bg: 'bg-baby-lavender-100/80', text: 'text-baby-lavender-300', border: 'border-baby-lavender-200' };
    }
  };

  const genderStyle = getGenderStyle(name.gender);

  // Subtle gender tint for main card (solid, no patterns)
  const getCardTint = (gender: Gender) => {
    switch (gender) {
      case Gender.BOY:
        return 'rgba(239, 246, 255, 0.85)'; // Very subtle blue tint
      case Gender.GIRL:
        return 'rgba(255, 241, 242, 0.85)'; // Very subtle pink tint
      default:
        return 'rgba(255, 254, 245, 0.85)'; // Very subtle warm neutral
    }
  };

  const cardTint = getCardTint(name.gender);

  const handleInfoClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfo(!showInfo);
    if (!insights && !showInfo) {
      setLoadingInsights(true);
      const data = await getNameInsights(name.hebrew, name.meaning);
      setInsights(data);
      setLoadingInsights(false);
    }
  };

  const handleSwipeAction = (liked: boolean) => {
    if (swipeDir) return; // Prevent multiple clicks
    setSwipeDir(liked ? 'right' : 'left');
    // Reduced delay for faster interaction - just enough for card to clear center
    setTimeout(() => {
      onSwipe(liked);
    }, 200); // Reduced from 300ms to 200ms for faster interaction
  };

  // Dynamic animation styles - supports both button clicks and drag gestures
  const getTransformStyles = () => {
    // If card is being swiped away via button or completed gesture
    if (swipeDir) {
      return {
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Reduced from 0.35s to 0.2s for faster exit
        transform: swipeDir === 'left' 
          ? 'translateX(-150%) rotate(-25deg)' 
          : 'translateX(150%) rotate(25deg)',
        opacity: 0,
      };
    }
    
    // If user is actively dragging
    if (isDragging) {
      const rotation = (dragOffset.x / SWIPE_THRESHOLD) * MAX_ROTATION;
      return {
        transition: 'none', // Immediate response during drag
        transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
        opacity: 1,
        cursor: 'grabbing',
      };
    }
    
    // Default resting state
    return {
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Reduced from 0.4s to 0.3s for snappier spring-back
      transform: 'translateX(0) translateY(0) rotate(0)',
      opacity: 1,
      cursor: 'grab',
    };
  };

  const animationStyles = getTransformStyles();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden px-3 md:px-6 py-2">
      {/* Card Stack Container - Responsive: compact on mobile, clamped on desktop */}
      <div className="relative w-[80%] max-w-[320px] md:w-[380px] md:max-w-md h-[55dvh] min-h-[420px] md:h-[65vh]">
        
        {/* Back Card (Bottom) - Blue Mist, wider fan */}
        <div 
          className="absolute inset-0 rounded-[2rem] md:rounded-[2.5rem] pointer-events-none box-border"
          style={{
            transform: 'rotate(-10deg) translateX(-10px)',
            transformOrigin: 'center center',
            zIndex: 30,
            background: 'rgba(191, 219, 254, 0.55)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
            border: '4px solid rgba(255, 255, 255, 0.8)',
          }}
        />
        
        {/* Middle Card - Pink Mist, wider fan */}
        <div 
          className="absolute inset-0 rounded-[2rem] md:rounded-[2.5rem] pointer-events-none box-border"
          style={{
            transform: 'rotate(7deg) translateX(8px)',
            transformOrigin: 'center center',
            zIndex: 40,
            background: 'rgba(252, 211, 217, 0.55)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
            border: '4px solid rgba(255, 255, 255, 0.8)',
          }}
        />

        {/* Main Active Card */}
        <div 
          ref={cardRef}
          className="absolute inset-0 select-none"
          style={{
            ...animationStyles,
            touchAction: 'pan-y',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            zIndex: 50,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className={`w-full h-full rounded-[2rem] md:rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden box-border ${showInfo ? 'z-20' : ''}`}
            style={{
              background: cardTint,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
              border: '4px solid rgba(255, 255, 255, 0.8)',
            }}
          >
          
          {/* Swipe Direction Overlay Indicators - Responsive */}
          {isDragging && swipeDirection && (
            <>
              {/* LIKE Indicator - Soft mint/teal (Right swipe) */}
              <div 
                className="absolute inset-0 bg-baby-mint-200/40 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center z-40 pointer-events-none transition-opacity duration-150"
                style={{ opacity: swipeDirection === 'right' ? swipeIntensity : 0 }}
              >
                <div 
                  className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-baby-mint-300 to-baby-mint-400 rounded-full flex items-center justify-center shadow-soft-mint"
                  style={{ transform: `scale(${0.5 + swipeIntensity * 0.5})` }}
                >
                  <Heart size={32} className="text-white md:w-12 md:h-12" fill="white" />
                </div>
                <span 
                  className="mt-3 md:mt-4 text-dreamy-slate-600 font-bold text-base md:text-xl uppercase tracking-wider"
                  style={{ opacity: swipeIntensity }}
                >
                  אהבתי
                </span>
              </div>
              
              {/* DISLIKE Indicator - Soft rose/pink (Left swipe) */}
              <div 
                className="absolute inset-0 bg-baby-pink-200/40 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center z-40 pointer-events-none transition-opacity duration-150"
                style={{ opacity: swipeDirection === 'left' ? swipeIntensity : 0 }}
              >
                <div 
                  className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-baby-pink-300 to-baby-pink-400 rounded-full flex items-center justify-center shadow-soft-pink"
                  style={{ transform: `scale(${0.5 + swipeIntensity * 0.5})` }}
                >
                  <X size={32} className="text-white md:w-12 md:h-12" />
                </div>
                <span 
                  className="mt-3 md:mt-4 text-dreamy-slate-600 font-bold text-base md:text-xl uppercase tracking-wider"
                  style={{ opacity: swipeIntensity }}
                >
                  לא אהבתי
                </span>
              </div>
            </>
          )}
          
          {/* ===== TOP SECTION: Header with Tags & Actions - Responsive padding ===== */}
          <div className="w-full px-4 md:px-6 pt-4 md:pt-6 flex justify-between items-center z-10 shrink-0 bg-transparent">
             <span className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-wider border ${genderStyle.bg} ${genderStyle.text} ${genderStyle.border}`}>
               {name.gender === Gender.BOY ? 'בן' : name.gender === Gender.GIRL ? 'בת' : 'יוניסקס'}
             </span>
             <div className="flex gap-1.5 md:gap-2">
                <button 
                  onClick={handleInfoClick}
                  className="text-baby-blue-400 hover:text-baby-blue-500 transition-colors p-2 md:p-2.5 rounded-full bg-white/60 border border-white/50"
                >
                  <Info size={18} className="md:w-5 md:h-5" />
                </button>
                {canUndo && (
                  <button 
                    onClick={onUndo}
                    className="text-dreamy-slate-500 p-2 md:p-2.5 rounded-full bg-white/60 border border-white/50 hover:bg-white/80 transition-all flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3"
                  >
                    <RotateCcw size={14} className="md:w-4 md:h-4" />
                    <span className="text-[10px] md:text-[11px] font-bold">חזור</span>
                  </button>
                )}
             </div>
          </div>

          {/* ===== CENTER SECTION: Name, Transliteration, Meaning - Responsive typography ===== */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-4 md:py-8 text-center min-h-0 relative">
            {/* Watermark - Large faint gender icon - Responsive size */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
              style={{ opacity: 0.04 }}
            >
              <span 
                className="text-dreamy-slate-400 font-bold text-[120px] md:text-[180px]"
                style={{ transform: 'translateY(-10px)' }}
              >
                {name.gender === Gender.BOY ? '♂' : name.gender === Gender.GIRL ? '♀' : '⚥'}
              </span>
            </div>
            
            {/* Main Name - Hero Element - Responsive: slightly smaller for Varela Round's wider nature */}
            <h2 className="text-3xl md:text-5xl font-bold text-dreamy-slate-700 tracking-tight leading-none mb-1 md:mb-2 relative z-10">{name.hebrew}</h2>
            
            {/* Transliteration - Responsive */}
            <p className="text-base md:text-lg font-medium text-dreamy-slate-400 uppercase tracking-[0.12em] md:tracking-[0.15em] mb-3 md:mb-6 relative z-10">{name.transliteration}</p>
            
            {/* Meaning - Responsive: text-sm mobile, text-base desktop */}
            <p className="text-dreamy-slate-600 font-medium leading-relaxed text-sm md:text-base max-w-[95%] md:max-w-[90%] relative z-10">{name.meaning}</p>
          </div>

          {/* ===== BOTTOM SECTION: Action Buttons - Responsive sizing ===== */}
          <div className="w-full px-4 md:px-6 pb-4 md:pb-8 pt-3 md:pt-6 shrink-0" dir="ltr">
            <div className="flex justify-center items-center gap-8 md:gap-10">
              {/* Dislike Button - Soft Rose/Pink - Responsive size */}
              <button 
                onClick={() => handleSwipeAction(false)}
                className="flex flex-col items-center gap-1.5 md:gap-2 group active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center bg-baby-pink-100/80 border-2 border-baby-pink-200 text-baby-pink-400 group-hover:bg-baby-pink-200 group-hover:text-baby-pink-500 transition-all shadow-soft-pink">
                  <X size={24} strokeWidth={2.5} className="md:w-[30px] md:h-[30px]" />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold text-dreamy-slate-400 group-hover:text-baby-pink-500">לא אהבתי</span>
              </button>

              {/* Like Button - Soft Mint/Teal - Responsive size */}
              <button 
                onClick={() => handleSwipeAction(true)}
                className="flex flex-col items-center gap-1.5 md:gap-2 group active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center bg-gradient-to-br from-baby-mint-200 to-baby-mint-300 text-white border-2 border-baby-mint-300 group-hover:from-baby-mint-300 group-hover:to-baby-mint-400 transition-all shadow-soft-mint">
                  <Heart size={28} fill="currentColor" className="md:w-9 md:h-9" />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold text-baby-mint-400">אהבתי</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Premium Glass Modal - Insights Popup */}
      {showInfo && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInfo(false);
          }}
          dir="rtl"
        >
          {/* Blurred Overlay with Dark Tint */}
          <div 
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-md"
            onClick={() => setShowInfo(false)}
            style={{
              animation: 'fadeIn 0.2s ease-out',
            }}
          />
          
          {/* Glass Modal Card */}
          <div 
            className="relative w-full max-w-md rounded-3xl flex flex-col overflow-hidden"
            style={{
              maxHeight: '75vh',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Top Right Corner */}
            <button 
              onClick={() => setShowInfo(false)} 
              className="absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100/60 hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-all active:scale-90"
              aria-label="סגור"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {/* Header - Centered Title */}
            <div className="pt-8 pb-4 px-6 text-center shrink-0">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles size={22} className="text-amber-400" />
                <h3 className="text-xl font-bold bg-gradient-to-r from-baby-pink-400 via-baby-lavender-300 to-baby-blue-400 bg-clip-text text-transparent font-heebo">
                  תובנות נוספות
                </h3>
                <Sparkles size={22} className="text-amber-400" />
              </div>
              <p className="text-sm text-slate-400 font-medium">{name.hebrew} • {name.transliteration}</p>
            </div>
            
            {/* Divider */}
            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
             
            {/* Content - Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-6 py-5" style={{ minHeight: 0 }}>
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[180px]">
                  <div className="w-10 h-10 border-2 border-baby-pink-200 border-t-baby-pink-400 rounded-full animate-spin" />
                  <p className="text-sm font-medium text-slate-400 tracking-wide">טוען תובנות...</p>
                </div>
              ) : (
                <div className="text-right space-y-4">
                  {insights && insights.split('\n').filter(p => p.trim()).map((paragraph, index) => {
                    const trimmed = paragraph.trim();
                    const isHeader = trimmed.includes('✨') && trimmed.length < 80;
                    const isBullet = trimmed.startsWith('•');
                    
                    if (isHeader) {
                      return (
                        <h4 
                          key={index}
                          className="text-slate-700 font-bold text-base mt-4 mb-2 font-heebo flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-baby-pink-400" />
                          {trimmed.replace(/^[•✨]\s*/, '')}
                        </h4>
                      );
                    }
                    
                    return (
                      <p 
                        key={index}
                        className={`text-slate-600 leading-relaxed text-[15px] ${isBullet ? 'pr-3' : ''}`}
                      >
                        {trimmed.replace(/^[•]\s*/, '')}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer - Close Action */}
            <div className="px-6 py-4 shrink-0">
              <button
                onClick={() => setShowInfo(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-baby-pink-200 via-baby-lavender-100 to-baby-blue-200 text-slate-600 font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                סגור
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SwipeCard;








