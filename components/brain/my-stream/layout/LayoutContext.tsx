import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  CSSProperties,
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

  // Calculated style for the content container
  contentContainerStyle: CSSProperties;
  
  // Calculated style for the wave chat container (reads tabsRef internally)
  getWaveChatStyle: () => CSSProperties;
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
  contentContainerStyle: {},
  getWaveChatStyle: () => ({}),
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

  // Calculate spaces based on current measurements
  const calculateSpaces = useCallback(() => {
    // Default values in case we can't measure
    let headerHeight = 0;
    let pinnedHeight = 0;
    let tabsHeight = 0;
    let bottomHeight = 0;

    // Measure header space if ref exists
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      headerHeight = rect.height;
    }

    // Measure pinned space if ref exists
    if (pinnedRef.current) {
      const rect = pinnedRef.current.getBoundingClientRect();
      pinnedHeight = rect.height;
    }

    // Measure tabs space if ref exists
    if (tabsRef.current) {
      const rect = tabsRef.current.getBoundingClientRect();
      tabsHeight = rect.height;
    }

    // Measure bottom space if ref exists
    if (bottomRef.current) {
      const rect = bottomRef.current.getBoundingClientRect();
      bottomHeight = rect.height;
    }

    // Calculate total occupied space
    const totalOccupiedSpace =
      headerHeight + pinnedHeight + tabsHeight + bottomHeight;

    // Ensure content space is at least 0 to prevent negative values
    const calculatedContentSpace = Math.max(
      0,
      window.innerHeight - totalOccupiedSpace
    );

    setSpaces({
      headerSpace: headerHeight,
      bottomSpace: bottomHeight,
      pinnedSpace: pinnedHeight,
      tabsSpace: tabsHeight,
      contentSpace: calculatedContentSpace,
      measurementsComplete: true,
    });
  }, []);

  // Set up ResizeObserver to monitor elements and recalculate on changes
  useEffect(() => {
    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(calculateSpaces);
    });

    // Observe relevant elements if they exist
    if (headerRef.current) resizeObserver.observe(headerRef.current);
    if (pinnedRef.current) resizeObserver.observe(pinnedRef.current);
    if (tabsRef.current) resizeObserver.observe(tabsRef.current);
    if (bottomRef.current) resizeObserver.observe(bottomRef.current);

    // Also listen for window resize
    window.addEventListener("resize", calculateSpaces);

    // Initial calculation
    calculateSpaces();

    // Cleanup function
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateSpaces);
    };
  }, [calculateSpaces]);

  // Calculate content container style using the calculated spaces
  const contentContainerStyle = useMemo(() => {
    if (!spaces.measurementsComplete) {
      // Default fallback if measurements aren't complete yet
      return {};
    }
    
    // Set explicit height that accounts for header
    // This container will establish the height constraint for all children
    const height = `calc(100vh - ${spaces.headerSpace}px)`;
    
    // Use flexbox display to create proper flow
    const display = 'flex';
    
    return { height, display };
  }, [spaces.measurementsComplete, spaces.headerSpace]);

  // Function to get wave chat container style - now uses tabsRef directly
  const getWaveChatStyle = useCallback(() => {
    // If measurements are complete
    if (spaces.measurementsComplete) {
      // If we have tabs, use their height
      if (tabsRef.current) {
        const tabsHeight = tabsRef.current.getBoundingClientRect().height;
        if (tabsHeight > 0) {
          return {
            height: `calc(100% - ${tabsHeight}px)`,
            maxHeight: `calc(100% - ${tabsHeight}px)`
          };
        }
      }
      
      // Otherwise use contentSpace directly
      return {
        height: spaces.contentSpace,
        maxHeight: spaces.contentSpace
      };
    }
    
    // Return empty object if measurements aren't complete
    return {};
  }, [spaces.measurementsComplete, spaces.contentSpace, tabsRef]);

  // Create context value
  const contextValue: LayoutContextType = {
    spaces,
    headerRef,
    pinnedRef,
    tabsRef,
    bottomRef,
    contentContainerStyle,
    getWaveChatStyle,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use the layout context
export const useLayout = () => useContext(LayoutContext);
