"use client";

import type { ReactNode } from "react";

export default function NetworkPageLayoutApp({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <main className="tailwind-scope tw-overflow-x-hidden tw-bg-iron-950">
      <div className="tailwind-scope tw-mx-auto tw-mt-6 tw-bg-iron-950 tw-px-4 tw-pb-6 lg:tw-mt-8 lg:tw-pb-8">
        {children}
      </div>
    </main>
  );
}
