/**
 * Sentry Configuration (Placeholder)
 * Error monitoring and performance tracking
 * 
 * Note: Install @sentry/react and @sentry/tracing for full functionality
 * npm install @sentry/react @sentry/tracing
 */

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('Sentry not configured (optional)');
    return;
  }
  
  // Sentry integration placeholder
  console.log('Sentry would be initialized here');
}

export function setUserContext(user) {
  // Placeholder
}

export function captureError(error, context = {}) {
  console.error('Error captured:', error, context);
}

export function captureMessage(message, level = 'info') {
  console.log(`[${level}]`, message);
}

export default { initSentry, captureError, captureMessage };
