import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";

// Define the different spaces that need to be measured
interface LayoutSpaces {
  // Space used by persistent UI elements (header, breadcrumb, etc)
  headerSpace: number;

  // Space used by bottom elements (input area, actions, etc)
  bottomSpace: number;

  // Space used by dynamic elements (pinned waves, etc)
  pinnedSpace: number;

  // Space used by tab elements when present
  tabsSpace: number;

  // Available space for content
  contentSpace: number;

  // Whether measurements have completed
  measurementsComplete: boolean;
}

// Context type definition
interface LayoutContextType {
  // Calculated spaces
  spaces: LayoutSpaces;

  // References to measure elements
  headerRef: React.RefObject<HTMLDivElement>;
  pinnedRef: React.RefObject<HTMLDivElement>;
  tabsRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;

  // Register a component that needs height
  registerHeightDependent: (id: string) => void;

  // Unregister a component
  unregisterHeightDependent: (id: string) => void;
  
  // Version number that increments when height measurements change
  // Components can use this to detect when they should recalculate
  measurementVersion: number;
  
  // Get list of registered height-dependent component IDs
  getDependentComponents: () => Set<string>;
}

// Default context values
const defaultSpaces: LayoutSpaces = {
  headerSpace: 0,
  bottomSpace: 0,
  pinnedSpace: 0,
  tabsSpace: 0,
  contentSpace: 0,
  measurementsComplete: false,
};

// Create context
const LayoutContext = createContext<LayoutContextType>({
  spaces: defaultSpaces,
  headerRef: { current: null },
  pinnedRef: { current: null },
  tabsRef: { current: null },
  bottomRef: { current: null },
  registerHeightDependent: () => {},
  unregisterHeightDependent: () => {},
  measurementVersion: 0,
  getDependentComponents: () => new Set<string>(),
});

