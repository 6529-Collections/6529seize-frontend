"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";

type ScrollHandler = (serialNo: number) => void;

interface ScrollRequest {
  readonly waveId: string;
  readonly serialNo: number;
}

interface RegisteredHandler {
  readonly waveId: string;
  readonly handler: ScrollHandler;
}

interface WaveChatScrollContextValue {
  readonly requestScrollToSerialNo: (request: ScrollRequest) => void;
  readonly registerScrollHandler: (registration: RegisteredHandler) => () => void;
}

const WaveChatScrollContext = createContext<WaveChatScrollContextValue | null>(
  null
);

export function WaveChatScrollProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const registeredHandlerRef = useRef<RegisteredHandler | null>(null);
  const pendingRequestRef = useRef<ScrollRequest | null>(null);

  const requestScrollToSerialNo = useCallback((request: ScrollRequest) => {
    const registered = registeredHandlerRef.current;
    if (registered && registered.waveId === request.waveId) {
      registered.handler(request.serialNo);
      return;
    }
    pendingRequestRef.current = request;
  }, []);

  const registerScrollHandler = useCallback(
    (registration: RegisteredHandler) => {
      registeredHandlerRef.current = registration;

      const pending = pendingRequestRef.current;
      if (pending && pending.waveId === registration.waveId) {
        pendingRequestRef.current = null;
        registration.handler(pending.serialNo);
      }

      return () => {
        const current = registeredHandlerRef.current;
        if (
          current &&
          current.waveId === registration.waveId &&
          current.handler === registration.handler
        ) {
          registeredHandlerRef.current = null;
        }
      };
    },
    []
  );

  const value = useMemo<WaveChatScrollContextValue>(
    () => ({
      requestScrollToSerialNo,
      registerScrollHandler,
    }),
    [requestScrollToSerialNo, registerScrollHandler]
  );

  return (
    <WaveChatScrollContext.Provider value={value}>
      {children}
    </WaveChatScrollContext.Provider>
  );
}

export function useWaveChatScrollOptional() {
  return useContext(WaveChatScrollContext);
}

