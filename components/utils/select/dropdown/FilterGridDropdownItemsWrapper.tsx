"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useState } from "react";
import { createBreakpoint } from "react-use";
import FilterGridDropdownDesktopWrapper from "./FilterGridDropdownDesktopWrapper";
import FilterGridDropdownMobileWrapper from "./FilterGridDropdownMobileWrapper";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

function getGridColumnClassName(itemCount: number): string {
  if (itemCount <= 1) {
    return "tw-grid-cols-1";
  }

  if (itemCount <= 4) {
    return "tw-grid-cols-2";
  }

  if (itemCount <= 6) {
    return "tw-grid-cols-3";
  }

  return "tw-grid-cols-4";
}

export default function FilterGridDropdownItemsWrapper({
  isOpen,
  filterLabel,
  buttonRef,
  setOpen,
  itemCount,
  children,
}: {
  readonly isOpen: boolean;
  readonly filterLabel: string;
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly setOpen: (isOpen: boolean) => void;
  readonly itemCount: number;
  readonly children: ReactNode;
}) {
  const breakpoint = useBreakpoint();
  const gridColumnClassName = getGridColumnClassName(itemCount);

  const getIsMobile = () => breakpoint !== "LG";
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setIsMobile(getIsMobile());
  }, [breakpoint]);

  return (
    <>
      {isMobile ? (
        <FilterGridDropdownMobileWrapper
          isOpen={isOpen}
          label={filterLabel}
          setOpen={setOpen}
          gridColumnClassName={gridColumnClassName}
        >
          {children}
        </FilterGridDropdownMobileWrapper>
      ) : (
        <FilterGridDropdownDesktopWrapper
          isOpen={isOpen}
          setOpen={setOpen}
          buttonRef={buttonRef}
          gridColumnClassName={gridColumnClassName}
        >
          {children}
        </FilterGridDropdownDesktopWrapper>
      )}
    </>
  );
}
