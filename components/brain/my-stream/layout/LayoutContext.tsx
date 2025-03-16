import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";

// Define the different spaces that need to be measured
interface LayoutSpaces {
  // Space used by persistent UI elements (header, breadcrumb, etc)
  headerSpace: number;

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
// Define valid ref types for type safety
export type LayoutRefType = 'header' | 'pinned' | 'tabs'

interface LayoutContextType {
  // Calculated spaces
  spaces: LayoutSpaces;

  // References to measure elements (kept for backward compatibility)
  headerRef: React.RefObject<HTMLDivElement>;
  pinnedRef: React.RefObject<HTMLDivElement>;
  tabsRef: React.RefObject<HTMLDivElement>;
  
  // New registration system
  registerRef: (refType: LayoutRefType, element: HTMLDivElement | null) => void;
}

// Default context values
const defaultSpaces: LayoutSpaces = {
  headerSpace: 0,
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
  registerRef: () => {}, // No-op for default value
});

// Provider component
export const LayoutProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Internal ref storage (source of truth) - not exposed directly
  const refMap = useRef<Record<LayoutRefType, HTMLDivElement | null>>({
    header: null,
    pinned: null,
    tabs: null,
  });

  // External refs for backward compatibility
  const headerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Keep track of the ResizeObserver instance
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // State for calculated spaces
  const [spaces, setSpaces] = useState<LayoutSpaces>(defaultSpaces);

  // Create refs for callback functions to solve circular dependency
  const calculateSpacesRef = useRef<() => void>(() => {});
  
  // Registration function for components to register their elements
  const registerRef = useCallback((refType: LayoutRefType, element: HTMLDivElement | null) => {
    // Skip if element is the same (no change)
    if (refMap.current[refType] === element) return;
    
    // Store in our internal map (source of truth)
    refMap.current[refType] = element;
    
    // Update legacy refs for backward compatibility
    if (refType === 'header' && headerRef.current !== element) {
      headerRef.current = element;
    } else if (refType === 'pinned' && pinnedRef.current !== element) {
      pinnedRef.current = element;
    } else if (refType === 'tabs' && tabsRef.current !== element) {
      tabsRef.current = element;
    }
    
    // Handle observer management
    if (resizeObserverRef.current) {
      // Unobserve old element if it exists and isn't the new element
      const oldElement = refMap.current[refType];
      if (oldElement && oldElement !== element) {
        resizeObserverRef.current.unobserve(oldElement);
      }
      
      // Observe new element if it exists
      if (element) {
        resizeObserverRef.current.observe(element);
      }
    }
    
    // Trigger a recalculation using the ref
    requestAnimationFrame(() => calculateSpacesRef.current());
  }, []);

  // Calculate spaces based on current measurements
  const calculateSpaces = useCallback(() => {
    // Default values in case we can't measure
    let headerHeight = 0;
    let pinnedHeight = 0;
    let tabsHeight = 0;

    // Get elements from refMap (source of truth)
    const headerElement = refMap.current.header;
    const pinnedElement = refMap.current.pinned;
    const tabsElement = refMap.current.tabs;

    // Measure header space if element exists
    if (headerElement) {
      try {
        const rect = headerElement.getBoundingClientRect();
        headerHeight = rect.height;
      } catch (e) {
        console.error("Error measuring header element:", e);
      }
    }

    // Measure pinned space if element exists
    if (pinnedElement) {
      try {
        const rect = pinnedElement.getBoundingClientRect();
        pinnedHeight = rect.height;
      } catch (e) {
        console.error("Error measuring pinned element:", e);
      }
    }

    // Measure tabs space if element exists
    if (tabsElement) {
      try {
        const rect = tabsElement.getBoundingClientRect();
        tabsHeight = rect.height;
      } catch (e) {
        console.error("Error measuring tabs element:", e);
      }
    }
    

    // Calculate total occupied space
    const totalOccupiedSpace =
      headerHeight + pinnedHeight + tabsHeight

    // Ensure content space is at least 0 to prevent negative values
    const calculatedContentSpace = Math.max(
      0,
      window.innerHeight - totalOccupiedSpace
    );

    setSpaces({
      headerSpace: headerHeight,
      pinnedSpace: pinnedHeight,
      tabsSpace: tabsHeight,
      contentSpace: calculatedContentSpace,
      measurementsComplete: true,
    });
  }, []);

  // Set up ResizeObserver to monitor elements and recalculate on changes
  useEffect(() => {
    // Create ResizeObserver and store it in the ref
    resizeObserverRef.current = new ResizeObserver(() => {
      requestAnimationFrame(calculateSpaces);
    });
    
    // Observe all existing elements in our refMap
    Object.entries(refMap.current).forEach(([_, element]) => {
      if (element) {
        resizeObserverRef.current?.observe(element);
      }
    });
    
    // For backward compatibility, also observe through the legacy refs
    // This ensures things work during the transition period
    if (headerRef.current) {
      resizeObserverRef.current.observe(headerRef.current);
      // Also register it in our refMap if not already there
      if (!refMap.current.header) {
        refMap.current.header = headerRef.current;
      }
    }
    
    if (pinnedRef.current) {
      resizeObserverRef.current.observe(pinnedRef.current);
      // Also register it in our refMap if not already there
      if (!refMap.current.pinned) {
        refMap.current.pinned = pinnedRef.current;
      }
    }
    
    if (tabsRef.current) {
      resizeObserverRef.current.observe(tabsRef.current);
      // Also register it in our refMap if not already there
      if (!refMap.current.tabs) {
        refMap.current.tabs = tabsRef.current;
      }
    }

    // Also listen for window resize
    window.addEventListener("resize", calculateSpaces);

    // Initial calculation
    calculateSpaces();

    // Cleanup function
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      window.removeEventListener("resize", calculateSpaces);
    };
  }, [calculateSpaces]);
  
  // Update the ref with the latest calculateSpaces function
  useEffect(() => {
    calculateSpacesRef.current = calculateSpaces;
  }, [calculateSpaces]);

  // Create context value
  const contextValue: LayoutContextType = {
    spaces,
    // Provide legacy refs for backward compatibility
    headerRef,
    pinnedRef,
    tabsRef,
    // Provide the new registration function
    registerRef,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use the layout context
export const useLayout = () => useContext(LayoutContext);
