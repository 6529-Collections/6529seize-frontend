"use client";

import { Activity, useState, type ReactNode } from "react";
import { useWaveChatReadRegistration } from "@/contexts/wave/WaveChatReadContext";

/** Retain visited chat UI while pausing its subscriptions on other tabs. */
export default function WaveChatActivity({
  active,
  waveId,
  chat,
  children,
}: {
  readonly active: boolean;
  readonly waveId?: string;
  readonly chat: ReactNode;
  readonly children: ReactNode;
}) {
  useWaveChatReadRegistration(waveId, active);
  const [visited, setVisited] = useState(active);
  if (active && !visited) setVisited(true);

  return (
    <>
      {(active || visited) && (
        <Activity mode={active ? "visible" : "hidden"}>{chat}</Activity>
      )}
      {!active && children}
    </>
  );
}
