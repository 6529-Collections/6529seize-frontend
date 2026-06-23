"use client";

import React, { createContext, useContext, useMemo } from "react";

type WaveDropLayerContextValue = {
  readonly desktopActionsZIndexClassName: string;
  readonly mobileMenuZIndexClassName: string;
  readonly mobileDialogZIndexClassName: string;
};

const DEFAULT_WAVE_DROP_LAYER_CONTEXT: WaveDropLayerContextValue = {
  desktopActionsZIndexClassName: "tw-z-40",
  mobileMenuZIndexClassName: "tw-z-[1000]",
  mobileDialogZIndexClassName: "tw-z-[1010]",
};

const WaveDropLayerContext = createContext<WaveDropLayerContextValue>(
  DEFAULT_WAVE_DROP_LAYER_CONTEXT
);

export function WaveDropLayerProvider({
  children,
  value,
}: {
  readonly children: React.ReactNode;
  readonly value?: Partial<WaveDropLayerContextValue> | undefined;
}) {
  const mergedValue = useMemo<WaveDropLayerContextValue>(
    () => ({
      desktopActionsZIndexClassName:
        value?.desktopActionsZIndexClassName ??
        DEFAULT_WAVE_DROP_LAYER_CONTEXT.desktopActionsZIndexClassName,
      mobileMenuZIndexClassName:
        value?.mobileMenuZIndexClassName ??
        DEFAULT_WAVE_DROP_LAYER_CONTEXT.mobileMenuZIndexClassName,
      mobileDialogZIndexClassName:
        value?.mobileDialogZIndexClassName ??
        DEFAULT_WAVE_DROP_LAYER_CONTEXT.mobileDialogZIndexClassName,
    }),
    [value]
  );

  return (
    <WaveDropLayerContext.Provider value={mergedValue}>
      {children}
    </WaveDropLayerContext.Provider>
  );
}

export function useWaveDropLayers(): WaveDropLayerContextValue {
  return useContext(WaveDropLayerContext);
}
