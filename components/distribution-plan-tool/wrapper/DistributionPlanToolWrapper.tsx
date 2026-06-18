"use client";

import { useSetTitle } from "@/contexts/TitleContext";

export default function DistributionPlanToolWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useSetTitle("EMMA | Tools");

  return (
    <div className="tw-bg-iron-900">
      <div
        id="allowlist-tool"
        className="tailwind-scope tw-relative tw-min-h-screen tw-overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
}
