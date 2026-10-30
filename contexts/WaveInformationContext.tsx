"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { SidebarTab } from "@/components/brain/right-sidebar/BrainRightSidebarTypes";

interface WaveInformationRequest {
  readonly waveId: string;
  readonly overlay: boolean;
  readonly id: string;
  readonly route: string;
  readonly view: string;
  readonly viewTitle?: string;
  readonly tab?: SidebarTab;
  readonly scrollTop?: number;
}
interface WaveInformationHistoryState {
  readonly waveInformation?: unknown;
  readonly waveInformationView?: unknown;
  readonly waveInformationViewTitle?: unknown;
}
interface WaveInformationState {
  readonly request: WaveInformationRequest | null;
  readonly open: (waveId: string, overlay?: boolean) => void;
  readonly close: () => void;
  readonly openSubview: (view: string, title: string) => void;
  readonly back: () => void;
  readonly prepareNavigation: (
    destination: string,
    tab: SidebarTab,
    scrollTop: number
  ) => void;
  readonly returnFromNavigation: (() => void) | null;
  readonly registerDesktopHandler: (
    handler: (waveId: string) => void
  ) => () => void;
}
const Context = createContext<WaveInformationState | null>(null);

export function WaveInformationProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const desktopHandler = useRef<((waveId: string) => void) | null>(null);
  const requestSequence = useRef(0);
  const traversing = useRef(false);
  const pathname = usePathname();
  const search = useSearchParams();
  const route = `${pathname}?${search.toString()}`;
  useEffect(() => {
    // A route change ends any pending traversal owned by the previous sheet.
    traversing.current = false;
  }, [route]);
  const registerDesktopHandler = useCallback(
    (handler: (waveId: string) => void) => {
      desktopHandler.current = handler;
      return () => {
        if (desktopHandler.current === handler) desktopHandler.current = null;
      };
    },
    []
  );
  const [storedRequest, setStoredRequest] =
    useState<WaveInformationRequest | null>(null);
  const navigationReturn = useRef<{
    request: WaveInformationRequest;
    destination: string;
  } | null>(null);
  const [returnDestination, setReturnDestination] = useState<string | null>(
    null
  );
  const [lastRoute, setLastRoute] = useState(route);
  if (lastRoute !== route) {
    setLastRoute(route);
    setStoredRequest((current) => (current?.route === route ? current : null));
  }
  const request = storedRequest?.route === route ? storedRequest : null;
  useEffect(() => {
    const saved = navigationReturn.current;
    if (
      saved &&
      route !== saved.request.route &&
      pathname !== saved.destination
    ) {
      navigationReturn.current = null;
      setReturnDestination(null);
    }
  }, [pathname, route]);
  const prepareNavigation = useCallback(
    (destination: string, tab: SidebarTab, scrollTop: number) => {
      if (!request?.overlay || request.view !== "about") return;
      const next = new URL(destination, window.location.href);
      if (next.origin !== window.location.origin) return;
      navigationReturn.current = {
        request: { ...request, tab, scrollTop },
        destination: next.pathname,
      };
      setReturnDestination(next.pathname);
    },
    [request]
  );
  const returnFromNavigation = useCallback(() => {
    if (traversing.current) return;
    traversing.current = true;
    window.history.back();
  }, []);
  const open = useCallback(
    (waveId: string, overlay = true) => {
      if (traversing.current) return;
      if (!overlay) {
        desktopHandler.current?.(waveId);
        return;
      }
      const browserCrypto = (globalThis as { crypto?: Partial<Crypto> }).crypto;
      const id =
        browserCrypto?.randomUUID?.() ??
        `wave-information-${Date.now()}-${++requestSequence.current}`;
      window.history.pushState(
        {
          ...window.history.state,
          waveInformation: id,
          waveInformationView: "about",
        },
        "",
        window.location.href
      );
      setStoredRequest({ waveId, overlay, id, route, view: "about" });
    },
    [route]
  );
  const openSubview = useCallback(
    (view: string, title: string) => {
      if (!request?.overlay || traversing.current) return;
      const state = window.history.state as WaveInformationHistoryState | null;
      if (
        state?.waveInformation !== request.id ||
        state.waveInformationView !== "about" ||
        view === "about"
      )
        return;
      window.history.pushState(
        {
          ...state,
          waveInformationView: view,
          waveInformationViewTitle: title,
        },
        "",
        window.location.href
      );
      setStoredRequest({ ...request, view, viewTitle: title });
    },
    [request]
  );
  const back = useCallback(() => {
    const state = window.history.state as WaveInformationHistoryState | null;
    if (
      traversing.current ||
      !request?.overlay ||
      state?.waveInformation !== request.id ||
      request.view === "about" ||
      state.waveInformationView !== request.view
    )
      return;
    traversing.current = true;
    window.history.back();
  }, [request]);
  const close = useCallback(() => {
    if (traversing.current) return;
    navigationReturn.current = null;
    setReturnDestination(null);
    const state = window.history.state as WaveInformationHistoryState | null;
    if (request?.overlay && state?.waveInformation === request.id) {
      traversing.current = true;
      // Close dismisses the whole sheet, including its optional subview entry.
      window.history.go(state.waveInformationView !== "about" ? -2 : -1);
    }
    setStoredRequest(null);
  }, [request]);
  useEffect(() => {
    if (!request?.overlay) return;
    const history = window.history;
    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);
    const pushFromInformation = (
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) => {
      const current = new URL(window.location.href);
      const next = new URL(url ?? current, current);
      const leavingView =
        next.origin !== current.origin ||
        next.pathname !== current.pathname ||
        next.search !== current.search;
      const ownsEntry =
        (history.state as { waveInformation?: unknown } | null)
          ?.waveInformation === request.id;
      if (leavingView && ownsEntry) {
        // Keep Next's state and history wrapper while removing sheet metadata
        // from the destination. Ordinary links replace the temporary entry.
        let nextState = data;
        if (
          data !== null &&
          typeof data === "object" &&
          "waveInformation" in data &&
          data.waveInformation === request.id
        ) {
          const stateWithoutInformation = { ...data };
          Reflect.deleteProperty(stateWithoutInformation, "waveInformation");
          Reflect.deleteProperty(
            stateWithoutInformation,
            "waveInformationView"
          );
          Reflect.deleteProperty(
            stateWithoutInformation,
            "waveInformationViewTitle"
          );
          nextState = stateWithoutInformation;
        }
        if (
          navigationReturn.current?.request.id === request.id &&
          navigationReturn.current.destination === next.pathname
        ) {
          // Group inspection retains the sheet visit for app/browser Back.
          originalPush(nextState, unused, url);
        } else {
          originalReplace(nextState, unused, url);
        }
        return;
      }
      originalPush(data, unused, url);
    };
    history.pushState = pushFromInformation;
    return () => {
      if (history.pushState === pushFromInformation)
        history.pushState = originalPush;
    };
  }, [request]);
  useEffect(() => {
    const onBack = (event: PopStateEvent) => {
      traversing.current = false;
      const state = event.state as {
        waveInformation?: unknown;
        waveInformationView?: unknown;
        waveInformationViewTitle?: unknown;
      } | null;
      const saved = navigationReturn.current?.request;
      const currentRoute = `${window.location.pathname}?${new URLSearchParams(window.location.search).toString()}`;
      if (
        saved?.route === currentRoute &&
        state?.waveInformation !== saved.id
      ) {
        navigationReturn.current = null;
        setReturnDestination(null);
      }
      setStoredRequest((current) => {
        const restored =
          saved &&
          state?.waveInformation === saved.id &&
          currentRoute === saved.route
            ? saved
            : current;
        return restored && state?.waveInformation === restored.id
          ? {
              ...restored,
              view:
                typeof state.waveInformationView === "string"
                  ? state.waveInformationView
                  : "about",
              viewTitle:
                typeof state.waveInformationViewTitle === "string"
                  ? state.waveInformationViewTitle
                  : "",
            }
          : null;
      });
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);
  const value = useMemo(
    () => ({
      request,
      open,
      close,
      openSubview,
      back,
      prepareNavigation,
      returnFromNavigation:
        pathname === returnDestination ? returnFromNavigation : null,
      registerDesktopHandler,
    }),
    [
      request,
      open,
      close,
      openSubview,
      back,
      prepareNavigation,
      returnFromNavigation,
      returnDestination,
      pathname,
      registerDesktopHandler,
    ]
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWaveInformation() {
  return useContext(Context);
}
