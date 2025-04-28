import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import type { ViewKey } from "./navTypes";
import { useRouter } from "next/router";

interface ViewContextType {
  activeView: ViewKey | null;
  setActiveView: (view: ViewKey | null) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewKey | null>(null);

  useEffect(() => {
    setActiveView(null);
  }, [router.asPath]);

  const providerValue = useMemo(
    () => ({ activeView, setActiveView }),
    [activeView]
  );

  return (
    <ViewContext.Provider value={providerValue}>{children}</ViewContext.Provider>
  );
};

export const useViewContext = (): ViewContextType => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useViewContext must be used within a ViewProvider");
  }
  return context;
};
