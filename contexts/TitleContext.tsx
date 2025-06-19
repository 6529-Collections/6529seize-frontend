import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/router";

type TitleContextType = {
  title: string;
  setTitle: (title: string) => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  setWaveData: (data: { name: string; newItemsCount: number } | null) => void;
  setStreamHasNewItems: (hasNewItems: boolean) => void;
};

const TitleContext = createContext<TitleContextType | undefined>(undefined);

const DEFAULT_TITLE = process.env.BASE_ENDPOINT?.includes("staging")
  ? "6529 Staging"
  : "6529.io";

// Default titles for routes
const getDefaultTitleForRoute = (pathname: string): string => {
  if (pathname === "/") return "6529.io";
  if (pathname.startsWith("/waves")) return "Waves | Brain";
  if (pathname.startsWith("/my-stream/notifications"))
    return "Notifications | My Stream | Brain";
  if (pathname.startsWith("/my-stream")) return "My Stream | Brain";
  if (pathname.startsWith("/the-memes")) return "The Memes";
  if (pathname.startsWith("/meme-lab")) return "Meme Lab";
  if (pathname.startsWith("/network")) return "Network";
  if (pathname.startsWith("/6529-gradient")) return "6529 Gradient";
  if (pathname.startsWith("/nextgen")) return "NextGen";
  if (pathname.startsWith("/rememes")) return "Rememes";
  if (pathname.startsWith("/open-data")) return "Open Data";
  // Handle profile pages (e.g., /username)
  if (pathname !== "/" && pathname.split("/").length === 2) {
    const segments = pathname.split("/");
    const firstSegment = segments[1];
    // Check if it's not one of the known routes
    const knownRoutes = [
      "waves",
      "my-stream",
      "the-memes",
      "meme-lab",
      "network",
      "6529-gradient",
      "nextgen",
      "rememes",
      "open-data",
      "tools",
      "about",
      "delegation",
    ];
    if (!knownRoutes.includes(firstSegment)) {
      return `Profile | 6529.io`;
    }
  }
  return DEFAULT_TITLE;
};

export const TitleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [title, setTitle] = useState<string>(DEFAULT_TITLE);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [waveData, setWaveData] = useState<{ name: string; newItemsCount: number } | null>(null);
  const [streamHasNewItems, setStreamHasNewItems] = useState(false);
  const routeRef = useRef(router.pathname);
  const queryRef = useRef(router.query);

  // Set initial title on mount
  useEffect(() => {
    const defaultTitle = getDefaultTitleForRoute(router.pathname);
    setTitle(defaultTitle);
  }, []);

  // Update title when route or query changes
  useEffect(() => {
    const pathChanged = routeRef.current !== router.pathname;
    const queryChanged = JSON.stringify(queryRef.current) !== JSON.stringify(router.query);
    
    if (pathChanged) {
      routeRef.current = router.pathname;
      queryRef.current = router.query;
      const defaultTitle = getDefaultTitleForRoute(router.pathname);
      setTitle(defaultTitle);
      // Reset wave data when leaving my-stream
      if (router.pathname !== '/my-stream') {
        setWaveData(null);
        setStreamHasNewItems(false);
      }
    } else if (queryChanged && router.pathname === '/my-stream') {
      queryRef.current = router.query;
      // Reset wave data when navigating between waves or back to stream
      if (!router.query.wave) {
        setWaveData(null);
      }
    }
  }, [router.pathname, router.query]);

  const updateTitle = (newTitle: string) => {
    // Only update if we're still on the same route
    if (routeRef.current === router.pathname) {
      setTitle(newTitle);
    }
  };

  // Compute the title based on current state
  const computedTitle = useMemo(() => {
    if (router.pathname === '/my-stream') {
      if (router.query.wave && waveData) {
        // Wave title
        let newItemsText = '';
        // Only show new items if there are no notifications
        if (waveData.newItemsCount > 0 && notificationCount === 0) {
          const messageText = waveData.newItemsCount === 1 ? 'message' : 'messages';
          newItemsText = `(${waveData.newItemsCount} new ${messageText}) `;
        }
        return `${newItemsText}${waveData.name} | Brain`;
      } else {
        // Main stream title
        // Only show new items if there are no notifications
        const prefix = (streamHasNewItems && notificationCount === 0) ? "(New messages) My Stream" : "My Stream";
        return `${prefix} | Brain`;
      }
    }
    return title;
  }, [router.pathname, router.query.wave, waveData, streamHasNewItems, title, notificationCount]);

  // Add notification count to the final title
  let notificationText = "";
  if (notificationCount === 1) {
    notificationText = "1 notification";
  } else if (notificationCount > 1) {
    notificationText = `${notificationCount} notifications`;
  }
  const finalTitle = notificationText
    ? `(${notificationText}) ${computedTitle}`
    : computedTitle;

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      title: finalTitle,
      setTitle: updateTitle,
      notificationCount,
      setNotificationCount,
      setWaveData,
      setStreamHasNewItems,
    }),
    [finalTitle, notificationCount]
  );

  return (
    <TitleContext.Provider value={contextValue}>
      {children}
    </TitleContext.Provider>
  );
};

export const useTitle = () => {
  const context = useContext(TitleContext);
  if (!context) {
    throw new Error("useTitle must be used within a TitleProvider");
  }
  return context;
};

// Hook to set page title - use this in page components
export const useSetTitle = (pageTitle: string) => {
  const { setTitle } = useTitle();
  const router = useRouter();

  // Set title immediately on mount and when title changes
  useEffect(() => {
    setTitle(pageTitle);
  }, [pageTitle, setTitle, router.pathname]);
};

// Hook to set notification count
export const useSetNotificationCount = (count: number) => {
  const { setNotificationCount } = useTitle();

  useEffect(() => {
    setNotificationCount(count);
  }, [count, setNotificationCount]);
};

// Hook to set wave data for title
export const useSetWaveData = (data: { name: string; newItemsCount: number } | null) => {
  const { setWaveData } = useTitle();

  useEffect(() => {
    setWaveData(data);
  }, [data, setWaveData]);
};

// Hook to set stream new items status
export const useSetStreamHasNewItems = (hasNewItems: boolean) => {
  const { setStreamHasNewItems } = useTitle();

  useEffect(() => {
    setStreamHasNewItems(hasNewItems);
  }, [hasNewItems, setStreamHasNewItems]);
};
