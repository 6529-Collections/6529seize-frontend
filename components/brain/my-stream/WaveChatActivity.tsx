"use client";

import { Activity, useState, type ReactNode } from "react";

/** Retain visited chat UI while pausing its subscriptions on other tabs. */
export default function WaveChatActivity({
  active,
  chat,
  children,
}: {
  readonly active: boolean;
  readonly chat: ReactNode;
  readonly children: ReactNode;
}) {
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
