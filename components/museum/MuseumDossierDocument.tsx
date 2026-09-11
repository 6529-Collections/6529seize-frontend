"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function MuseumDossierDocument({
  anchor,
  summary,
  children,
}: {
  readonly anchor: string;
  readonly summary: ReactNode;
  readonly children: ReactNode;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const openFragmentTarget = () => {
      if (window.location.hash === `#${anchor}` && detailsRef.current) {
        detailsRef.current.open = true;
      }
    };

    openFragmentTarget();
    window.addEventListener("hashchange", openFragmentTarget);
    return () => window.removeEventListener("hashchange", openFragmentTarget);
  }, [anchor]);

  return (
    <details
      ref={detailsRef}
      id={anchor}
      className="tw-group tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
    >
      {summary}
      {children}
    </details>
  );
}
