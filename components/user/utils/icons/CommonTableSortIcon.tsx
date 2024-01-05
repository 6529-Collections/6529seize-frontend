import { useEffect, useState } from "react";
import { SortDirection } from "../../../../entities/ISort";

export default function CommonTableSortIcon({
  direction,
  isActive,
}: {
  readonly direction: SortDirection;
  readonly isActive: boolean;
}) {
  const getClasses = ({
    active,
    dir,
  }: {
    active: boolean;
    dir: SortDirection;
  }): string => {
    let c = "";
    if (active) {
      c += "tw-text-primary-400";
    } else {
      c += "tw-text-iron-400 group-hover:tw-text-iron-200";
    }
    if (dir === SortDirection.ASC) {
      c += " tw-rotate-180";
    } else {
      c += " tw-rotate-0";
    }
    return c;
  };

  const [classes, setClasses] = useState<string>(
    getClasses({ active: isActive, dir: direction })
  );

  useEffect(() => {
    setClasses(getClasses({ active: isActive, dir: direction }));
  }, [isActive, direction]);

  return (
    <svg
      className={`${classes} -tw-mt-0.5 tw-ml-2 tw-transition tw-duration-300 tw-ease-out tw-h-4 tw-w-4`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
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