// Provider component
export const LayoutProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Refs for measuring elements
  const headerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // State for calculated spaces
  const [spaces, setSpaces] = useState<LayoutSpaces>(defaultSpaces);

  // Track components that depend on height calculations
  const [heightDependentComponents, setHeightDependentComponents] = useState<
    Set<string>
  >(new Set());
  
  // Version counter for measurement changes - increments when measurements change
  const [measurementVersion, setMeasurementVersion] = useState(0);

  // Track element readiness for measurements
  const [elementsReady, setElementsReady] = useState({
    header: false,
    pinned: false,
    tabs: false,
    bottom: false
  });

  // Frame ID for requestAnimationFrame
  const frameIdRef = useRef<number | null>(null);
  
  // Track component mount status to prevent updates after unmount
  const isMountedRef = useRef(true);
  
  // Create an AbortController for reliable cancellation of async operations
  const abortControllerRef = useRef<AbortController>(new AbortController());
  
  // iOS Safari detection
  const isIOSSafari = useRef(false);
  
  // iOS Safari viewport adjustment value - tracks the difference between visual and reported viewport
  const iosViewportAdjustment = useRef(0);
  
  // Function to get the current height-dependent components
  // Memoized to maintain stable identity
  const getDependentComponents = useCallback(() => {
    return heightDependentComponents;
  }, [heightDependentComponents]);

  // Function to register a component that needs height
  // Memoize to maintain stable function identity across renders
  const registerHeightDependent = useCallback((id: string) => {
    setHeightDependentComponents((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  // Function to unregister a component
  // Memoize to maintain stable function identity across renders
  const unregisterHeightDependent = useCallback((id: string) => {
    setHeightDependentComponents((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Function to check if DOM elements are ready for measurement
  const checkRefsReady = useCallback(() => {
    // First pass: check if any updates are needed at all, to avoid unnecessary object creation
    const needsUpdate = 
      (headerRef.current && !elementsReady.header) ||
      (pinnedRef.current && !elementsReady.pinned) ||
      (tabsRef.current && !elementsReady.tabs) ||
      (bottomRef.current && !elementsReady.bottom);
    
    // Skip state update if nothing changed
    if (!needsUpdate) return;

    // If all elements are already marked as ready, avoid the check
    if (elementsReady.header && elementsReady.pinned && 
        elementsReady.tabs && elementsReady.bottom) return;
    
    // Perform batch update with a single state setter call
    setElementsReady(prev => {
      // Create a new state object only if changes exist
      const newState = {...prev};
      let changed = false;
      
      // Check and update each ref status individually
      if (headerRef.current && !prev.header) {
        newState.header = true;
        changed = true;
      }
      
      if (pinnedRef.current && !prev.pinned) {
        newState.pinned = true;
        changed = true;
      }
      
      if (tabsRef.current && !prev.tabs) {
        newState.tabs = true;
        changed = true;
      }
      
      if (bottomRef.current && !prev.bottom) {
        newState.bottom = true;
        changed = true;
      }
      
      // Only return the new state if something actually changed
      // This is a micro-optimization for React's state equality check
      return changed ? newState : prev;
    });
  }, [elementsReady, headerRef, pinnedRef, tabsRef, bottomRef]);
  
  // Check for DOM elements immediately after render
  useLayoutEffect(() => {
    checkRefsReady();
  }, []); 
  
  // Set up continuous monitoring for DOM changes using MutationObserver
  useEffect(() => {
    // Create mutation observer to detect when elements are added/removed
    const mutationObserver = new MutationObserver(() => {
      // When DOM changes, check if our refs are now available
      checkRefsReady();
    });
    
    // Start observing the document for all changes
    mutationObserver.observe(document.body, { 
      childList: true,
      subtree: true,
    });
    
    // Cleanup
    return () => {
      mutationObserver.disconnect();
    };
  }, [checkRefsReady]);
  
  // Notify height-dependent components when measurements change
  useEffect(() => {
    // Skip if no dependent components or measurements aren't complete
    if (heightDependentComponents.size === 0 || !spaces.measurementsComplete) {
      return;
    }
    
    // If we have dependent components, dispatch a custom event that components can listen for
    // This is a lightweight notification mechanism that doesn't require additional renders
    if (isMountedRef.current && spaces.measurementsComplete) {
      // Create a custom event with measurement data
      const event = new CustomEvent('layout-measurements-changed', {
        detail: {
          spaces,
          version: measurementVersion,
          components: Array.from(heightDependentComponents)
        },
        bubbles: false
      });
      
      // Dispatch on window so components can listen from anywhere
      window.dispatchEvent(event);
      
      // Optional: Log for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Layout measurements updated (v${measurementVersion}), ` +
          `notifying ${heightDependentComponents.size} components`
        );
      }
    }
  }, [spaces, measurementVersion, heightDependentComponents]);
  
  // Add special handling for mobile virtual keyboards and other mobile-specific issues
  useEffect(() => {
    // Skip this effect entirely on non-mobile devices
    // This uses a simple but effective check for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;
    
    // Function to trigger layout recalculation
    const triggerRecalculation = () => {
      requestAnimationFrame(() => {
        if (frameIdRef.current !== null) {
          cancelAnimationFrame(frameIdRef.current);
        }
        
        // Request a new calculation
        frameIdRef.current = requestAnimationFrame(() => {
          // Get viewport height
          const viewportHeight = window.innerHeight;
          
          // Update spaces using functional update to avoid dependency
          setSpaces(prevSpaces => {
            // A significant change in viewport height suggests keyboard appearance
            const significantChange = Math.abs(
              (viewportHeight - (prevSpaces.headerSpace + prevSpaces.bottomSpace + 
                prevSpaces.pinnedSpace + prevSpaces.tabsSpace) - prevSpaces.contentSpace)
            ) > 50; // More than 50px difference suggests keyboard
            
            if (significantChange) {
              const totalOccupiedSpace = 
                prevSpaces.headerSpace + prevSpaces.bottomSpace + 
                prevSpaces.pinnedSpace + prevSpaces.tabsSpace;
                
              return {
                ...prevSpaces,
                contentSpace: Math.max(0, viewportHeight - totalOccupiedSpace)
              };
            }
            
            return prevSpaces;
          });
        });
      });
    };
    
    // Collection of event listeners to handle
    const eventListeners: Array<[string, EventListener, EventListenerOptions?]> = [];
    
    // Handle visualViewport API if available (modern solution for keyboard events)
    if (window.visualViewport) {
      const viewportHandler = () => triggerRecalculation();
      window.visualViewport.addEventListener('resize', viewportHandler);
      window.visualViewport.addEventListener('scroll', viewportHandler);
      eventListeners.push(
        ['resize', viewportHandler],
        ['scroll', viewportHandler]
      );
    }
    
    // Handle orientation changes
    const orientationHandler = () => {
      // Delay calculation slightly to allow browser to complete rotation
      setTimeout(triggerRecalculation, 50);
    };
    window.addEventListener('orientationchange', orientationHandler);
    eventListeners.push(['orientationchange', orientationHandler]);
    
    // Listen for focused inputs (potential keyboard triggers)
    const focusHandler = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          (e.target instanceof HTMLElement && e.target.isContentEditable)) {
        
        // For iOS specifically, set up a short interval during input focus
        // iOS often doesn't fire resize events when keyboard appears
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          // Check every 100ms while input is focused
          const keyboardInterval = setInterval(triggerRecalculation, 100);
          
          // Clean up interval when input loses focus
          const blurHandler = () => {
            clearInterval(keyboardInterval);
            e.target?.removeEventListener('blur', blurHandler);
            
            // Delay recalculation to account for keyboard disappearing
            setTimeout(triggerRecalculation, 300);
          };
          
          e.target?.addEventListener('blur', blurHandler);
        } else {
          // For other devices, just trigger once on focus and rely on other events
          triggerRecalculation();
        }
      }
    };
    document.addEventListener('focus', focusHandler, true);
    eventListeners.push(['focus', focusHandler, { capture: true }]);
    
    // Add some additional events that may indicate layout changes
    const genericHandler = () => triggerRecalculation();
    window.addEventListener('deviceorientation', genericHandler);
    document.addEventListener('visibilitychange', genericHandler);
    eventListeners.push(
      ['deviceorientation', genericHandler],
      ['visibilitychange', genericHandler]
    );
    
    // Cleanup function to remove all event listeners
    return () => {
      // Clean up visualViewport listeners if used
      if (window.visualViewport) {
        eventListeners.forEach(([event, handler]) => {
          window.visualViewport?.removeEventListener(event, handler);
        });
      }
      
      // Clean up all other listeners
      eventListeners.forEach(([event, handler, options]) => {
        if (event === 'focus') {
          document.removeEventListener(event, handler, options);
        } else {
          window.removeEventListener(event, handler);
        }
      });
    };
  }, []);

  // Use ResizeObserver to measure elements and calculate spaces
  useEffect(() => {
    // Function to calculate spaces - uses functional state update to avoid space dependency
    const calculateSpaces = () => {
      // Get viewport height with iOS Safari adjustment if needed
      let viewportHeight = window.innerHeight;
      
      // Apply iOS Safari viewport adjustment if detected
      if (isIOSSafari.current) {
        // Apply the calibrated adjustment - this accounts for the iOS Safari UI elements
        viewportHeight -= iosViewportAdjustment.current;
        
        // Extra adjustment for iPhone in landscape mode where toolbar auto-hides
        if (window.orientation !== undefined && Math.abs(window.orientation as number) === 90) {
          // Check if likely in fullscreen mode (toolbar hidden) based on ratio
          const aspectRatio = window.innerWidth / viewportHeight;
          if (aspectRatio > 2) {
            // Add small buffer for landscape fullscreen mode
            viewportHeight -= 20;
          }
        }
      }

      // Default values in case we can't measure
      let headerHeight = 0;
      let pinnedHeight = 0;
      let tabsHeight = 0;
      let bottomHeight = 0;

      // Measure header space if ref exists
      if (headerRef.current) {
        try {
          const rect = headerRef.current.getBoundingClientRect();
          headerHeight = rect.height;
        } catch (e) {
          // Ignore errors during measurement
        }
      }

      // Measure pinned space if ref exists
      if (pinnedRef.current) {
        try {
          const rect = pinnedRef.current.getBoundingClientRect();
          pinnedHeight = rect.height;
        } catch (e) {
          // Ignore errors during measurement
        }
      }

      // Measure tabs space if ref exists
      if (tabsRef.current) {
        try {
          const rect = tabsRef.current.getBoundingClientRect();
          tabsHeight = rect.height;
        } catch (e) {
          // Ignore errors during measurement
        }
      }

      // Measure bottom space if ref exists
      if (bottomRef.current) {
        try {
          const rect = bottomRef.current.getBoundingClientRect();
          bottomHeight = rect.height;
        } catch (e) {
          // Ignore errors during measurement
        }
      }

      // Calculate total occupied space - must include header for calculations
      // Even with the spacer div, components need accurate measurements
      const totalOccupiedSpace =
        headerHeight + pinnedHeight + tabsHeight + bottomHeight;

      // Ensure content space is at least 0 to prevent negative values
      const calculatedContentSpace = Math.max(0, viewportHeight - totalOccupiedSpace);
      
      // Only update state if component is still mounted
      if (isMountedRef.current && !abortControllerRef.current.signal.aborted) {
        // Use functional update to get latest state and avoid dependency on spaces
        setSpaces(prevSpaces => {
          // Avoid unnecessary rerenders by checking if values have changed
          const hasChanged = 
            prevSpaces.headerSpace !== headerHeight ||
            prevSpaces.bottomSpace !== bottomHeight ||
            prevSpaces.pinnedSpace !== pinnedHeight ||
            prevSpaces.tabsSpace !== tabsHeight ||
            prevSpaces.contentSpace !== calculatedContentSpace ||
            !prevSpaces.measurementsComplete;
            
          // Only update state if values have changed
          if (hasChanged) {
            // Since measurements changed, increment the version counter
            // This happens outside the state update to avoid multiple renders
            if (isMountedRef.current) {
              setMeasurementVersion(prev => prev + 1);
            }
            
            return {
              headerSpace: headerHeight,
              bottomSpace: bottomHeight,
              pinnedSpace: pinnedHeight,
              tabsSpace: tabsHeight,
              contentSpace: calculatedContentSpace,
              measurementsComplete: true,
            };
          }
          
          // Return previous state if nothing changed
          return prevSpaces;
        });
      }
    };

    // Handle window resize with debouncing via RAF
    const handleResize = () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
      frameIdRef.current = requestAnimationFrame(calculateSpaces);
    };

    // Feature detection for ResizeObserver
    const resizeObserverSupported = typeof ResizeObserver !== 'undefined';
    
    // Track interval ID for fallback timer
    let intervalId: number | null = null;
    
    // Only set up observers and listeners when elements are ready
    if (elementsReady.header || elementsReady.pinned || elementsReady.tabs || elementsReady.bottom) {
      try {
        if (resizeObserverSupported) {
          // Modern approach: Use ResizeObserver for efficient monitoring
          // Create observer with error-safe callback
          const resizeObserver = new ResizeObserver((entries, observer) => {
            try {
              // Cancel any pending frame to prevent excessive calculations
              if (frameIdRef.current !== null) {
                cancelAnimationFrame(frameIdRef.current);
              }
              // Schedule new calculation on next animation frame
              frameIdRef.current = requestAnimationFrame(calculateSpaces);
            } catch (err) {
              // Handle callback errors - log but don't crash
              console.error("ResizeObserver callback error:", err);
              
              // If we're having persistent errors in the callback, 
              // disconnect and use the fallback approach
              try {
                observer.disconnect();
                // Fall back to window resize listener if callback errors persist
                window.addEventListener("resize", handleResize);
              } catch (disconnectErr) {
                // Ignore disconnect errors
              }
            }
          });
          
          // Set up a global error handler for ResizeObserver loop errors
          // These can occur when observations cause layout shifts that trigger more observations
          const errorHandler = (e: ErrorEvent) => {
            if (e.message && e.message.includes('ResizeObserver loop')) {
              // Prevent the error from breaking the application
              e.stopImmediatePropagation();
              e.preventDefault();
              
              // Delay our calculations to break potential layout loops
              if (frameIdRef.current !== null) {
                cancelAnimationFrame(frameIdRef.current);
              }
              
              // Use a timeout to break the loop and try again later
              setTimeout(() => {
                frameIdRef.current = requestAnimationFrame(calculateSpaces);
              }, 100);
            }
          };
          
          // Add error event listener
          window.addEventListener('error', errorHandler);
          
          // Add to event listeners to be cleaned up
          eventListeners.push(['error', errorHandler]);
          
          // Safely observe elements with individual try/catch blocks
          // This prevents one failure from stopping other observations
          if (headerRef.current) {
            try {
              resizeObserver.observe(headerRef.current);
            } catch (e) {
              console.error("Error observing header element:", e);
            }
          }
          
          if (pinnedRef.current) {
            try {
              resizeObserver.observe(pinnedRef.current);
            } catch (e) {
              console.error("Error observing pinned element:", e);
            }
          }
          
          if (tabsRef.current) {
            try {
              resizeObserver.observe(tabsRef.current);
            } catch (e) {
              console.error("Error observing tabs element:", e);
            }
          }
          
          if (bottomRef.current) {
            try {
              resizeObserver.observe(bottomRef.current);
            } catch (e) {
              console.error("Error observing bottom element:", e);
            }
          }
          
          // Also observe window resize
          window.addEventListener("resize", handleResize);
          
          // Initial calculation using RAF for timing
          frameIdRef.current = requestAnimationFrame(calculateSpaces);
          
          // Cleanup function for ResizeObserver approach
          return () => {
            if (frameIdRef.current !== null) {
              cancelAnimationFrame(frameIdRef.current);
            }
            
            // Remove global error handler if added
            window.removeEventListener('error', errorHandler);
            
            try {
              resizeObserver.disconnect();
            } catch (e) {
              // Ignore errors during cleanup
            }
            
            window.removeEventListener("resize", handleResize);
          };
        } else {
          // Fallback approach: Use window resize + periodic checking
          // Set up window resize event
          window.addEventListener("resize", handleResize);
          
          // Initial calculation
          frameIdRef.current = requestAnimationFrame(calculateSpaces);
          
          // Set up periodic checking (every 500ms) to detect content changes
          // This is less efficient but provides a fallback for older browsers
          intervalId = window.setInterval(() => {
            if (frameIdRef.current !== null) {
              cancelAnimationFrame(frameIdRef.current);
            }
            frameIdRef.current = requestAnimationFrame(calculateSpaces);
          }, 500);
          
          // Add event listeners for DOM changes that might affect layout
          window.addEventListener('scroll', handleResize, { passive: true });
          window.addEventListener('orientationchange', handleResize);
          document.addEventListener('visibilitychange', handleResize);
          
          // Trigger on user interaction that might affect layout
          document.addEventListener('click', handleResize, { passive: true, capture: true });
          
          // Cleanup function for fallback approach
          return () => {
            if (frameIdRef.current !== null) {
              cancelAnimationFrame(frameIdRef.current);
            }
            window.removeEventListener("resize", handleResize);
            window.removeEventListener('scroll', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            document.removeEventListener('visibilitychange', handleResize);
            document.removeEventListener('click', handleResize);
            if (intervalId !== null) {
              clearInterval(intervalId);
            }
          };
        }
      } catch (e) {
        // Handle setup errors by falling back to basic resize handling
        console.error("Error setting up layout observers:", e);
        
        // Minimal fallback - just listen for window resize
        window.addEventListener("resize", handleResize);
        frameIdRef.current = requestAnimationFrame(calculateSpaces);
        
        // Cleanup for minimal fallback
        return () => {
          if (frameIdRef.current !== null) {
            cancelAnimationFrame(frameIdRef.current);
          }
          window.removeEventListener("resize", handleResize);
        };
      }
    }
    
    // Default empty cleanup if elements aren't ready yet
    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [elementsReady]); // Removed spaces dependency, retained error handling

  // Effect for initialization and browser detection
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;
    
    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad OS 13+ detection
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Firefox/.test(ua);
    isIOSSafari.current = iOS && isSafari;
    
    // For iOS Safari, set up special viewport handling
    if (isIOSSafari.current) {
      // Initial calibration for iOS Safari viewport
      calibrateIOSViewport();
      
      // Set up listeners specific to iOS Safari
      window.addEventListener('orientationchange', calibrateIOSViewport);
      window.addEventListener('resize', calibrateIOSViewport);
      
      // Check periodically for viewport changes on iOS
      // This handles cases where the toolbar/address bar appears/disappears
      const iosIntervalId = setInterval(calibrateIOSViewport, 500);
      
      // Return cleanup that includes iOS specific cleanup
      return () => {
        // Mark component as unmounted
        isMountedRef.current = false;
        
        // Abort any pending async operations
        abortControllerRef.current.abort();
        
        // Create a new AbortController for next mount
        abortControllerRef.current = new AbortController();
        
        // Cancel any pending animation frames
        if (frameIdRef.current !== null) {
          cancelAnimationFrame(frameIdRef.current);
          frameIdRef.current = null;
        }
        
        // Clean up iOS Safari specific handlers
        window.removeEventListener('orientationchange', calibrateIOSViewport);
        window.removeEventListener('resize', calibrateIOSViewport);
        clearInterval(iosIntervalId);
      };
    }
    
    // Regular cleanup for non-iOS browsers
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, []);
  
  // Function to handle iOS Safari viewport inconsistencies
  const calibrateIOSViewport = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Create a test element to measure the true visible viewport
    // This technique avoids the iOS Safari viewport reporting issues
    const testElement = document.createElement('div');
    testElement.style.position = 'fixed';
    testElement.style.height = '100vh';
    testElement.style.width = '0';
    testElement.style.top = '0';
    
    // Add to DOM temporarily
    document.documentElement.appendChild(testElement);
    
    // Get the actual visible height vs what iOS Safari reports
    const realViewportHeight = testElement.getBoundingClientRect().height;
    const reportedHeight = window.innerHeight;
    
    // Calculate the adjustment needed
    const adjustment = reportedHeight - realViewportHeight;
    
    // Only update if the adjustment changed significantly
    if (Math.abs(adjustment - iosViewportAdjustment.current) > 20) {
      iosViewportAdjustment.current = adjustment;
      
      // Trigger a recalculation with the new adjustment
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
      frameIdRef.current = requestAnimationFrame(calculateSpaces);
    }
    
    // Remove test element
    document.documentElement.removeChild(testElement);
  }, []);

  // Create context value
  const contextValue: LayoutContextType = {
    spaces,
    headerRef,
    pinnedRef,
    tabsRef,
    bottomRef,
    registerHeightDependent,
    unregisterHeightDependent,
    measurementVersion,
    getDependentComponents,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use the layout context
export const useLayout = () => useContext(LayoutContext);
