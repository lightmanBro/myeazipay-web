// Global notification handler to avoid circular dependencies
let globalShowNotification: ((message: string, type: 'error' | 'warning' | 'info' | 'success') => void) | null = null;

export function setGlobalNotification(showNotification: (message: string, type: 'error' | 'warning' | 'info' | 'success') => void) {
  globalShowNotification = showNotification;
}

export function showRateLimitNotification() {
  if (globalShowNotification) {
    globalShowNotification(
      'Rate limit exceeded. Please wait a moment before trying again. Requests are being throttled to prevent this.',
      'warning'
    );
  }
}

