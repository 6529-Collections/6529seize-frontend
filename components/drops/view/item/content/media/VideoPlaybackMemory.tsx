"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface VideoPlaybackSnapshot {
  readonly currentTime: number;
  readonly muted: boolean;
  readonly volume: number;
  readonly userControlled: boolean;
}

export const VideoPlaybackMemoryContext = createContext<Map<
  string,
  VideoPlaybackSnapshot
> | null>(null);

/** Keep media preferences while a drop's virtualized children are removed. */
export function VideoPlaybackMemoryProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [memory] = useState(() => new Map<string, VideoPlaybackSnapshot>());
  return (
    <VideoPlaybackMemoryContext.Provider value={memory}>
      {children}
    </VideoPlaybackMemoryContext.Provider>
  );
}

export function useRememberedVideoPlayback(identity: string | undefined) {
  return useContext(VideoPlaybackMemoryContext)?.get(identity ?? "");
}
