"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import WaveDeleteModal from "./WaveDeleteModal";

type DeleteFlowState =
  | { readonly status: "idle" }
  | {
      readonly status: "waiting-for-mobile-options" | "open";
      readonly wave: ApiWave;
    };

interface WaveDeleteFlowContextValue {
  readonly requestDelete: (wave: ApiWave) => void;
  readonly completeMobileOptionsLeave: () => void;
}

const WaveDeleteFlowContext = createContext<WaveDeleteFlowContextValue | null>(
  null
);

export function WaveDeleteFlowProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [flow, setFlow] = useState<DeleteFlowState>({ status: "idle" });
  const isMobileLayoutViewport = useIsMobileLayoutViewport();

  if (flow.status === "waiting-for-mobile-options" && !isMobileLayoutViewport) {
    setFlow({ status: "open", wave: flow.wave });
  }

  const requestDelete = useCallback(
    (wave: ApiWave) => {
      setFlow({
        status: isMobileLayoutViewport ? "waiting-for-mobile-options" : "open",
        wave,
      });
    },
    [isMobileLayoutViewport]
  );

  const completeMobileOptionsLeave = useCallback(() => {
    setFlow((current) =>
      current.status === "waiting-for-mobile-options"
        ? { status: "open", wave: current.wave }
        : current
    );
  }, []);

  const value = useMemo<WaveDeleteFlowContextValue>(
    () => ({ requestDelete, completeMobileOptionsLeave }),
    [completeMobileOptionsLeave, requestDelete]
  );

  return (
    <WaveDeleteFlowContext.Provider value={value}>
      {children}
      {flow.status !== "idle" && (
        <WaveDeleteModal
          wave={flow.wave}
          isOpen={flow.status === "open"}
          closeModal={() => setFlow({ status: "idle" })}
        />
      )}
    </WaveDeleteFlowContext.Provider>
  );
}

export function useWaveDeleteFlow(): WaveDeleteFlowContextValue {
  const value = useContext(WaveDeleteFlowContext);

  if (!value) {
    throw new Error(
      "useWaveDeleteFlow must be used within WaveDeleteFlowProvider"
    );
  }

  return value;
}
