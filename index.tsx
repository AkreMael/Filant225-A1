
// Safe localStorage, sessionStorage, and browser API polyfills for WebView / PWA / Android environments
(function() {
  if (typeof window === 'undefined') return;

  // 1. Storage Polyfill
  const createMemoryStorage = (storageName: string) => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string): string | null => {
        try {
          return key in store ? store[key] : null;
        } catch (e) {
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          store[key] = String(value);
        } catch (e) {
          console.warn(`MemoryStorage [${storageName}] failed to setItem:`, e);
        }
      },
      removeItem: (key: string): void => {
        try {
          delete store[key];
        } catch (e) {}
      },
      clear: (): void => {
        store = {};
      },
      get length(): number {
        return Object.keys(store).length;
      },
      key: (index: number): string | null => {
        const keys = Object.keys(store);
        return index >= 0 && index < keys.length ? keys[index] : null;
      }
    };
  };

  // Test and polyfill localStorage
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch (e) {
    console.warn("localStorage is restricted or throws in this WebView environment. Installing safe memory fallback.");
    try {
      Object.defineProperty(window, 'localStorage', {
        value: createMemoryStorage('localStorage'),
        configurable: true,
        writable: true
      });
    } catch (defineErr) {
      console.error("Failed to define custom localStorage wrapper:", defineErr);
    }
  }

  // Test and polyfill sessionStorage
  try {
    const testKey = '__session_test__';
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
  } catch (e) {
    console.warn("sessionStorage is restricted or throws in this WebView environment. Installing safe memory fallback.");
    try {
      Object.defineProperty(window, 'sessionStorage', {
        value: createMemoryStorage('sessionStorage'),
        configurable: true,
        writable: true
      });
    } catch (defineErr) {
      console.error("Failed to define custom sessionStorage wrapper:", defineErr);
    }
  }

  // 2. Notification Guard Polyfill
  if (typeof window.Notification === 'undefined') {
    (window as any).Notification = {
      permission: 'denied',
      requestPermission: async () => 'denied',
    };
  }

  // 3. Global Exception Shield
  window.addEventListener('error', (event) => {
    console.error("Shielded Uncaught Runtime Error:", event.error || event.message);
    // Return true or preventDefault if we want to swallow completely, 
    // but logging is helpful for debug. We prevent app-wide hard crash where possible.
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.warn("Shielded Unhandled Promise Rejection:", event.reason);
    event.preventDefault(); // Prevent crash
  });
})();

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

root.render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);
