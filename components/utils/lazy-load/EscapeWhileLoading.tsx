"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

type EscapeHandler = (() => void) | undefined;

const EscapeWhileLoadingContext = createContext<EscapeHandler>(undefined);

// Lazy wrappers provide the handler that cancels the surface they are loading.
// Pass undefined while that surface is not open so Escape is left alone.
export function EscapeWhileLoadingProvider({
  onEscape,
  children,
}: {
  readonly onEscape: EscapeHandler;
  readonly children: ReactNode;
}) {
  return (
    <EscapeWhileLoadingContext.Provider value={onEscape}>
      {children}
    </EscapeWhileLoadingContext.Provider>
  );
}

// Render this from the next/dynamic `loading` fallback. The surface that is
// loading owns Escape once it mounts, but until its chunk arrives nothing
// listens, so an Escape pressed right after opening would be swallowed and the
// surface would still appear later. This listens only while the fallback is
// mounted. React swaps the fallback for the loaded component in a single
// commit, so the listener is removed in the same commit the real surface
// mounts and the two never overlap.
export function CancelOnEscapeWhileLoading() {
  const onEscape = useContext(EscapeWhileLoadingContext);

  useEffect(() => {
    if (!onEscape) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [onEscape]);

  return null;
}
