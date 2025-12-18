/* eslint-disable no-undef */
/**
 * Firebase Messaging Service Worker
 * 
 * IMPORTANT: This file MUST be in the /public folder for the browser to detect it.
 * It runs in the background to receive push notifications when the app is closed.
 * 
 * Location: public/firebase-messaging-sw.js
 * Accessible at: https://your-domain.com/firebase-messaging-sw.js
 */

// Import Firebase scripts (using compat versions for service worker)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration - MUST match your app's config
const firebaseConfig = {
  apiKey: "AIzaSyACIl-k-LDaMLHkmDxFjigWsDRjWkIROwE",
  authDomain: "nameit-c440f.firebaseapp.com",
  projectId: "nameit-c440f",
  storageBucket: "nameit-c440f.firebasestorage.app",
  messagingSenderId: "717959116826",
  appId: "1:717959116826:web:be05dc965592f1866db9a3",
  measurementId: "G-K7KHWCB1XL"
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = firebase.messaging();

console.log('🔔 Firebase Messaging Service Worker loaded');

/**
 * Handle background messages
 * This is called when the app is in the background or closed
 */
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Background message received:', payload);

  // Extract notification data
  const notificationTitle = payload.notification?.title || 'יש לכם התאמה! 👶';
  const notificationBody = payload.notification?.body || 'שניכם אהבתם את אותו השם!';
  
  // Notification options
  const notificationOptions = {
    body: notificationBody,
    icon: '/LOGO.png',
    badge: '/LOGO.png',
    tag: 'nameit-match-' + Date.now(), // Unique tag to allow multiple notifications
    renotify: true,
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [200, 100, 200, 100, 200], // Vibration pattern
    dir: 'rtl', // Right-to-left for Hebrew
    lang: 'he', // Hebrew language
    data: {
      ...payload.data,
      url: self.location.origin // URL to open when clicked
    },
    actions: [
      {
        action: 'view',
        title: '👀 צפייה'
      },
      {
        action: 'dismiss',
        title: '❌ סגור'
      }
    ]
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click events
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked:', event.action);
  
  // Close the notification
  event.notification.close();

  // Handle different actions
  if (event.action === 'dismiss') {
    return; // Just close
  }

  // Default action or 'view' action - open/focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('🔔 [SW] Focusing existing window');
            return client.focus();
          }
        }
        
        // Open new window if app isn't open
        if (clients.openWindow) {
          console.log('🔔 [SW] Opening new window');
          const urlToOpen = event.notification.data?.url || self.location.origin;
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Handle notification close (dismissed without clicking)
 */
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 [SW] Notification dismissed:', event.notification.tag);
});

/**
 * Service worker installation
 */
self.addEventListener('install', (event) => {
  console.log('🔔 [SW] Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

/**
 * Service worker activation
 */
self.addEventListener('activate', (event) => {
  console.log('🔔 [SW] Service Worker activated');
  // Claim all clients immediately
  event.waitUntil(clients.claim());
});

/**
 * Handle push events directly (fallback)
 */
self.addEventListener('push', (event) => {
  console.log('🔔 [SW] Push event received:', event);
  
  if (!event.data) {
    console.log('🔔 [SW] Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('🔔 [SW] Push payload:', payload);
    
    const title = payload.notification?.title || 'NameIT';
    const options = {
      body: payload.notification?.body || 'יש לך הודעה חדשה',
      icon: '/LOGO.png',
      badge: '/LOGO.png',
      tag: 'nameit-push',
      dir: 'rtl',
      data: payload.data
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('🔔 [SW] Error parsing push data:', error);
  }
});
