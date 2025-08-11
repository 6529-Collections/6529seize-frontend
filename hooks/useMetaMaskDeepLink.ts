"use client";

import { useEffect } from 'react';
import { useAppKitState } from '@reown/appkit/react';

/**
 * Hook to handle MetaMask deep linking on mobile
 * This intercepts wallet selection and triggers the appropriate deep link
 */
export const useMetaMaskDeepLink = () => {
  const state = useAppKitState();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we're on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;


    // Monitor localStorage for WalletConnect URI when modal is open
    let checkInterval: NodeJS.Timeout | null = null;
    
    if (state.open) {
      alert('[DEBUG DeepLink Hook] Modal is open, monitoring for WC URI...');
      
      checkInterval = setInterval(() => {
        // Check multiple possible storage locations
        const wcUri = 
          localStorage.getItem('wc@2:uri') ||
          localStorage.getItem('wc@2:core:0.3//pairing') ||
          localStorage.getItem('WALLETCONNECT_DEEPLINK_CHOICE');
        
        if (wcUri) {
          alert(`[DEBUG DeepLink Hook] WC URI found: ${wcUri.slice(0, 50)}...`);
          
          // Check if it looks like a valid WC URI
          if (wcUri.includes('wc:') || wcUri.includes('bridge')) {
            clearInterval(checkInterval!);
            
            // If user clicked MetaMask (check DOM for indication)
            const hasMetaMaskText = document.body.textContent?.includes('Continue in MetaMask');
            if (hasMetaMaskText) {
              alert('[DEBUG DeepLink Hook] MetaMask screen detected, attempting deep link...');
              
              const encodedUri = encodeURIComponent(wcUri);
              const deepLink = `metamask://wc?uri=${encodedUri}`;
              
              // Try opening MetaMask
              window.location.href = deepLink;
              
              // Fallback after delay
              setTimeout(() => {
                if (document.visibilityState === 'visible') {
                  window.location.href = `https://metamask.app.link/wc?uri=${encodedUri}`;
                }
              }, 2000);
            }
          }
        }
      }, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [state.open]);
};