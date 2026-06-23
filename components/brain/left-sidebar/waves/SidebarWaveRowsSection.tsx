import type { ReactNode } from "react";
import type { AnimatedSidebarWaveTreeRow } from "@/hooks/useAnimatedSidebarWaveRows";
import { SidebarWaveTreeRowTransition } from "./SidebarWaveTreeRowTransition";

interface SidebarWaveRowsSectionProps {
  readonly ariaLabel: string;
  readonly className: string;
  readonly getRowHeight: (row: AnimatedSidebarWaveTreeRow) => number;
  readonly id?: string | undefined;
  readonly isRowVisible: (row: AnimatedSidebarWaveTreeRow) => boolean;
  readonly renderRow: (row: AnimatedSidebarWaveTreeRow) => ReactNode;
  readonly rows: readonly AnimatedSidebarWaveTreeRow[];
  readonly transitionClassName?: string | undefined;
}

export function SidebarWaveRowsSection({
  ariaLabel,
  className,
  getRowHeight,
  id,
  isRowVisible,
  renderRow,
  rows,
  transitionClassName,
}: SidebarWaveRowsSectionProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section id={id} className={className} aria-label={ariaLabel}>
      {rows.filter(isRowVisible).map((row) => (
        <SidebarWaveTreeRowTransition
          key={row.key}
          row={row}
          rowHeight={getRowHeight(row)}
          className={transitionClassName}
        >
          {renderRow(row)}
        </SidebarWaveTreeRowTransition>
      ))}
    </section>
  );
}
