import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for Expo Push Notifications
 * 
 * IMPORTANT: This hook is designed for React Native/Expo apps.
 * To use in a web app, you'll need to:
 * 1. Install expo-notifications: npx expo install expo-notifications
 * 2. Use this hook in your React Native app
 * 3. The token registration will work in React Native
 * 
 * For web apps, use Firebase Cloud Messaging instead (see useNotifications.ts)
 */

interface UseExpoPushNotificationsReturn {
  token: string | null;
  loading: boolean;
  error: string | null;
  registerForPushNotificationsAsync: () => Promise<string | null>;
}

/**
 * Register for push notifications and get Expo push token
 * 
 * NOTE: This function requires React Native/Expo environment.
 * It will not work in a web browser.
 * 
 * To use:
 * 1. Install: npx expo install expo-notifications
 * 2. Import: import * as Notifications from 'expo-notifications';
 * 3. Call this function in your React Native component
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  // Check if we're in a React Native environment
  if (typeof window === 'undefined' || !('navigator' in window)) {
    console.warn('⚠️ Expo push notifications require React Native environment');
    return null;
  }

  try {
    // Dynamic import to avoid errors in web environment
    const Notifications = await import('expo-notifications');
    
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('🔕 Push notification permission denied');
      return null;
    }

    console.log('🔔 Push notification permission granted');

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID, // Set in app.json or environment
    });

    const token = tokenData.data;
    console.log('🔑 Expo Push Token obtained:', token.substring(0, 30) + '...');
    
    return token;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Hook to manage Expo push notification registration
 * 
 * Usage in React Native:
 * const { token, registerForPushNotificationsAsync } = useExpoPushNotifications(userId);
 * 
 * Then call registerForPushNotificationsAsync() and save the token to Firestore
 */
export const useExpoPushNotifications = (userId: string | null): UseExpoPushNotificationsReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const expoToken = await registerForPushNotificationsAsync();
      
      if (expoToken && userId) {
        // Save token to Firestore
        try {
          const { saveExpoPushToken } = await import('../services/expoPushNotificationService');
          await saveExpoPushToken(userId, expoToken);
          setToken(expoToken);
          console.log('✅ Expo push token saved for user:', userId);
        } catch (saveError) {
          console.error('Failed to save token:', saveError);
          setError('Failed to save push token');
        }
      }
      
      setLoading(false);
      return expoToken;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register for push notifications');
      setLoading(false);
      return null;
    }
  }, [userId]);

  // Auto-register on mount if in React Native environment
  useEffect(() => {
    // Only auto-register in React Native (check for expo-notifications availability)
    if (userId && typeof window !== 'undefined' && !token && !loading) {
      // Check if expo-notifications is available
      import('expo-notifications')
        .then(() => {
          // Expo is available, auto-register
          register();
        })
        .catch(() => {
          // Expo not available (web environment), skip silently
          // This is expected for web apps
        });
    }
  }, [userId, token, loading, register]);

  return {
    token,
    loading,
    error,
    registerForPushNotificationsAsync: register,
  };
};

export default useExpoPushNotifications;
