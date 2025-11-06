// iOS-specific authentication state management
// Note: These functions are client-side only and will return safe defaults during SSR
export const iosAuthUtils = {
  // Check if running on iOS
  isIOS: () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  // Check if running in standalone PWA mode
  isStandalone: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  },

  // Backup user state to localStorage for iOS compatibility
  backupUserState: (user: any) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (iosAuthUtils.isIOS()) {
      try {
        localStorage.setItem('propnet_user_backup', JSON.stringify(user));
        localStorage.setItem('propnet_last_auth_check', Date.now().toString());
      } catch (error) {
        console.warn('Failed to backup user state:', error);
      }
    }
  },

  // Restore user state from localStorage if needed
  restoreUserState: () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    if (iosAuthUtils.isIOS()) {
      try {
        const backup = localStorage.getItem('propnet_user_backup');
        const lastCheck = localStorage.getItem('propnet_last_auth_check');
        
        if (backup && lastCheck) {
          const timeDiff = Date.now() - parseInt(lastCheck);
          // Only use backup if it's less than 30 minutes old
          if (timeDiff < 30 * 60 * 1000) {
            return JSON.parse(backup);
          }
        }
      } catch (error) {
        console.warn('Failed to restore user state:', error);
      }
    }
    return null;
  },

  // Clear backup state
  clearBackup: () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (iosAuthUtils.isIOS()) {
      try {
        localStorage.removeItem('propnet_user_backup');
        localStorage.removeItem('propnet_last_auth_check');
      } catch (error) {
        console.warn('Failed to clear backup state:', error);
      }
    }
  },

  // Force session refresh for iOS
  forceSessionRefresh: async () => {
    if (typeof window === 'undefined') return null;
    if (iosAuthUtils.isIOS()) {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.user;
        }
      } catch (error) {
        console.warn('Failed to refresh session:', error);
      }
    }
    return null;
  }
};