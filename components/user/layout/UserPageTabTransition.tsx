"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function UserPageTabTransition({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="tw-transform-gpu motion-safe:tw-animate-in motion-safe:tw-fade-in motion-safe:tw-slide-in-from-right-1 motion-safe:tw-duration-150 motion-safe:tw-ease-out motion-reduce:tw-animate-none"
    >
      {children}
    </div>
  );
}
