import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRouter as useNavRouter } from "next/navigation";

interface NavigationHistory {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  goBack: () => void;
  goForward: () => void;
  refresh: () => void;
}

// DEBUG LOGGER
const DEBUG_NAV = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_NAV === "true";
const dlog = (...args: unknown[]): void => {
  if (DEBUG_NAV) console.log("[useNavigationHistory]", ...args);
};

export const useNavigationHistory = (): NavigationHistory => {
  const router = useRouter();
  const navRouter = useNavRouter();

  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);

  const [backIndex, setBackIndex] = useState<number>(() => {
    return parseInt(sessionStorage.getItem("backIndex") ?? "-1");
  });
  const [forwardIndex, setForwardIndex] = useState<number>(() => {
    return parseInt(sessionStorage.getItem("forwardIndex") ?? "0");
  });

  const [isGoingBack, setIsGoingBack] = useState<boolean>(() => {
    return sessionStorage.getItem("isGoingBack") === "true";
  });
  const [isGoingForward, setIsGoingForward] = useState<boolean>(() => {
    return sessionStorage.getItem("isGoingForward") === "true";
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dlog("pathname effect", { pathname: router.pathname, backIndex, forwardIndex, isGoingBack, isGoingForward });
    if (isGoingBack) {
      setIsGoingBack(false);
      sessionStorage.setItem("isGoingBack", "false");
      setBackIndex(backIndex - 1);
      setForwardIndex(forwardIndex + 1);
    } else if (isGoingForward) {
      setIsGoingForward(false);
      sessionStorage.setItem("isGoingForward", "false");
      setBackIndex(backIndex + 1);
      setForwardIndex(forwardIndex - 1);
    } else {
      setForwardIndex(0);
      setBackIndex(backIndex + 1);
    }
  }, [router.pathname]);

  useEffect(() => {
    setCanGoBack(backIndex > 0);
    setCanGoForward(forwardIndex > 0);

    sessionStorage.setItem("backIndex", backIndex.toString());
    sessionStorage.setItem("forwardIndex", forwardIndex.toString());
  }, [backIndex, forwardIndex]);

  useEffect(() => {
    const handlePageLoad = () => {
      setIsLoading(false);
    };

    if (document.readyState === "complete") {
      setIsLoading(false);
    } else {
      window.addEventListener("load", handlePageLoad);
    }

    return () => {
      window.removeEventListener("load", handlePageLoad);
    };
  }, []);

  const goBack = () => {
    dlog("goBack", { canGoBack, backIndex });
    if (canGoBack) {
      setIsGoingBack(true);
      sessionStorage.setItem("isGoingBack", "true");
      navRouter.back();
    } else {
      console.log("Cannot go back", backIndex);
    }
  };

  const goForward = () => {
    dlog("goForward", { canGoForward, forwardIndex });
    if (canGoForward) {
      setIsGoingForward(true);
      sessionStorage.setItem("isGoingForward", "true");
      navRouter.forward();
    } else {
      console.log("Cannot go forward", forwardIndex);
    }
  };

  const refresh = () => {
    setIsLoading(true);
    navRouter.refresh();
  };

  return {
    canGoBack,
    canGoForward,
    isLoading,
    goBack,
    goForward,
    refresh,
  };
};
