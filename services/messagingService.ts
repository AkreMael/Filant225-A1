import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { databaseService } from './databaseService';
import { User } from '../types';

let currentToken: string | null = null;

export const messagingService = {
  getCurrentToken: () => currentToken,

  requestPermission: async (user: User) => {
    if (!messaging) return;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Ensure service worker is registered and ready
        let registration;
        if ('serviceWorker' in navigator) {
          registration = await navigator.serviceWorker.ready;
        }

        const token = await getToken(messaging, {
          vapidKey: 'BD-9TCbxrgpuS2jfxxip1ahWtMLdPOXV9qQVi3MsoxfTO1XAqY9ZEqpDzQDm1GsaJ_pq2JlYyqdMBQacwgjFyVE',
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          currentToken = token;
          console.log('FCM Token:', token);
          await databaseService.saveFCMToken(user, token);
          return token;
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
    }
  },

  onMessageListener: (phone: string) =>
    new Promise((resolve) => {
      if (!messaging) return;
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        
        // Save to local notifications
        if (payload.notification) {
          databaseService.addNotification(phone, {
            title: payload.notification.title || 'Notification',
            message: payload.notification.body || ''
          });
          
          // Show system notification even in foreground
          if (Notification.permission === 'granted') {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(payload.notification?.title || 'Notification', {
                  body: payload.notification?.body || '',
                  icon: '/icon.svg',
                  badge: '/icon.svg',
                  tag: 'foreground-notification',
                });
              });
            } else {
              new Notification(payload.notification?.title || 'Notification', {
                body: payload.notification?.body || '',
                icon: '/icon.svg',
              });
            }
          }
          
          // Trigger a custom event to notify UI components
          window.dispatchEvent(new CustomEvent('new-notification'));
        }
        
        resolve(payload);
      });
    }),
};
