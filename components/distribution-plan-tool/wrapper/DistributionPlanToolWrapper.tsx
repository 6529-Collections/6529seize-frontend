"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import "react-toastify/dist/ReactToastify.css";
export default function DistributionPlanToolWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useSetTitle("EMMA | Tools");

  return (
    <div className="tw-bg-neutral-900">
      <div
        id="allowlist-tool"
        className="tailwind-scope tw-overflow-y-auto tw-min-h-screen tw-relative">
        {children}
      </div>
    </div>
  );
}
