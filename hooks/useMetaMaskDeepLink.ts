"use client";

import { useEffect } from 'react';
import { useAppKitState, useAppKitEvents } from '@reown/appkit/react';

/**
 * Hook to handle MetaMask deep linking on mobile
 * This intercepts wallet selection and triggers the appropriate deep link
 */
export const useMetaMaskDeepLink = () => {
  const events = useAppKitEvents();
  const state = useAppKitState();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we're on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Listen for wallet selection events
    const handleWalletSelect = (event: any) => {
      // Debug alert
      alert(`[DEBUG DeepLink] Event detected: ${JSON.stringify(event).slice(0, 200)}`);
      
      // Check if MetaMask was selected
      if (event?.data?.name?.toLowerCase().includes('metamask')) {
        alert('[DEBUG DeepLink] MetaMask selected! Attempting deep link...');
        
        // Try to open MetaMask with deep link
        const wcUri = localStorage.getItem('wc@2:uri');
        if (wcUri) {
          const encodedUri = encodeURIComponent(wcUri);
          const deepLink = `metamask://wc?uri=${encodedUri}`;
          
          alert(`[DEBUG DeepLink] Opening: ${deepLink.slice(0, 50)}...`);
          
          // Attempt to open MetaMask
          window.location.href = deepLink;
          
          // Fallback to universal link after a delay
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              // User is still here, try universal link
              alert('[DEBUG DeepLink] Trying universal link fallback...');
              window.location.href = `https://metamask.app.link/wc?uri=${encodedUri}`;
            }
          }, 1500);
        } else {
          alert('[DEBUG DeepLink] No WC URI found in localStorage');
        }
      }
    };

    // Try to subscribe to events
    try {
      if (events && typeof events.subscribe === 'function') {
        const unsubscribe = events.subscribe(handleWalletSelect);
        return () => unsubscribe();
      }
    } catch (error) {
      console.error('Failed to subscribe to AppKit events:', error);
    }

    // Alternative: Monitor localStorage for WalletConnect URI
    const checkForWcUri = setInterval(() => {
      const wcUri = localStorage.getItem('wc@2:uri');
      if (wcUri && state.open) {
        clearInterval(checkForWcUri);
        alert('[DEBUG DeepLink] WC URI detected in localStorage');
      }
    }, 500);

    return () => clearInterval(checkForWcUri);
  }, [events, state.open]);
};