"use client";

import type {
  ReactNode} from "react";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import useCapacitor from "@/hooks/useCapacitor";
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard";

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

  // Space used by mobile tabs
  mobileTabsSpace: number;

  // Space used by mobile nav
  mobileNavSpace: number;
  // Available space for content
  contentSpace: number;

  // Whether measurements have completed
  measurementsComplete: boolean;
}

const spacesAreEqual = (a: LayoutSpaces, b: LayoutSpaces) =>
  a.headerSpace === b.headerSpace &&
  a.pinnedSpace === b.pinnedSpace &&
  a.tabsSpace === b.tabsSpace &&
  a.spacerSpace === b.spacerSpace &&
  a.mobileTabsSpace === b.mobileTabsSpace &&
  a.mobileNavSpace === b.mobileNavSpace &&
  a.contentSpace === b.contentSpace &&
  a.measurementsComplete === b.measurementsComplete;

// Helper function to calculate height style
const calculateHeightStyle = (
  spaces: LayoutSpaces,
  capacitorSpace: number // Accept specific space value
): React.CSSProperties => {
  // Use dynamic viewport height to avoid extra space on mobile browsers
  const heightCalc = `calc(100dvh - ${spaces.headerSpace}px - ${spaces.pinnedSpace}px - ${spaces.tabsSpace}px - ${spaces.spacerSpace}px - ${spaces.mobileTabsSpace}px - ${spaces.mobileNavSpace}px - ${capacitorSpace}px)`;
  return {
    height: heightCalc,
    maxHeight: heightCalc,
  };
};

// Context type definition
// Define valid ref types for type safety
type LayoutRefType =
  | "header"
  | "pinned"
  | "tabs"
  | "spacer"
  | "mobileTabs"
  | "mobileNav";

interface LayoutContextType {
  // Calculated spaces
  spaces: LayoutSpaces;

  // Registration system
  registerRef: (refType: LayoutRefType, element: HTMLDivElement | null) => void;

  // Pre-calculated styles for main containers
  contentContainerStyle: React.CSSProperties;

  // Style for chat view
  waveViewStyle: React.CSSProperties;

  // Style for leaderboard view
  leaderboardViewStyle: React.CSSProperties;

  // Style for winners view
  winnersViewStyle: React.CSSProperties;

  // Style for outcome view
  outcomeViewStyle: React.CSSProperties;

  // Style for my votes view
  myVotesViewStyle: React.CSSProperties;

  // Style for FAQ view
  faqViewStyle: React.CSSProperties;

  // Style for notifications view
  notificationsViewStyle: React.CSSProperties;

  // Style for feed view
  myStreamFeedStyle: React.CSSProperties;

  // Style for homepage feed view (excludes header/breadcrumbs, includes tabs)
  homepageFeedStyle: React.CSSProperties;

  // Style for small screen layout feed (includes header and tabs)
  smallScreenFeedStyle: React.CSSProperties;

  // Style for mobile waves view
  mobileWavesViewStyle: React.CSSProperties;

  // Style for mobile about view
  mobileAboutViewStyle: React.CSSProperties;
}

// Default context values
const defaultSpaces: LayoutSpaces = {
  headerSpace: 0,
  pinnedSpace: 0,
  tabsSpace: 0,
  spacerSpace: 0,
  mobileTabsSpace: 0,
  mobileNavSpace: 0,
  contentSpace: 0,
  measurementsComplete: false,
};

// Create context
const LayoutContext = createContext<LayoutContextType>({
  spaces: defaultSpaces,
  registerRef: () => {}, // No-op for default value
  contentContainerStyle: {}, // Empty style object as default
  waveViewStyle: {}, // Empty style object as default
  leaderboardViewStyle: {}, // Empty style object as default
  winnersViewStyle: {}, // Empty style object as default
  myVotesViewStyle: {}, // Empty style object as default
  outcomeViewStyle: {}, // Empty style object as default
  faqViewStyle: {}, // Empty style object as default for FAQ
  notificationsViewStyle: {}, // Empty style object as default
  myStreamFeedStyle: {}, // Empty style object as default
  homepageFeedStyle: {}, // Empty style object as default
  smallScreenFeedStyle: {}, // Empty style object as default
  mobileWavesViewStyle: {}, // Empty style object as default
  mobileAboutViewStyle: {}, // Empty style object as default
});

