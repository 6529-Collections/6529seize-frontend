"use client";

import type { ReactNode } from "react";

export default function NetworkPageLayoutApp({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <main className="tailwind-scope tw-bg-iron-950 tw-overflow-x-hidden">
      <div className="tailwind-scope tw-bg-iron-950 tw-mt-6 lg:tw-mt-8 tw-pb-6 lg:tw-pb-8 tw-px-4 tw-mx-auto">
        {children}
      </div>
    </main>
  );
}
