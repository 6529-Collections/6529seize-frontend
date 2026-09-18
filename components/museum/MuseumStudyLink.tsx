"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/** Exposes when the study link can navigate without replacing the document. */
export function MuseumStudyLink({
  href,
  className,
  children,
}: {
  readonly href: string;
  readonly className: string;
  readonly children: string;
}) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const link = linkRef.current;
    link?.setAttribute("data-client-ready", "true");
    return () => link?.removeAttribute("data-client-ready");
  }, []);

  return (
    <Link ref={linkRef} href={href} className={className}>
      {children}
    </Link>
  );
}