// Provider component
export const LayoutProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isCapacitor, isAndroid, isIos } = useCapacitor();
  const { isVisible: isKeyboardVisible } = useAndroidKeyboard();

  // Internal ref storage (source of truth)
  const refMap = useRef<Record<LayoutRefType, HTMLDivElement | null>>({
    header: null,
    pinned: null,
    tabs: null,
    spacer: null,
    mobileTabs: null,
    mobileNav: null,
  });

  // Keep track of the ResizeObserver instance
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // State for calculated spaces
  const [spaces, setSpaces] = useState<LayoutSpaces>(defaultSpaces);

  // Create refs for callback functions to solve circular dependency
  const calculateSpacesRef = useRef<() => void>(() => {});

  // Registration function for components to register their elements
  const registerRef = useCallback(
    (refType: LayoutRefType, element: HTMLDivElement | null) => {
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
    },
    []
  );

  // Calculate spaces based on current measurements
  const calculateSpaces = useCallback(() => {
    // Default values in case we can't measure
    let headerHeight = 0;
    let pinnedHeight = 0;
    let tabsHeight = 0;
    let spacerHeight = 0;
    let mobileTabsHeight = 0;
    let mobileNavHeight = 0;
    // Get elements from refMap (source of truth)
    const headerElement = refMap.current.header;
    const pinnedElement = refMap.current.pinned;
    const tabsElement = refMap.current.tabs;
    const spacerElement = refMap.current.spacer;
    const mobileTabsElement = refMap.current.mobileTabs;
    const mobileNavElement = refMap.current.mobileNav;
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

    // Measure mobile tabs element if it exists
    if (mobileTabsElement) {
      try {
        const rect = mobileTabsElement.getBoundingClientRect();
        mobileTabsHeight = rect.height;
      } catch (e) {
        console.error("Error measuring mobile tabs element:", e);
      }
    }

    // Measure mobile nav element if it exists
    if (mobileNavElement) {
      try {
        const rect = mobileNavElement.getBoundingClientRect();
        mobileNavHeight = rect.height;
      } catch (e) {
        console.error("Error measuring mobile nav element:", e);
      }
    }

    // Calculate total occupied space
    const totalOccupiedSpace =
      headerHeight +
      pinnedHeight +
      tabsHeight +
      spacerHeight +
      mobileTabsHeight +
      mobileNavHeight;

    // Ensure content space is at least 0 to prevent negative values
    const calculatedContentSpace = Math.max(
      0,
      window.innerHeight - totalOccupiedSpace
    );

    const nextSpaces: LayoutSpaces = {
      headerSpace: headerHeight,
      pinnedSpace: pinnedHeight,
      tabsSpace: tabsHeight,
      spacerSpace: spacerHeight,
      mobileTabsSpace: mobileTabsHeight,
      mobileNavSpace: mobileNavHeight,
      contentSpace: calculatedContentSpace,
      measurementsComplete: true,
    };

    setSpaces((prevSpaces) =>
      spacesAreEqual(prevSpaces, nextSpaces) ? prevSpaces : nextSpaces
    );
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
      height: `calc(100dvh - ${spaces.headerSpace}px - ${spaces.spacerSpace}px)`,
      display: "flex",
    };
  }, [spaces.measurementsComplete, spaces.headerSpace, spaces.spacerSpace]);

  const waveViewStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};

    let capSpace = 0;

    if (isAndroid) {
      capSpace = isKeyboardVisible ? 0 : 128;
    } else if (isIos) {
      capSpace = 20;
    }

    const adjustedSpaces = { ...spaces, mobileNavSpace: 0 };
    const style = calculateHeightStyle(adjustedSpaces, capSpace);

    if (isAndroid) {
      return {
        ...style,
        transition: "height 75ms ease-out, max-height 75ms ease-out",
      };
    }
    return style;
  }, [spaces, isAndroid, isKeyboardVisible, isIos, isCapacitor]);

  const leaderboardViewStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    return calculateHeightStyle(spaces, 0);
  }, [spaces]);

  const winnersViewStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    return calculateHeightStyle(spaces, 0);
  }, [spaces]);

  const myVotesViewStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    return calculateHeightStyle(spaces, 0);
  }, [spaces]);

  const outcomeViewStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    return calculateHeightStyle(spaces, 0);
  }, [spaces]);

  const faqViewStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    return calculateHeightStyle(spaces, 0);
  }, [spaces]);

  const notificationsViewStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    return calculateHeightStyle(spaces, 0);
  }, [spaces]);

  const myStreamFeedStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    return calculateHeightStyle(spaces, 0);
  }, [spaces]);

  // Homepage-specific feed style that excludes header/breadcrumb space
  const homepageFeedStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    // For homepage: exclude header and breadcrumb spacer, but include tabs height
    const homepageSpaces = {
      ...spaces,
      headerSpace: 0, // No header in new homepage layout
      spacerSpace: 0, // No breadcrumb spacer in new homepage layout
    };
    return calculateHeightStyle(homepageSpaces, 0);
  }, [spaces]);

  // Small screen layout feed style (properly accounts for header)
  const smallScreenFeedStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    const totalOffset =
      spaces.headerSpace +
      spaces.pinnedSpace +
      spaces.tabsSpace +
      spaces.spacerSpace +
      spaces.mobileTabsSpace +
      spaces.mobileNavSpace;
    const heightCalc = `calc(100dvh - ${totalOffset}px)`;
    return {
      height: heightCalc,
      maxHeight: heightCalc,
    };
  }, [spaces]);

  const mobileWavesViewStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    return calculateHeightStyle(spaces, 0);
  }, [spaces]);

  const mobileAboutViewStyle = useMemo<React.CSSProperties>(() => {
    if (!spaces.measurementsComplete) return {};
    return calculateHeightStyle(spaces, 0);
  }, [spaces]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<LayoutContextType>(
    () => ({
      spaces,
      registerRef,
      contentContainerStyle,
      waveViewStyle,
      leaderboardViewStyle,
      winnersViewStyle,
      myVotesViewStyle,
      outcomeViewStyle,
      faqViewStyle,
      notificationsViewStyle,
      myStreamFeedStyle,
      homepageFeedStyle,
      smallScreenFeedStyle,
      mobileWavesViewStyle,
      mobileAboutViewStyle,
    }),
    [
      spaces,
      registerRef,
      contentContainerStyle,
      waveViewStyle,
      leaderboardViewStyle,
      winnersViewStyle,
      myVotesViewStyle,
      outcomeViewStyle,
      faqViewStyle,
      notificationsViewStyle,
      myStreamFeedStyle,
      homepageFeedStyle,
      smallScreenFeedStyle,
      mobileWavesViewStyle,
      mobileAboutViewStyle,
    ]
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use the layout context
export const useLayout = () => useContext(LayoutContext);
