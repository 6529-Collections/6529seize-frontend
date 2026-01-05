/**
 * Browser detection utilities
 * 
 * Functions for detecting browser capabilities and compatibility.
 */

/**
 * Detects the current browser name for targeted compatibility messages
 * @returns The detected browser name
 */
export const detectBrowser = (): string => {
  if (typeof window === 'undefined') return 'Unknown';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.indexOf('firefox') > -1) {
    return 'Firefox';
  } else if (userAgent.indexOf('chrome') > -1) {
    return 'Chrome';
  } else if (userAgent.indexOf('safari') > -1) {
    return 'Safari';
  } else if (userAgent.indexOf('edge') > -1 || userAgent.indexOf('edg') > -1) {
    return 'Edge';
  } else {
    return 'Your browser';
  }
};

/**
 * Checks if the browser supports the necessary APIs for file uploads
 * @returns Object with supported status and reason if not supported
 */
export const isBrowserSupported = (): { supported: boolean; reason?: string | undefined } => {
  if (typeof window === 'undefined') {
    return { supported: true }; // Server-side rendering
  }
  
  // Check for File API support
  if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    return { 
      supported: false, 
      reason: 'Your browser does not support the File API necessary for file uploads.' 
    };
  }
  
  // Check for URL.createObjectURL support
  if (!window.URL || typeof window.URL.createObjectURL !== 'function') {
    return { 
      supported: false, 
      reason: 'Your browser does not support the URL API necessary for file previews.' 
    };
  }
  
  // Check for drag and drop support
  const div = document.createElement('div');
  const hasDragDrop = ('draggable' in div) || 
                      ('ondragstart' in div && 'ondrop' in div);
  
  if (!hasDragDrop) {
    return { 
      supported: true, // Still functional but with limited features
      reason: 'Your browser has limited support for drag and drop. You can still click to select files.'
    };
  }
  
  return { supported: true };
};