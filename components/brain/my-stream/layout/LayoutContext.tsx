"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import useCapacitor from "@/hooks/useCapacitor";
import type { ReactNode } from "react";
import {
  LAYOUT_VIEWPORT_HEIGHT,
  useViewportLayoutLock,
} from "./useViewportLayoutLock";

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

const NATIVE_KEYBOARD_INSET = "var(--native-keyboard-inset-bottom, 0px)";
const NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION =
  "var(--native-keyboard-layout-transition-duration, 0ms)";

const formatCssLength = (value: number | string): string =>
  typeof value === "number" ? `${value}px` : value;

// Helper function to calculate height style
const calculateHeightStyle = (
  spaces: LayoutSpaces,
  bottomInset: number | string
): React.CSSProperties => {
  const heightCalc = `calc(${LAYOUT_VIEWPORT_HEIGHT} - ${spaces.headerSpace}px - ${spaces.pinnedSpace}px - ${spaces.tabsSpace}px - ${spaces.spacerSpace}px - ${spaces.mobileTabsSpace}px - ${spaces.mobileNavSpace}px - ${formatCssLength(bottomInset)})`;
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

type MeasuredLayoutSpaceKey = Exclude<
  keyof LayoutSpaces,
  "contentSpace" | "measurementsComplete"
>;

const layoutMeasurementConfigs: readonly {
  readonly key: MeasuredLayoutSpaceKey;
  readonly refType: LayoutRefType;
  readonly label: string;
}[] = [
  { key: "headerSpace", refType: "header", label: "header" },
  { key: "pinnedSpace", refType: "pinned", label: "pinned" },
  { key: "tabsSpace", refType: "tabs", label: "tabs" },
  { key: "spacerSpace", refType: "spacer", label: "spacer" },
  { key: "mobileTabsSpace", refType: "mobileTabs", label: "mobile tabs" },
  { key: "mobileNavSpace", refType: "mobileNav", label: "mobile nav" },
];

const measureElementHeight = (
  element: HTMLDivElement | null,
  label: string
): number => {
  if (!element) {
    return 0;
  }

  try {
    return element.getBoundingClientRect().height;
  } catch (error) {
    console.error(`Error measuring ${label} element:`, error);
    return 0;
  }
};

const measureLayoutSpaces = (
  refs: Record<LayoutRefType, HTMLDivElement | null>
): Record<MeasuredLayoutSpaceKey, number> =>
  layoutMeasurementConfigs.reduce(
    (measurements, { key, refType, label }) => ({
      ...measurements,
      [key]: measureElementHeight(refs[refType], label),
    }),
    {
      headerSpace: 0,
      pinnedSpace: 0,
      tabsSpace: 0,
      spacerSpace: 0,
      mobileTabsSpace: 0,
      mobileNavSpace: 0,
    }
  );

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

  // Style for sales view
  salesViewStyle: React.CSSProperties;

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

  // Style for homepage view (excludes header/breadcrumbs, includes tabs)
  homepageFeedStyle: React.CSSProperties;

  // Style for small screen layout (includes header and tabs)
  smallScreenFeedStyle: React.CSSProperties;

  // Style for mobile waves view
  mobileWavesViewStyle: React.CSSProperties;

  // Style for mobile about view
  mobileAboutViewStyle: React.CSSProperties;

  // Keeps the background layout stable while a keyboard-owning overlay is open.
  acquireViewportLock: () => () => void;

  isViewportLocked: boolean;
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

const getStyleSpaces = (spaces: LayoutSpaces): LayoutSpaces =>
  spaces.measurementsComplete ? spaces : defaultSpaces;

// Create context
const LayoutContext = createContext<LayoutContextType>({
  spaces: defaultSpaces,
  registerRef: () => {}, // No-op for default value
  contentContainerStyle: {}, // Empty style object as default
  waveViewStyle: {}, // Empty style object as default
  leaderboardViewStyle: {}, // Empty style object as default
  winnersViewStyle: {}, // Empty style object as default
  salesViewStyle: {}, // Empty style object as default
  myVotesViewStyle: {}, // Empty style object as default
  outcomeViewStyle: {}, // Empty style object as default
  faqViewStyle: {}, // Empty style object as default for FAQ
  notificationsViewStyle: {}, // Empty style object as default
  myStreamFeedStyle: {}, // Empty style object as default
  homepageFeedStyle: {}, // Empty style object as default
  smallScreenFeedStyle: {}, // Empty style object as default
  mobileWavesViewStyle: {}, // Empty style object as default
  mobileAboutViewStyle: {}, // Empty style object as default
  acquireViewportLock: () => () => {},
  isViewportLocked: false,
});

// Provider component
export const LayoutProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isCapacitor } = useCapacitor();
  const { isVisible: isKeyboardVisible } = useNativeKeyboard();

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
  const {
    acquire: acquireViewportLock,
    isLocked: isViewportLocked,
    lockedValue: lockedSpaces,
  } = useViewportLayoutLock(spaces);

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
    const measuredSpaces = measureLayoutSpaces(refMap.current);

    // Calculate total occupied space
    const totalOccupiedSpace = Object.values(measuredSpaces).reduce(
      (totalSpace, measuredSpace) => totalSpace + measuredSpace,
      0
    );

    // Ensure content space is at least 0 to prevent negative values
    const calculatedContentSpace = Math.max(
      0,
      window.innerHeight - totalOccupiedSpace
    );

    const nextSpaces: LayoutSpaces = {
      ...measuredSpaces,
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
    const initialCalculationFrame = requestAnimationFrame(calculateSpaces);

    // Cleanup function
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      cancelAnimationFrame(initialCalculationFrame);
      window.removeEventListener("resize", calculateSpaces);
    };
  }, [calculateSpaces]);

  // Update the ref with the latest calculateSpaces function
  useEffect(() => {
    calculateSpacesRef.current = calculateSpaces;
  }, [calculateSpaces]);

  const effectiveSpaces = lockedSpaces ?? spaces;
  const isNavHiddenForKeyboard = isKeyboardVisible && !isViewportLocked;

  // Calculate the content container style based on header space
  const contentContainerStyle = useMemo(() => {
    const styleSpaces = getStyleSpaces(effectiveSpaces);

    return {
      height: `calc(${LAYOUT_VIEWPORT_HEIGHT} - ${styleSpaces.headerSpace}px - ${styleSpaces.spacerSpace}px)`,
      display: "flex",
    };
  }, [effectiveSpaces]);

  const navAdjustedSpaces = useMemo(() => {
    const styleSpaces = getStyleSpaces(effectiveSpaces);
    return isNavHiddenForKeyboard
      ? { ...styleSpaces, mobileNavSpace: 0 }
      : styleSpaces;
  }, [effectiveSpaces, isNavHiddenForKeyboard]);

  const waveViewStyle = useMemo<React.CSSProperties>(() => {
    const style = calculateHeightStyle(
      navAdjustedSpaces,
      isCapacitor && !isViewportLocked ? NATIVE_KEYBOARD_INSET : 0
    );

    if (isCapacitor && !isViewportLocked) {
      return {
        ...style,
        transition: `height ${NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION} ease-out, max-height ${NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION} ease-out`,
      };
    }
    return style;
  }, [navAdjustedSpaces, isCapacitor, isViewportLocked]);

  const leaderboardViewStyle = useMemo<React.CSSProperties>(() => {
    return calculateHeightStyle(navAdjustedSpaces, 0);
  }, [navAdjustedSpaces]);

  const winnersViewStyle = useMemo<React.CSSProperties>(() => {
    return calculateHeightStyle(navAdjustedSpaces, 0);
  }, [navAdjustedSpaces]);

  const salesViewStyle = useMemo<React.CSSProperties>(() => {
    return calculateHeightStyle(navAdjustedSpaces, 0);
  }, [navAdjustedSpaces]);

  const myVotesViewStyle = useMemo<React.CSSProperties>(() => {
    return calculateHeightStyle(navAdjustedSpaces, 0);
  }, [navAdjustedSpaces]);

  const outcomeViewStyle = useMemo<React.CSSProperties>(() => {
    return calculateHeightStyle(navAdjustedSpaces, 0);
  }, [navAdjustedSpaces]);

  const faqViewStyle = useMemo<React.CSSProperties>(() => {
    return calculateHeightStyle(navAdjustedSpaces, 0);
  }, [navAdjustedSpaces]);

  const notificationsViewStyle = useMemo<React.CSSProperties>(() => {
    const style = calculateHeightStyle(
      { ...navAdjustedSpaces, mobileNavSpace: 0 },
      isCapacitor && !isViewportLocked ? NATIVE_KEYBOARD_INSET : 0
    );

    if (isCapacitor && !isViewportLocked) {
      return {
        ...style,
        transition: `height ${NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION} ease-out, max-height ${NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION} ease-out`,
      };
    }
    return style;
  }, [navAdjustedSpaces, isCapacitor, isViewportLocked]);

  const myStreamFeedStyle = useMemo<React.CSSProperties>(() => {
    return calculateHeightStyle(navAdjustedSpaces, 0);
  }, [navAdjustedSpaces]);

  // Homepage-specific feed style that excludes header/breadcrumb space
  const homepageFeedStyle = useMemo<React.CSSProperties>(() => {
    // For homepage: exclude header and breadcrumb spacer, but include tabs height
    const homepageSpaces = {
      ...navAdjustedSpaces,
      headerSpace: 0, // No header in new homepage layout
      spacerSpace: 0, // No breadcrumb spacer in new homepage layout
    };
    return calculateHeightStyle(homepageSpaces, 0);
  }, [navAdjustedSpaces]);

  // Small screen layout feed style (properly accounts for header)
  const smallScreenFeedStyle = useMemo<React.CSSProperties>(() => {
    const totalOffset =
      navAdjustedSpaces.headerSpace +
      navAdjustedSpaces.pinnedSpace +
      navAdjustedSpaces.tabsSpace +
      navAdjustedSpaces.spacerSpace +
      navAdjustedSpaces.mobileTabsSpace +
      navAdjustedSpaces.mobileNavSpace;
    const heightCalc = `calc(${LAYOUT_VIEWPORT_HEIGHT} - ${totalOffset}px)`;
    return {
      height: heightCalc,
      maxHeight: heightCalc,
    };
  }, [navAdjustedSpaces]);

  const mobileWavesViewStyle = useMemo<React.CSSProperties>(() => {
    return calculateHeightStyle({ ...navAdjustedSpaces, mobileNavSpace: 0 }, 0);
  }, [navAdjustedSpaces]);

  const mobileAboutViewStyle = useMemo<React.CSSProperties>(() => {
    return calculateHeightStyle(navAdjustedSpaces, 0);
  }, [navAdjustedSpaces]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<LayoutContextType>(
    () => ({
      spaces: effectiveSpaces,
      registerRef,
      contentContainerStyle,
      waveViewStyle,
      leaderboardViewStyle,
      winnersViewStyle,
      salesViewStyle,
      myVotesViewStyle,
      outcomeViewStyle,
      faqViewStyle,
      notificationsViewStyle,
      myStreamFeedStyle,
      homepageFeedStyle,
      smallScreenFeedStyle,
      mobileWavesViewStyle,
      mobileAboutViewStyle,
      acquireViewportLock,
      isViewportLocked,
    }),
    [
      effectiveSpaces,
      registerRef,
      contentContainerStyle,
      waveViewStyle,
      leaderboardViewStyle,
      winnersViewStyle,
      salesViewStyle,
      myVotesViewStyle,
      outcomeViewStyle,
      faqViewStyle,
      notificationsViewStyle,
      myStreamFeedStyle,
      homepageFeedStyle,
      smallScreenFeedStyle,
      mobileWavesViewStyle,
      mobileAboutViewStyle,
      acquireViewportLock,
      isViewportLocked,
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

export const useLayoutViewportLock = (isLocked: boolean) => {
  const { acquireViewportLock } = useLayout();

  useLayoutEffect(() => {
    if (!isLocked) return;
    return acquireViewportLock();
  }, [acquireViewportLock, isLocked]);
};
