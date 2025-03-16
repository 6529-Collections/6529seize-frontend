import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

// Define the different spaces that need to be measured
interface LayoutSpaces {
  // Space used by persistent UI elements (header, breadcrumb, etc)
  headerSpace: number;

  // Space used by dynamic elements (pinned waves, etc)
  pinnedSpace: number;

  // Space used by tab elements when present
  tabsSpace: number;
  
  // Space used by spacer elements
  spacerSpace: number;

  // Available space for content
  contentSpace: number;

  // Whether measurements have completed
  measurementsComplete: boolean;
}

// Context type definition
// Define valid ref types for type safety
export type LayoutRefType = 'header' | 'pinned' | 'tabs' | 'spacer'

interface LayoutContextType {
  // Calculated spaces
  spaces: LayoutSpaces;
  
  // Registration system
  registerRef: (refType: LayoutRefType, element: HTMLDivElement | null) => void;
  
  // Pre-calculated styles
  contentContainerStyle: React.CSSProperties;
  chatContainerStyle: React.CSSProperties;
  winnersContainerStyle: React.CSSProperties;
  leaderboardContainerStyle: React.CSSProperties;
}

// Default context values
const defaultSpaces: LayoutSpaces = {
  headerSpace: 0,
  pinnedSpace: 0,
  tabsSpace: 0,
  spacerSpace: 0,
  contentSpace: 0,
  measurementsComplete: false,
};

// Create context
const LayoutContext = createContext<LayoutContextType>({
  spaces: defaultSpaces,
  registerRef: () => {}, // No-op for default value
  contentContainerStyle: {}, // Empty style object as default
  chatContainerStyle: {}, // Empty style object as default
  winnersContainerStyle: {}, // Empty style object as default
  leaderboardContainerStyle: {}, // Empty style object as default
});

// Provider component
export const LayoutProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Internal ref storage (source of truth)
  const refMap = useRef<Record<LayoutRefType, HTMLDivElement | null>>({
    header: null,
    pinned: null,
    tabs: null,
    spacer: null,
  });

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
    
    // Get the previous element before updating
    const previousElement = refMap.current[refType];
    
    // Store in our internal map (source of truth)
    refMap.current[refType] = element;
    
    // Handle observer management
    if (resizeObserverRef.current) {
      // Unobserve old element if it exists and isn't the new element
      if (previousElement) {
        resizeObserverRef.current.unobserve(previousElement);
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
    let spacerHeight = 0;

    // Get elements from refMap (source of truth)
    const headerElement = refMap.current.header;
    const pinnedElement = refMap.current.pinned;
    const tabsElement = refMap.current.tabs;
    const spacerElement = refMap.current.spacer;

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
    
    // Measure spacer element if it exists
    if (spacerElement) {
      try {
        const rect = spacerElement.getBoundingClientRect();
        spacerHeight = rect.height;
      } catch (e) {
        console.error("Error measuring spacer element:", e);
      }
    }

    // Calculate total occupied space
    const totalOccupiedSpace =
      headerHeight + pinnedHeight + tabsHeight + spacerHeight;

    // Ensure content space is at least 0 to prevent negative values
    const calculatedContentSpace = Math.max(
      0,
      window.innerHeight - totalOccupiedSpace
    );

    setSpaces({
      headerSpace: headerHeight,
      pinnedSpace: pinnedHeight,
      tabsSpace: tabsHeight,
      spacerSpace: spacerHeight,
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
    
    // Nothing needed here - we'll observe elements as they're registered

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
  
  // Calculate the content container style based on header space
  const contentContainerStyle = useMemo(() => {
    if (!spaces.measurementsComplete) {
      return {};
    }
    
    return {
      height: `calc(100vh - ${spaces.headerSpace}px - ${spaces.spacerSpace}px)`,
      display: 'flex'
    };
  }, [spaces.measurementsComplete, spaces.headerSpace, spaces.spacerSpace]);
  
  // Calculate the chat container style based on header, pinned, tabs and spacer space
  const chatContainerStyle = useMemo(() => {
    if (!spaces.measurementsComplete) {
      return {};
    }
    
    return {
      height: `calc(100vh - ${spaces.headerSpace}px - ${spaces.pinnedSpace}px - ${spaces.tabsSpace}px - ${spaces.spacerSpace}px)`,
      maxHeight: `calc(100vh - ${spaces.headerSpace}px - ${spaces.pinnedSpace}px - ${spaces.tabsSpace}px - ${spaces.spacerSpace}px)`
    };
  }, [
    spaces.measurementsComplete,
    spaces.headerSpace,
    spaces.pinnedSpace,
    spaces.tabsSpace,
    spaces.spacerSpace
  ]);
  
  // Calculate the winners container style - exact same as chat container for consistency
  const winnersContainerStyle = useMemo(() => {
    if (!spaces.measurementsComplete) {
      return {};
    }
    
    return {
      height: `calc(100vh - ${spaces.headerSpace}px - ${spaces.pinnedSpace}px - ${spaces.tabsSpace}px - ${spaces.spacerSpace}px)`,
      maxHeight: `calc(100vh - ${spaces.headerSpace}px - ${spaces.pinnedSpace}px - ${spaces.tabsSpace}px - ${spaces.spacerSpace}px)`
    };
  }, [
    spaces.measurementsComplete,
    spaces.headerSpace,
    spaces.pinnedSpace,
    spaces.tabsSpace,
    spaces.spacerSpace
  ]);
  
  // Calculate the leaderboard container style - same calculation as chat/winners
  const leaderboardContainerStyle = useMemo(() => {
    if (!spaces.measurementsComplete) {
      return {};
    }
    
    return {
      height: `calc(100vh - ${spaces.headerSpace}px - ${spaces.pinnedSpace}px - ${spaces.tabsSpace}px - ${spaces.spacerSpace}px)`,
      maxHeight: `calc(100vh - ${spaces.headerSpace}px - ${spaces.pinnedSpace}px - ${spaces.tabsSpace}px - ${spaces.spacerSpace}px)`
    };
  }, [
    spaces.measurementsComplete,
    spaces.headerSpace,
    spaces.pinnedSpace,
    spaces.tabsSpace,
    spaces.spacerSpace
  ]);

  // Create context value
  const contextValue: LayoutContextType = {
    spaces,
    registerRef,
    contentContainerStyle,
    chatContainerStyle,
    winnersContainerStyle,
    leaderboardContainerStyle,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use the layout context
export const useLayout = () => useContext(LayoutContext);
