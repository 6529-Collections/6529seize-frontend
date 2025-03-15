import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';

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
});

// Provider component
export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Refs for measuring elements
  const headerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // State for calculated spaces
  const [spaces, setSpaces] = useState<LayoutSpaces>(defaultSpaces);
  
  // Track components that depend on height calculations
  const [heightDependentComponents, setHeightDependentComponents] = useState<Set<string>>(new Set());
  
  // Function to register a component that needs height
  // Memoize to maintain stable function identity across renders
  const registerHeightDependent = useCallback((id: string) => {
    setHeightDependentComponents(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);
  
  // Function to unregister a component
  // Memoize to maintain stable function identity across renders
  const unregisterHeightDependent = useCallback((id: string) => {
    setHeightDependentComponents(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);
  
  // Use ResizeObserver to measure elements and calculate spaces
  useEffect(() => {
    // Function to calculate spaces
    const calculateSpaces = () => {
      // Get viewport height
      const viewportHeight = window.innerHeight;
      
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
      
      // Calculate total occupied space - must include header for calculations
      // Even with the spacer div, components need accurate measurements
      const totalOccupiedSpace = headerHeight + pinnedHeight + tabsHeight + bottomHeight;
      
      // Calculate content space based on all measurements
      // This ensures proper height calculation for nested components
      const calculatedContentSpace = Math.max(viewportHeight - totalOccupiedSpace, 300);
      
      // Log the measurements for debugging
      console.log('[LayoutContext] Space calculations:', {
        viewportHeight,
        headerHeight,
        pinnedHeight,
        tabsHeight,
        bottomHeight,
        totalOccupiedSpace,
        calculatedContentSpace
      });
      
      // Update state with calculated spaces
      setSpaces({
        headerSpace: headerHeight,
        bottomSpace: bottomHeight,
        pinnedSpace: pinnedHeight,
        tabsSpace: tabsHeight,
        contentSpace: calculatedContentSpace,
        measurementsComplete: true,
      });
    };
    
    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      calculateSpaces();
    });
    
    // Observe elements
    if (headerRef.current) resizeObserver.observe(headerRef.current);
    if (pinnedRef.current) resizeObserver.observe(pinnedRef.current);
    if (tabsRef.current) resizeObserver.observe(tabsRef.current);
    if (bottomRef.current) resizeObserver.observe(bottomRef.current);
    
    // Also observe window resize
    window.addEventListener('resize', calculateSpaces);
    
    // Initial calculation
    calculateSpaces();
    
    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateSpaces);
    };
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
  };
  
  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use the layout context
export const useLayout = () => useContext(LayoutContext);