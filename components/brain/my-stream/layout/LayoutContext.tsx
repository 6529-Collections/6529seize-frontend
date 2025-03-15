import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';

// Define the different spaces that need to be measured
interface LayoutSpaces {
  // Space used by persistent UI elements (header, breadcrumb, tabs, etc)
  headerSpace: number;
  
  // Space used by bottom elements (input area, actions, etc)
  bottomSpace: number;
  
  // Space used by dynamic elements (pinned waves, etc)
  pinnedSpace: number;
  
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
  contentSpace: 0,
  measurementsComplete: false,
};

// Create context
const LayoutContext = createContext<LayoutContextType>({
  spaces: defaultSpaces,
  headerRef: { current: null },
  pinnedRef: { current: null },
  bottomRef: { current: null },
  registerHeightDependent: () => {},
  unregisterHeightDependent: () => {},
});

// Provider component
export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Refs for measuring elements
  const headerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
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
      
      // Measure bottom space if ref exists
      if (bottomRef.current) {
        const rect = bottomRef.current.getBoundingClientRect();
        bottomHeight = rect.height;
      }
      
      // Calculate total occupied space - must include header for calculations
      // Even with the spacer div, components need accurate measurements
      const totalOccupiedSpace = headerHeight + pinnedHeight + bottomHeight;
      
      // Calculate content space based on all measurements
      // This ensures proper height calculation for nested components
      const calculatedContentSpace = Math.max(viewportHeight - totalOccupiedSpace, 300);
      
      // Log the measurements for debugging
      console.log('[LayoutContext] Space calculations:', {
        viewportHeight,
        headerHeight,
        pinnedHeight,
        bottomHeight,
        totalOccupiedSpace,
        calculatedContentSpace
      });
      
      // Update state with calculated spaces
      setSpaces({
        headerSpace: headerHeight,
        bottomSpace: bottomHeight,
        pinnedSpace: pinnedHeight,
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