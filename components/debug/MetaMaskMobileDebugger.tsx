"use client";

import { useEffect } from 'react';

/**
 * Debug component to monitor and fix MetaMask mobile connection issues
 */
export const MetaMaskMobileDebugger = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only run on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Monitor DOM for MetaMask button clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const textContent = target.textContent || '';
      const ariaLabel = target.getAttribute('aria-label') || '';
      
      // Check if this is a MetaMask-related click
      if (textContent.toLowerCase().includes('metamask') || 
          ariaLabel.toLowerCase().includes('metamask') ||
          target.closest('[data-testid*="metamask"]')) {
        
        alert('[DEBUG DOM] MetaMask element clicked!');
        
        // Wait a bit for WalletConnect to generate the URI
        setTimeout(() => {
          // Check for WalletConnect URI in various places
          const wcUri = 
            localStorage.getItem('wc@2:uri') ||
            localStorage.getItem('wc@2:client:0.3//session') ||
            sessionStorage.getItem('wc@2:uri');
          
          if (wcUri) {
            alert(`[DEBUG DOM] Found WC URI, attempting deep link...`);
            
            // Extract the actual URI if it's wrapped in JSON
            let uri = wcUri;
            try {
              const parsed = JSON.parse(wcUri);
              if (parsed.uri) uri = parsed.uri;
            } catch {}
            
            const encodedUri = encodeURIComponent(uri);
            
            // Try native deep link first
            const deepLink = `metamask://wc?uri=${encodedUri}`;
            alert(`[DEBUG DOM] Opening: ${deepLink.slice(0, 50)}...`);
            
            // Create a hidden link and click it
            const link = document.createElement('a');
            link.href = deepLink;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Fallback to universal link
            setTimeout(() => {
              if (document.visibilityState === 'visible') {
                alert('[DEBUG DOM] Trying universal link...');
                window.location.href = `https://metamask.app.link/wc?uri=${encodedUri}`;
              }
            }, 2000);
          } else {
            alert('[DEBUG DOM] No WC URI found after MetaMask click');
            
            // Try to find any WC-related data
            const keys = Object.keys(localStorage);
            const wcKeys = keys.filter(k => k.includes('wc'));
            alert(`[DEBUG DOM] WC keys in localStorage: ${wcKeys.join(', ')}`);
          }
        }, 1000);
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleClick, true);

    // Monitor for "Continue in MetaMask" text appearing
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node as HTMLElement;
            if (element.textContent?.includes('Continue in MetaMask')) {
              alert('[DEBUG DOM] "Continue in MetaMask" detected in DOM');
              
              // Find and auto-click the Open button if it exists
              setTimeout(() => {
                const openButton = document.querySelector('button:has([text*="Open"]), button:contains("Open"), [role="button"]:has([text*="Open"])');
                if (openButton) {
                  alert('[DEBUG DOM] Found Open button, clicking it...');
                  (openButton as HTMLElement).click();
                }
              }, 500);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      document.removeEventListener('click', handleClick, true);
      observer.disconnect();
    };
  }, []);

  return null;
};