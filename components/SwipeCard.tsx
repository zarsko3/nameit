
import React, { useState, useRef, useCallback } from 'react';
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
      }, 300);
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
      case Gender.BOY: return { bg: 'bg-blue-50', text: 'text-blue-400', border: 'border-blue-100' };
      case Gender.GIRL: return { bg: 'bg-rose-50', text: 'text-rose-400', border: 'border-rose-100' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-100' };
    }
  };

  const genderStyle = getGenderStyle(name.gender);

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
    // Subtle delay to allow the animation to play out
    setTimeout(() => {
      onSwipe(liked);
    }, 300);
  };

  // Dynamic animation styles - supports both button clicks and drag gestures
  const getTransformStyles = () => {
    // If card is being swiped away via button or completed gesture
    if (swipeDir) {
      return {
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
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
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring-back animation
      transform: 'translateX(0) translateY(0) rotate(0)',
      opacity: 1,
      cursor: 'grab',
    };
  };

  const animationStyles = getTransformStyles();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden">
      {/* Progress Bar - Minimalist Thin Line */}
      <div className="w-full h-0.5 bg-gray-50 overflow-hidden absolute top-0 left-0 z-10">
        <div 
          className="h-full bg-emerald-400 transition-all duration-700 ease-in-out"
          style={{ width: `${progress * 100}%` }}
        ></div>
      </div>

      {/* Main Card Container - Responsive proportions (approx 75-80% of space) */}
      <div 
        ref={cardRef}
        className="flex-[8] w-full max-w-sm flex flex-col justify-center px-4 pt-4 select-none"
        style={{
          ...animationStyles,
          touchAction: 'pan-y', // Allow vertical scroll, capture horizontal swipes
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        // Touch events for mobile
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // Mouse events for desktop
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`w-full h-full bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center relative ${showInfo ? 'z-20' : ''}`}>
          
          {/* Swipe Direction Overlay Indicators
              Logic: dx > 0 (right swipe) = LIKE | dx < 0 (left swipe) = DISLIKE */}
          {isDragging && swipeDirection && (
            <>
              {/* LIKE Indicator - Triggered when dx > threshold (Right swipe) */}
              <div 
                className="absolute inset-0 bg-emerald-400/20 rounded-[2.5rem] flex flex-col items-center justify-center z-40 pointer-events-none transition-opacity duration-150"
                style={{ opacity: swipeDirection === 'right' ? swipeIntensity : 0 }}
              >
                <div 
                  className="w-24 h-24 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg"
                  style={{ transform: `scale(${0.5 + swipeIntensity * 0.5})` }}
                >
                  <Heart size={48} className="text-white" fill="white" />
                </div>
                <span 
                  className="mt-4 text-emerald-600 font-bold text-xl uppercase tracking-wider"
                  style={{ opacity: swipeIntensity }}
                >
                  אהבתי
                </span>
              </div>
              
              {/* DISLIKE Indicator - Triggered when dx < -threshold (Left swipe) */}
              <div 
                className="absolute inset-0 bg-red-400/20 rounded-[2.5rem] flex flex-col items-center justify-center z-40 pointer-events-none transition-opacity duration-150"
                style={{ opacity: swipeDirection === 'left' ? swipeIntensity : 0 }}
              >
                <div 
                  className="w-24 h-24 bg-red-400 rounded-full flex items-center justify-center shadow-lg"
                  style={{ transform: `scale(${0.5 + swipeIntensity * 0.5})` }}
                >
                  <X size={48} className="text-white" />
                </div>
                <span 
                  className="mt-4 text-red-600 font-bold text-xl uppercase tracking-wider"
                  style={{ opacity: swipeIntensity }}
                >
                  לא מתאים
                </span>
              </div>
            </>
          )}
          
          {/* Card Header */}
          <div className="w-full px-6 pt-6 flex justify-between items-center z-10">
             <span className={`px-4 py-1 rounded-xl text-[12px] font-bold uppercase tracking-wider border ${genderStyle.bg} ${genderStyle.text} ${genderStyle.border}`}>
               {name.gender === Gender.BOY ? 'בן' : name.gender === Gender.GIRL ? 'בת' : 'יוניסקס'}
             </span>
             <div className="flex gap-2">
                <button 
                  onClick={handleInfoClick}
                  className="text-gray-300 hover:text-emerald-400 transition-colors p-3 rounded-xl bg-white border border-gray-100"
                >
                  <Info size={22} />
                </button>
                {canUndo && (
                  <button 
                    onClick={onUndo}
                    className="text-gray-400 p-3 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-all flex items-center gap-1.5 px-4"
                  >
                    <RotateCcw size={18} />
                    <span className="text-[12px] font-bold">חזור</span>
                  </button>
                )}
             </div>
          </div>

          {/* Card Body */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <h2 className="text-[54px] font-bold text-gray-700 mb-2 font-heebo tracking-tight leading-none">{name.hebrew}</h2>
            <p className="text-lg font-medium text-gray-300 uppercase tracking-widest mb-6">{name.transliteration}</p>
            
            <div className="px-6 py-5 bg-white rounded-3xl border border-gray-100 max-w-[90%] shadow-sm">
               <p className="text-gray-500 font-medium leading-relaxed text-[18px]">{name.meaning}</p>
            </div>
          </div>

          {/* Gemini Insights Overlay */}
          {showInfo && (
            <div className="absolute inset-0 bg-white/98 backdrop-blur-sm z-30 p-8 flex flex-col overflow-y-auto animate-pop rounded-[2.5rem]">
               <div className="flex justify-between items-center mb-8 shrink-0">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                      <Sparkles size={22} />
                      תובנות נוספות
                  </h3>
                  <button onClick={() => setShowInfo(false)} className="text-gray-300 p-2 rounded-full hover:bg-gray-50"><X size={28} /></button>
               </div>
               <div className="space-y-6 text-right flex-1">
                  {loadingInsights ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                          <div className="w-10 h-10 border-2 border-emerald-50 border-t-emerald-400 rounded-full animate-spin"></div>
                          <p className="text-[12px] font-bold text-gray-300 uppercase tracking-widest">טוען תובנות...</p>
                      </div>
                  ) : (
                      <div className="text-gray-600 leading-relaxed whitespace-pre-line text-[18px] font-medium">
                          {insights}
                      </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Thumb Zone (approx lower 20%) 
          Button order matches swipe directions: LEFT = Dislike, RIGHT = Like
          Using dir="ltr" to override RTL and ensure consistent left/right positioning */}
      <div className="flex-[2] w-full max-w-sm px-10 py-6 flex justify-center items-center gap-12 shrink-0" dir="ltr">
        {/* LEFT Button = Dislike (matches left swipe) */}
        <button 
          onClick={() => handleSwipeAction(false)}
          className="flex flex-col items-center gap-2 group active:scale-90 transition-transform"
        >
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-gray-50 border border-gray-100 text-gray-300 group-hover:text-red-300 group-hover:bg-red-50 transition-colors">
            <X size={36} strokeWidth={2} />
          </div>
          <span className="text-[11px] font-bold text-gray-300 group-hover:text-red-300">פחות מתחבר</span>
        </button>

        {/* RIGHT Button = Like (matches right swipe) */}
        <button 
          onClick={() => handleSwipeAction(true)}
          className="flex flex-col items-center gap-2 group active:scale-90 transition-transform"
        >
          <div className="w-[84px] h-[84px] rounded-full flex items-center justify-center bg-emerald-50 text-emerald-400 border border-emerald-100 group-hover:bg-emerald-100 transition-colors shadow-sm">
            <Heart size={44} fill="currentColor" />
          </div>
          <span className="text-[11px] font-bold text-emerald-400">אהבתי</span>
        </button>
      </div>
    </div>
  );
};

export default SwipeCard;
