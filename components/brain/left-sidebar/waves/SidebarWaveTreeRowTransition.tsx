import type { CSSProperties, ReactNode } from "react";
import type { AnimatedSidebarWaveTreeRow } from "@/hooks/useAnimatedSidebarWaveRows";

interface SidebarWaveTreeRowTransitionProps {
  readonly row: AnimatedSidebarWaveTreeRow;
  readonly rowHeight: number;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly children: ReactNode;
}

const getChildTransitionStyle = (
  row: AnimatedSidebarWaveTreeRow,
  rowHeight: number
): CSSProperties | undefined => {
  if (row.depth === 0) {
    return undefined;
  }

  const isVisible = row.animationState === "entered";

  return {
    maxHeight: isVisible ? rowHeight : 0,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(-4px)",
  };
};

const getTransitionDurationClass = (row: AnimatedSidebarWaveTreeRow) => {
  if (row.animationState === "entering") {
    return "tw-duration-[260ms]";
  }

  if (row.animationState === "exiting") {
    return "tw-duration-[160ms]";
  }

  return "tw-duration-200";
};

export function SidebarWaveTreeRowTransition({
  row,
  rowHeight,
  className,
  style,
  children,
}: SidebarWaveTreeRowTransitionProps) {
  const childStyle = getChildTransitionStyle(row, rowHeight);
  const transitionDurationClass = getTransitionDurationClass(row);

  return (
    <div
      data-sidebar-subwave-row-state={row.animationState}
      className={`tw-transition-[top,height,max-height,opacity,transform] ${transitionDurationClass} tw-ease-out motion-reduce:tw-transition-none ${
        row.depth === 1 && row.animationState !== "entered"
          ? "tw-overflow-hidden"
          : ""
      } ${className ?? ""}`}
      style={{
        ...style,
        ...childStyle,
      }}
    >
      {children}
    </div>
  );
}
