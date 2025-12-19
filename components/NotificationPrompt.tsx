import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Check } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';

interface NotificationPromptProps {
  userId: string | null;
  show: boolean;
  onClose: () => void;
}

const NotificationPrompt: React.FC<NotificationPromptProps> = ({ userId, show, onClose }) => {
  const { permission, loading, error, requestPermission, isSupported } = useNotifications(userId);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has already dismissed this prompt
  useEffect(() => {
    const wasDismissed = localStorage.getItem('notification-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setDismissed(true);
    onClose();
  };

  const handleEnable = async () => {
    await requestPermission();
    if (permission === 'granted') {
      onClose();
    }
  };

  // Don't show if not supported, already granted, or dismissed
  if (!show || !isSupported || permission === 'granted' || dismissed) {
    return null;
  }

  // Don't show if permission was denied (browser won't allow asking again)
  if (permission === 'denied') {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[90] animate-fade-up" dir="rtl">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Bell className="text-white" size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">קבלו התראות</h3>
              <p className="text-white/80 text-xs">על התאמות חדשות</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            הפעילו התראות כדי לקבל עדכון מיידי כשיש לכם התאמה חדשה עם בן/בת הזוג!
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <BellOff size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              לא עכשיו
            </button>
            <button
              onClick={handleEnable}
              disabled={loading}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  <span>הפעלה</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;


