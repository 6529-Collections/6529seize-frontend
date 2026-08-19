"use client";

import type { ReactNode } from "react";

export default function NetworkPageLayoutApp({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-overflow-x-hidden tw-bg-[#0D0D0F] tw-text-iron-100">
      <div className="tw-mx-auto tw-bg-[#0D0D0F] tw-px-4 tw-pb-6 tw-pt-6 lg:tw-pb-8 lg:tw-pt-8">
        {children}
      </div>
    </main>
  );
}
