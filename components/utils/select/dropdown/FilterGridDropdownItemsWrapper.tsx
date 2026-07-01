"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useState } from "react";
import { createBreakpoint } from "react-use";
import FilterGridDropdownDesktopWrapper from "./FilterGridDropdownDesktopWrapper";
import FilterGridDropdownMobileWrapper from "./FilterGridDropdownMobileWrapper";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function FilterGridDropdownItemsWrapper({
  isOpen,
  filterLabel,
  buttonRef,
  setOpen,
  children,
}: {
  readonly isOpen: boolean;
  readonly filterLabel: string;
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly setOpen: (isOpen: boolean) => void;
  readonly children: ReactNode;
}) {
  const breakpoint = useBreakpoint();

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
        >
          {children}
        </FilterGridDropdownMobileWrapper>
      ) : (
        <FilterGridDropdownDesktopWrapper
          isOpen={isOpen}
          setOpen={setOpen}
          buttonRef={buttonRef}
        >
          {children}
        </FilterGridDropdownDesktopWrapper>
      )}
    </>
  );
}
