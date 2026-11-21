"use client";

import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
} from "react";
import type { DropdownMetrics, DropdownVariant } from "./dropdownTriggerStyles";

const ToolbarMetricsContext = createContext<DropdownMetrics | null>(null);

export function useDropdownToolbarMetrics() {
  return useContext(ToolbarMetricsContext);
}

const TOOLBAR_METRICS = {
  compact: { height: 32, minHeight: 0, y: 0, left: 10 },
  regular: { height: 40, minHeight: 0, y: 8 },
} as const;

export default function DropdownToolbar({
  className = "",
  variant = "regular",
  ...props
}: Readonly<ComponentPropsWithoutRef<"div">> & {
  readonly variant?: Exclude<DropdownVariant, "form">;
}) {
  return (
    <ToolbarMetricsContext.Provider value={TOOLBAR_METRICS[variant]}>
      <div {...props} className={className} />
    </ToolbarMetricsContext.Provider>
  );
}
