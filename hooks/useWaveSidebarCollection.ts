"use client";

import { useSyncExternalStore } from "react";

export type WaveSidebarCollection = "pinned" | "joined" | "all";
const KEY = "wave-sidebar-collection";
let fallback: WaveSidebarCollection = "all";
let useFallback = false;
const EVENT = "wave-sidebar-collection-change";

function readCollection(): WaveSidebarCollection {
  if (useFallback) return fallback;
  try {
    const value = localStorage.getItem(KEY);
    if (value === "pinned" || value === "joined" || value === "all")
      return value;
    return localStorage.getItem("show_following_waves") === "true"
      ? "joined"
      : "all";
  } catch {
    return fallback;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(EVENT, listener);
  };
}

function setWaveSidebarCollection(value: WaveSidebarCollection) {
  fallback = value;
  try {
    localStorage.setItem(KEY, value);
    localStorage.setItem("show_following_waves", String(value === "joined"));
    useFallback = false;
  } catch {
    useFallback = true;
    // Browsing remains available when persistence is disabled.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useWaveSidebarCollection() {
  const collection = useSyncExternalStore(
    subscribe,
    readCollection,
    () => "all" as const
  );
  return [collection, setWaveSidebarCollection] as const;
}
