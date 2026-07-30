declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = 'G-D9RQP6D4JL';

/**
 * Track page view in Google Analytics
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: pagePath,
      page_title: pageTitle || pagePath,
    });
  }
};

/**
 * Track custom events in Google Analytics
 */
export const trackGAEvent = (
  eventName: string,
  eventParams: Record<string, any> = {}
) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Specific helper events for FILANT°225
 */
export const trackRegistrationEvent = (method: string, city?: string) => {
  trackGAEvent('sign_up', {
    method,
    city,
  });
};

export const trackPaymentEvent = (serviceName: string, amount: string | number) => {
  trackGAEvent('begin_checkout', {
    item_name: serviceName,
    value: typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^\d.]/g, '')) || 0,
    currency: 'XOF',
  });
};

export const trackContactWhatsAppEvent = (source: string) => {
  trackGAEvent('contact_whatsapp', {
    source,
  });
};
