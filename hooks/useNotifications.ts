import { useState, useEffect, useCallback } from 'react';
import { MessagePayload } from 'firebase/messaging';
import {
  initializeMessaging,
  requestNotificationPermission,
  saveFcmToken,
  onForegroundMessage
} from '../services/notificationService';

interface NotificationState {
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface UseNotificationsReturn extends NotificationState {
  requestPermission: () => Promise<void>;
  isSupported: boolean;
}

/**
 * Hook to manage push notification permissions and tokens
 */
export const useNotifications = (userId: string | null): UseNotificationsReturn => {
  const [state, setState] = useState<NotificationState>({
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    token: null,
    loading: false,
    error: null
  });

  const isSupported = typeof window !== 'undefined' && 
    'Notification' in window && 
    'serviceWorker' in navigator;

  // Initialize messaging on mount
  useEffect(() => {
    if (isSupported) {
      initializeMessaging();
    }
  }, [isSupported]);

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported || state.permission !== 'granted') return;

    const unsubscribe = onForegroundMessage((payload: MessagePayload) => {
      // Show a custom in-app notification for foreground messages
      if (payload.notification) {
        // You can customize this to show an in-app toast instead
        new Notification(payload.notification.title || 'NameIT', {
          body: payload.notification.body,
          icon: '/LOGO.png',
          tag: 'nameit-foreground'
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSupported, state.permission]);

  // Request permission and get token
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Notifications not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        // Save token to Firestore if user is logged in
        if (userId) {
          await saveFcmToken(userId, token);
        }
        
        setState({
          permission: 'granted',
          token,
          loading: false,
          error: null
        });
      } else {
        setState(prev => ({
          ...prev,
          permission: Notification.permission,
          loading: false,
          error: Notification.permission === 'denied' ? 'הודעות נחסמו' : null
        }));
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'שגיאה בהפעלת התראות'
      }));
    }
  }, [userId, isSupported]);

  // Auto-request if already granted
  useEffect(() => {
    if (isSupported && Notification.permission === 'granted' && !state.token && userId) {
      requestPermission();
    }
  }, [userId, isSupported, state.token, requestPermission]);

  return {
    ...state,
    requestPermission,
    isSupported
  };
};

export default useNotifications;

