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

  // Create context value - now much simpler with just refs and spaces
  const contextValue: LayoutContextType = {
    spaces,
    headerRef,
    pinnedRef,
    tabsRef,
    bottomRef,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use the layout context
export const useLayout = () => useContext(LayoutContext);