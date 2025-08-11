"use client";

import { useState, useEffect } from 'react';

/**
 * Manual trigger button for MetaMask on mobile
 * This provides a fallback way to open MetaMask if automatic methods fail
 */
export const ManualMetaMaskTrigger = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [wcUri, setWcUri] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only show on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check for "Continue in MetaMask" text periodically
    const checkInterval = setInterval(() => {
      const hasContinueText = document.body.innerText?.includes('Continue in MetaMask');
      
      if (hasContinueText) {
        setIsVisible(true);
        
        // Look for WC URI
        const allKeys = Object.keys(localStorage);
        for (const key of allKeys) {
          const value = localStorage.getItem(key);
          if (value && (value.includes('wc:') || value.includes('bridge'))) {
            // Try to extract URI
            try {
              if (value.startsWith('wc:')) {
                setWcUri(value);
              } else if (value.includes('wc:')) {
                const match = value.match(/wc:[a-f0-9]+@\d+\?[^"}\s]+/);
                if (match) setWcUri(match[0]);
              }
            } catch (e) {
              console.log('Failed to extract URI:', e);
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);

  const handleManualTrigger = () => {
    alert('[MANUAL] Attempting to open MetaMask...');
    
    if (wcUri) {
      const encodedUri = encodeURIComponent(wcUri);
      const deepLink = `metamask://wc?uri=${encodedUri}`;
      alert(`[MANUAL] Opening with URI: ${deepLink.slice(0, 60)}...`);
      window.location.href = deepLink;
      
      // Try universal link after delay
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          alert('[MANUAL] Trying universal link...');
          window.location.href = `https://metamask.app.link/wc?uri=${encodedUri}`;
        }
      }, 2000);
    } else {
      // Try without URI
      alert('[MANUAL] No URI found, trying basic deep link...');
      window.location.href = 'metamask://';
      
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.location.href = 'https://metamask.app.link';
        }
      }, 2000);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        backgroundColor: '#f6851b',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        textAlign: 'center'
      }}
      onClick={handleManualTrigger}
    >
      🦊 Open MetaMask Manually
      {wcUri && <div style={{ fontSize: '10px', marginTop: '4px' }}>URI found ✓</div>}
    </div>
  );
};