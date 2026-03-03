/**
 * Sentry Configuration
 * Error monitoring and performance tracking
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [new BrowserTracing()],
    
    // Performance monitoring
    tracesSampleRate: 1.0,
    
    // Error tracking
    beforeSend(event) {
      // Filter out specific errors
      if (shouldIgnoreError(event)) {
        return null;
      }
      return event;
    },
    
    // Environment
    environment: process.env.NODE_ENV,
    
    // Release tracking
    release: process.env.REACT_APP_VERSION,
    
    // User context
    initialScope: {
      tags: {
        platform: 'web',
        network: process.env.REACT_APP_NETWORK_NAME,
      },
    },
  });
}

function shouldIgnoreError(event) {
  const ignorePatterns = [
    /ResizeObserver loop limit exceeded/,
    /Non-Error promise rejection/,
  ];
  
  const errorMessage = event.exception?.values?.[0]?.value || '';
  return ignorePatterns.some(pattern => pattern.test(errorMessage));
}

export function setUserContext(user) {
  Sentry.setUser({
    id: user.address,
    wallet: user.address,
  });
}

export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level);
}

export function startTransaction(name, op = 'navigation') {
  return Sentry.startTransaction({
    name,
    op,
  });
}

export default Sentry;
