"use client";

import { createContext, type ReactNode, useContext } from "react";

export type TweetPreviewMode = "auto" | "never";

const TweetPreviewModeContext = createContext<TweetPreviewMode>("auto");

interface TweetPreviewModeProviderProps {
  readonly mode: TweetPreviewMode;
  readonly children: ReactNode;
}

export const TweetPreviewModeProvider = ({
  mode,
  children,
}: TweetPreviewModeProviderProps) => {
  return (
    <TweetPreviewModeContext.Provider value={mode}>
      {children}
    </TweetPreviewModeContext.Provider>
  );
};

export const useTweetPreviewMode = (): TweetPreviewMode =>
  useContext(TweetPreviewModeContext);
