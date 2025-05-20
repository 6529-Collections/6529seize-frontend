import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import type { ViewKey, NavItem } from "./navTypes";
import { useRouter } from "next/router";
import { commonApiFetch } from "../../services/api/common-api";
import { ApiWave } from "../../generated/models/ApiWave";

interface ViewContextType {
  activeView: ViewKey | null;
  hardBack: (v: ViewKey) => void;
  handleNavClick: (item: NavItem) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewKey | null>(null);
  const [lastVisitedWave, setLastVisitedWave] = useState<string | null>(null);
  const [lastVisitedDm, setLastVisitedDm] = useState<string | null>(null);

  useEffect(() => {
    const { wave, view } = router.query;

    const getWave = async () => {
      const res = await commonApiFetch<ApiWave>({
        endpoint: `/waves/${wave}`,
      });
      if (!res) {
        return;
      }
      if (res.chat.scope.group?.is_direct_message) {
        setLastVisitedDm(res.id);
      } else {
        setLastVisitedWave(res.id);
      }
    };

    if (wave) {
      setActiveView(null);
      getWave();
    } else if (view) {
      setActiveView(view as ViewKey);
    } else {
      setActiveView(null);
    }
  }, [router.asPath]);

  const handleNavClick = useCallback(
    async (item: NavItem) => {
      if (item.kind === "route") {
        await router.push(item.href, undefined, { shallow: true });
      } else if (item.viewKey === "waves" && lastVisitedWave) {
        await router.push(`/my-stream?wave=${lastVisitedWave}`, undefined, {
          shallow: true,
        });
      } else if (item.viewKey === "waves") {
        await router.push("/my-stream?view=waves", undefined, {
          shallow: true,
        });
      } else if (item.viewKey === "messages" && lastVisitedDm) {
        await router.push(`/my-stream?wave=${lastVisitedDm}`, undefined, {
          shallow: true,
        });
      } else if (item.viewKey === "messages") {
        await router.push("/my-stream?view=messages", undefined, {
          shallow: true,
        });
      }
    },
    [router, lastVisitedWave, lastVisitedDm]
  );

  const hardBack = useCallback(
    (v: ViewKey) => {
      if (v === "messages") {
        setLastVisitedDm(null);
        router.push("/my-stream?view=messages", undefined, {
          shallow: true,
        });
      } else if (v === "waves") {
        setLastVisitedWave(null);
        router.push("/my-stream?view=waves", undefined, { shallow: true });
      }
    },
    [router, setLastVisitedDm, setLastVisitedWave]
  );

  const providerValue = useMemo(
    () => ({ activeView, handleNavClick, hardBack }),
    [activeView, handleNavClick, hardBack]
  );

  return (
    <ViewContext.Provider value={providerValue}>
      {children}
    </ViewContext.Provider>
  );
};

export const useViewContext = (): ViewContextType => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useViewContext must be used within a ViewProvider");
  }
  return context;
};
