"use client";

import { useEffect, useState } from 'react';

/**
 * Aggressive debugger for WalletConnect issues on mobile
 */
export const WalletConnectDebugger = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only run on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    let checkCount = 0;
    
    // Aggressive monitoring - check everything every 500ms
    const monitorInterval = setInterval(() => {
      checkCount++;
      
      // Check for "Continue in MetaMask" text anywhere in the page
      const hasContinueText = document.body.innerText?.includes('Continue in MetaMask');
      const hasMetaMaskText = document.body.innerText?.includes('MetaMask');
      
      if (hasContinueText) {
        alert(`[DEBUG Monitor #${checkCount}] "Continue in MetaMask" screen detected!`);
        
        // Check ALL localStorage keys
        const allKeys = Object.keys(localStorage);
        const wcKeys = allKeys.filter(k => k.toLowerCase().includes('wc') || k.toLowerCase().includes('wallet'));
        
        if (wcKeys.length > 0) {
          alert(`[DEBUG Monitor] Found ${wcKeys.length} wallet-related keys:\n${wcKeys.slice(0, 5).join('\n')}`);
          
          // Check each key for URI-like content
          wcKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value && (value.includes('wc:') || value.includes('bridge') || value.includes('relay'))) {
              alert(`[DEBUG Monitor] Potential URI in ${key}:\n${value.slice(0, 100)}`);
              
              // Try to extract and use the URI
              try {
                // Parse if it's JSON
                let uri = value;
                if (value.startsWith('{')) {
                  const parsed = JSON.parse(value);
                  // Look for URI in various possible locations
                  uri = parsed.uri || parsed.topic || parsed.bridge || parsed.url || value;
                }
                
                if (uri.includes('wc:') || uri.includes('bridge')) {
                  alert('[DEBUG Monitor] Attempting MetaMask deep link with found URI...');
                  
                  // Clean the URI
                  const cleanUri = uri.replace(/^.*?(wc:[^"}\s]+).*$/, '$1');
                  const encodedUri = encodeURIComponent(cleanUri);
                  
                  // Try different deep link formats
                  const deepLinks = [
                    `metamask://wc?uri=${encodedUri}`,
                    `https://metamask.app.link/wc?uri=${encodedUri}`,
                    `metamask://connect?uri=${encodedUri}`,
                    cleanUri // Try raw URI as last resort
                  ];
                  
                  // Try the first deep link
                  alert(`[DEBUG Monitor] Opening: ${deepLinks[0].slice(0, 50)}...`);
                  window.location.href = deepLinks[0];
                  
                  // Clear interval after attempting
                  clearInterval(monitorInterval);
                }
              } catch (e) {
                console.log('Failed to parse:', key, e);
              }
            }
          });
        } else {
          alert('[DEBUG Monitor] No wallet-related keys in localStorage!');
        }
        
        // Also check sessionStorage
        const sessionKeys = Object.keys(sessionStorage);
        const wcSessionKeys = sessionKeys.filter(k => k.toLowerCase().includes('wc') || k.toLowerCase().includes('wallet'));
        if (wcSessionKeys.length > 0) {
          alert(`[DEBUG Monitor] Found ${wcSessionKeys.length} wallet keys in sessionStorage:\n${wcSessionKeys.join('\n')}`);
        }
        
        // Try to find and click any button
        const buttons = document.querySelectorAll('button, [role="button"], a');
        buttons.forEach((btn, index) => {
          const text = (btn as HTMLElement).innerText || '';
          if (text.toLowerCase().includes('open') || text.toLowerCase().includes('connect')) {
            alert(`[DEBUG Monitor] Found button #${index}: "${text}"`);
          }
        });
        
        // Stop checking after finding the screen
        clearInterval(monitorInterval);
        
        // One more aggressive attempt - check for w3m elements
        setTimeout(() => {
          const w3mElements = document.querySelectorAll('[class*="w3m"], [id*="w3m"], w3m-modal, w3m-router');
          if (w3mElements.length > 0) {
            alert(`[DEBUG Monitor] Found ${w3mElements.length} w3m elements (modal components)`);
            
            // Check their shadow roots if they exist
            w3mElements.forEach(el => {
              if ((el as any).shadowRoot) {
                alert('[DEBUG Monitor] Found shadow root in w3m element!');
              }
            });
          }
        }, 1000);
      } else if (hasMetaMaskText && checkCount % 4 === 0) {
        // Every 2 seconds, report if we see MetaMask mentioned
        alert(`[DEBUG Monitor #${checkCount}] MetaMask text visible but not "Continue" screen yet`);
      }
      
      // Stop after 30 seconds
      if (checkCount > 60) {
        alert('[DEBUG Monitor] Stopping monitor after 30 seconds');
        clearInterval(monitorInterval);
      }
    }, 500);

    // Also monitor for any new iframes
    const iframeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME') {
            alert('[DEBUG Monitor] New iframe detected!');
            const iframe = node as HTMLIFrameElement;
            setTimeout(() => {
              try {
                const iframeContent = iframe.contentDocument?.body?.innerText;
                if (iframeContent?.includes('MetaMask')) {
                  alert('[DEBUG Monitor] MetaMask found in iframe!');
                }
              } catch (e) {
                alert('[DEBUG Monitor] Cannot access iframe (cross-origin)');
              }
            }, 500);
          }
        });
      });
    });

    iframeObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      clearInterval(monitorInterval);
      iframeObserver.disconnect();
    };
  }, []);

  return null;
};