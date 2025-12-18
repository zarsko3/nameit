import { useState, useEffect, useCallback, useRef } from 'react';
import { MessagePayload } from 'firebase/messaging';
import {
  initializeMessaging,
  requestNotificationPermission,
  saveFcmToken,
  onForegroundMessage,
  showLocalNotification
} from '../services/notificationService';

interface NotificationState {
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface UseNotificationsReturn extends NotificationState {
  requestPermission: () => Promise<string | null>;
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

  const foregroundUnsubscribeRef = useRef<(() => void) | null>(null);

  const isSupported = typeof window !== 'undefined' && 
    'Notification' in window && 
    'serviceWorker' in navigator &&
    'PushManager' in window;

  // Initialize messaging on mount
  useEffect(() => {
    if (isSupported) {
      initializeMessaging().then(() => {
        console.log('🔔 Messaging initialized in hook');
      });
    }
  }, [isSupported]);

  // Listen for foreground messages when permission is granted
  useEffect(() => {
    if (!isSupported || state.permission !== 'granted') return;

    // Set up foreground message listener
    foregroundUnsubscribeRef.current = onForegroundMessage((payload: MessagePayload) => {
      console.log('📬 Foreground message in hook:', payload);
      
      // Show in-app notification for foreground messages
      if (payload.notification) {
        showLocalNotification(
          payload.notification.title || 'NameIT',
          payload.notification.body || '',
          payload.notification.icon
        );
      }
    });

    return () => {
      if (foregroundUnsubscribeRef.current) {
        foregroundUnsubscribeRef.current();
      }
    };
  }, [isSupported, state.permission]);

  // Request permission and get token
  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: 'Notifications not supported' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        // Save token to Firestore if user is logged in
        if (userId) {
          try {
            await saveFcmToken(userId, token);
            console.log('✅ FCM token saved for user:', userId);
          } catch (saveError) {
            console.error('Failed to save token:', saveError);
          }
        }
        
        setState({
          permission: 'granted',
          token,
          loading: false,
          error: null
        });
        
        return token;
      } else {
        setState(prev => ({
          ...prev,
          permission: Notification.permission,
          loading: false,
          error: Notification.permission === 'denied' ? 'הודעות נחסמו בדפדפן' : null
        }));
        return null;
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'שגיאה בהפעלת התראות'
      }));
      return null;
    }
  }, [userId, isSupported]);

  // Auto-request token if permission already granted
  useEffect(() => {
    if (isSupported && Notification.permission === 'granted' && !state.token && userId && !state.loading) {
      console.log('🔔 Auto-requesting token for user with existing permission');
      requestPermission();
    }
  }, [userId, isSupported, state.token, state.loading, requestPermission]);

  return {
    ...state,
    requestPermission,
    isSupported
  };
};

export default useNotifications;
