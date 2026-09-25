export type AnalyticsCtaLocation = 'navbar' | 'hero' | 'footer' | 'contact' | 'product' | 'project';
export type AnalyticsEventName =
  | 'whatsapp_click'
  | 'phone_click'
  | 'quote_start'
  | 'quote_submit'
  | 'configurator_complete'
  | 'contact_submit';

export type AnalyticsEventParams = Partial<Record<string, string | number | boolean | undefined>>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function getPagePath() {
  if (typeof window === 'undefined') {
    return '/';
  }

  return window.location.pathname || '/';
}

function sanitizeParams(params: AnalyticsEventParams): Record<string, string | number | boolean> {
  return Object.entries(params).reduce<Record<string, string | number | boolean>>((acc, [key, value]) => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function trackBusinessEvent(eventName: AnalyticsEventName, params: AnalyticsEventParams = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  const gtag = window.gtag;
  if (typeof gtag !== 'function') {
    return;
  }

  gtag('event', eventName, sanitizeParams(params));
}

export function trackWhatsAppClick(ctaLocation: AnalyticsCtaLocation = 'contact') {
  trackBusinessEvent('whatsapp_click', {
    page_path: getPagePath(),
    cta_location: ctaLocation,
  });
}

export function trackPhoneClick(ctaLocation: AnalyticsCtaLocation = 'contact') {
  trackBusinessEvent('phone_click', {
    page_path: getPagePath(),
    cta_location: ctaLocation,
  });
}

export function trackQuoteStart(ctaLocation: AnalyticsCtaLocation = 'navbar') {
  trackBusinessEvent('quote_start', {
    page_path: getPagePath(),
    cta_location: ctaLocation,
  });
}

export function trackQuoteSubmit(params: { page_path?: string; product_category?: string; project_type?: string }) {
  trackBusinessEvent('quote_submit', {
    page_path: params.page_path ?? getPagePath(),
    product_category: params.product_category,
    project_type: params.project_type,
  });
}

export function trackConfiguratorComplete(params: { page_path?: string; product_category?: string }) {
  trackBusinessEvent('configurator_complete', {
    page_path: params.page_path ?? getPagePath(),
    product_category: params.product_category,
  });
}

export function trackContactSubmit(params: { page_path?: string; subject?: string }) {
  trackBusinessEvent('contact_submit', {
    page_path: params.page_path ?? getPagePath(),
    subject: params.subject,
  });
}
