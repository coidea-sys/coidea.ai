/**
 * Performance Monitoring Hook
 * Track Core Web Vitals and custom metrics
 */

import { useEffect, useCallback } from 'react';

export function usePerformanceMonitoring() {
  // Track Core Web Vitals
  useEffect(() => {
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(sendToAnalytics);
        getFID(sendToAnalytics);
        getFCP(sendToAnalytics);
        getLCP(sendToAnalytics);
        getTTFB(sendToAnalytics);
      });
    }
  }, []);

  // Track API latency
  const trackApiCall = useCallback((endpoint, duration) => {
    sendToAnalytics({
      name: 'api-latency',
      value: duration,
      endpoint,
    });
  }, []);

  // Track contract interaction
  const trackContractCall = useCallback((method, gasUsed, duration) => {
    sendToAnalytics({
      name: 'contract-call',
      method,
      gasUsed,
      duration,
    });
  }, []);

  // Track user actions
  const trackAction = useCallback((action, metadata = {}) => {
    sendToAnalytics({
      name: 'user-action',
      action,
      ...metadata,
    });
  }, []);

  return { trackApiCall, trackContractCall, trackAction };
}

function sendToAnalytics(metric) {
  // Send to analytics service
  const body = JSON.stringify(metric);
  
  // Use sendBeacon if available
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/analytics', body);
  } else {
    fetch('/analytics', {
      method: 'POST',
      body,
      keepalive: true,
    }).catch(() => {
      // Silently fail
    });
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', metric);
  }
}

export function usePageView(pageName) {
  useEffect(() => {
    sendToAnalytics({
      name: 'page-view',
      page: pageName,
      timestamp: Date.now(),
    });
  }, [pageName]);
}

export default usePerformanceMonitoring;
