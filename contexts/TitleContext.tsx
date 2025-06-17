import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';

type TitleContextType = {
  title: string;
  setTitle: (title: string) => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
};

const TitleContext = createContext<TitleContextType | undefined>(undefined);

const DEFAULT_TITLE = process.env.BASE_ENDPOINT?.includes('staging') ? '6529 Staging' : '6529.io';

// Default titles for routes
const getDefaultTitleForRoute = (pathname: string): string => {
  if (pathname === '/') return '6529.io';
  if (pathname.startsWith('/waves')) return 'Waves | Brain';
  if (pathname.startsWith('/my-stream/notifications')) return 'Notifications | My Stream | Brain';
  if (pathname.startsWith('/my-stream')) return 'My Stream | Brain';
  if (pathname.startsWith('/the-memes')) return 'The Memes';
  if (pathname.startsWith('/meme-lab')) return 'Meme Lab';
  if (pathname.startsWith('/network')) return 'Network';
  if (pathname.startsWith('/6529-gradient')) return '6529 Gradient';
  if (pathname.startsWith('/nextgen')) return 'NextGen';
  if (pathname.startsWith('/rememes')) return 'Rememes';
  if (pathname.startsWith('/open-data')) return 'Open Data';
  // Handle profile pages (e.g., /username)
  if (pathname !== '/' && pathname.split('/').length === 2) {
    const segments = pathname.split('/');
    const firstSegment = segments[1];
    // Check if it's not one of the known routes
    const knownRoutes = ['waves', 'my-stream', 'the-memes', 'meme-lab', 'network', '6529-gradient', 'nextgen', 'rememes', 'open-data', 'tools', 'about', 'delegation'];
    if (!knownRoutes.includes(firstSegment)) {
      return `Profile | 6529.io`;
    }
  }
  return DEFAULT_TITLE;
};

export const TitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [title, setTitle] = useState<string>(DEFAULT_TITLE);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const routeRef = useRef(router.pathname);

  // Set initial title on mount
  useEffect(() => {
    const defaultTitle = getDefaultTitleForRoute(router.pathname);
    setTitle(defaultTitle);
  }, []);

  // Update title when route changes
  useEffect(() => {
    if (routeRef.current !== router.pathname) {
      routeRef.current = router.pathname;
      const defaultTitle = getDefaultTitleForRoute(router.pathname);
      setTitle(defaultTitle);
    }
  }, [router.pathname]);

  const updateTitle = (newTitle: string) => {
    // Only update if we're still on the same route
    if (routeRef.current === router.pathname) {
      setTitle(newTitle);
    }
  };

  // Compute the final title with notification count
  const finalTitle = notificationCount > 0 ? `(${notificationCount}) ${title}` : title;

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ title: finalTitle, setTitle: updateTitle, notificationCount, setNotificationCount }),
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
    throw new Error('useTitle must be used within a TitleProvider');
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