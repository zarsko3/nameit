// Firebase Messaging Service Worker
// This runs in the background to receive push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration (must match your app config)
const firebaseConfig = {
  apiKey: "AIzaSyACIl-k-LDaMLHkmDxFjigWsDRjWkIROwE",
  authDomain: "nameit-c440f.firebaseapp.com",
  projectId: "nameit-c440f",
  storageBucket: "nameit-c440f.firebasestorage.app",
  messagingSenderId: "717959116826",
  appId: "1:717959116826:web:be05dc965592f1866db9a3",
  measurementId: "G-K7KHWCB1XL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('📬 Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'יש לכם התאמה! 👶';
  const notificationOptions = {
    body: payload.notification?.body || 'שניכם אהבתם את אותו השם!',
    icon: '/LOGO.png',
    badge: '/LOGO.png',
    tag: 'nameit-match',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'צפייה בהתאמות'
      },
      {
        action: 'dismiss',
        title: 'סגור'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open the app and navigate to matches
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('🚀 FCM Service Worker activated');
});

