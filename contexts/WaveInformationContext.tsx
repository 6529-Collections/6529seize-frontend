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

interface WaveInformationRequest {
  readonly waveId: string;
  readonly overlay: boolean;
  readonly id: string;
  readonly route: string;
}
interface WaveInformationState {
  readonly request: WaveInformationRequest | null;
  readonly open: (waveId: string, overlay?: boolean) => void;
  readonly close: () => void;
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
  const pathname = usePathname();
  const search = useSearchParams();
  const route = `${pathname}?${search.toString()}`;
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
  const [lastRoute, setLastRoute] = useState(route);
  if (lastRoute !== route) {
    setLastRoute(route);
    setStoredRequest(null);
  }
  const request = storedRequest?.route === route ? storedRequest : null;
  const open = useCallback(
    (waveId: string, overlay = true) => {
      if (!overlay) {
        desktopHandler.current?.(waveId);
        return;
      }
      const browserCrypto = (globalThis as { crypto?: Partial<Crypto> }).crypto;
      const id =
        browserCrypto?.randomUUID?.() ??
        `wave-information-${Date.now()}-${++requestSequence.current}`;
      window.history.pushState(
        { ...window.history.state, waveInformation: id },
        "",
        window.location.href
      );
      setStoredRequest({ waveId, overlay, id, route });
    },
    [route]
  );
  const close = useCallback(() => {
    if (
      request?.overlay &&
      (window.history.state as { waveInformation?: unknown } | null)
        ?.waveInformation === request.id
    )
      window.history.back();
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
        // Navigation from About replaces its temporary entry, so Back returns
        // directly to the original view. Keep Next's state and history wrapper.
        let nextState = data;
        if (
          data !== null &&
          typeof data === "object" &&
          "waveInformation" in data &&
          data.waveInformation === request.id
        ) {
          const stateWithoutInformation = { ...data };
          Reflect.deleteProperty(stateWithoutInformation, "waveInformation");
          nextState = stateWithoutInformation;
        }
        originalReplace(nextState, unused, url);
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
      const state = event.state as { waveInformation?: unknown } | null;
      setStoredRequest((current) =>
        current && state?.waveInformation === current.id ? current : null
      );
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);
  const value = useMemo(
    () => ({ request, open, close, registerDesktopHandler }),
    [request, open, close, registerDesktopHandler]
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWaveInformation() {
  return useContext(Context);
}
