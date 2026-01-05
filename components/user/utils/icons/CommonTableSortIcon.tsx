"use client";

import { useEffect, useState } from "react";
import { SortDirection } from "@/entities/ISort";

const rotatedDirections: Record<SortDirection, SortDirection> = {
  [SortDirection.ASC]: SortDirection.DESC,
  [SortDirection.DESC]: SortDirection.ASC,
};

export default function CommonTableSortIcon({
  direction,
  isActive,
  shouldRotate,
  activeClassName = "tw-text-primary-400",
}: {
  readonly direction: SortDirection;
  readonly isActive: boolean;
  readonly shouldRotate?: boolean | undefined;
  readonly activeClassName?: string | undefined;
}) {
  const getClasses = ({
    active,
    dir,
    rotate,
  }: {
    active: boolean;
    dir: SortDirection;
    rotate: boolean;
  }): string => {
    let c = "";
    if (active) {
      c += ` ${activeClassName}`;
    } else {
      c += " tw-text-iron-400 group-hover:tw-text-iron-200";
    }
    const targetDirection = rotate ? rotatedDirections[dir] : dir;
    if (targetDirection === SortDirection.ASC) {
      c += " tw-rotate-180";
    } else {
      c += " tw-rotate-0";
    }
    return c;
  };

  const [classes, setClasses] = useState<string>(
    getClasses({
      active: isActive,
      dir: direction,
      rotate: shouldRotate ?? false,
    })
  );

  useEffect(() => {
    setClasses(
      getClasses({
        active: isActive,
        dir: direction,
        rotate: shouldRotate ?? false,
      })
    );
  }, [isActive, direction, shouldRotate]);

  return (
    <svg
      className={`${classes} tw-transition tw-duration-300 tw-ease-out tw-h-4 tw-w-4 tw-flex-shrink-0`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 20V4M12 4L6 10M12 4L18 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
