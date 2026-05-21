"use client";

import type { ReactElement, RefObject } from "react";
import { useEffect } from "react";
import CommonDropdownItemsMobileWrapper from "./CommonDropdownItemsMobileWrapper";
import { createBreakpoint } from "react-use";
import CommonDropdownItemsDefaultWrapper from "./CommonDropdownItemsDefaultWrapper";

type DropdownHorizontalAlign = "auto" | "left" | "right";
const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });
export default function CommonDropdownItemsWrapper({
  isOpen,
  filterLabel,
  buttonRef,
  dynamicPosition = true,
  horizontalAlign = "auto",
  minWidth,
  portalClassName,
  setOpen,
  onIsMobile,
  children,
}: {
  readonly isOpen: boolean;
  readonly filterLabel: string;
  readonly buttonRef: RefObject<HTMLButtonElement | HTMLDivElement | null>;
  readonly dynamicPosition?: boolean | undefined;
  readonly horizontalAlign?: DropdownHorizontalAlign | undefined;
  readonly minWidth?: number | undefined;
  readonly portalClassName?: string | undefined;
  readonly setOpen: (isOpen: boolean) => void;
  readonly onIsMobile: (isMobile: boolean) => void;
  readonly children: ReactElement | ReactElement[];
}) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint !== "LG";

  useEffect(() => {
    // Existing consumers derive item density from the wrapper breakpoint.
    onIsMobile(isMobile);
  }, [isMobile, onIsMobile]);

  return (
    <>
      {isMobile ? (
        <CommonDropdownItemsMobileWrapper
          isOpen={isOpen}
          label={filterLabel}
          setOpen={setOpen}
        >
          {children}
        </CommonDropdownItemsMobileWrapper>
      ) : (
        <CommonDropdownItemsDefaultWrapper
          isOpen={isOpen}
          setOpen={setOpen}
          dynamicPosition={dynamicPosition}
          horizontalAlign={horizontalAlign}
          minWidth={minWidth}
          portalClassName={portalClassName}
          buttonRef={buttonRef}
        >
          {children}
        </CommonDropdownItemsDefaultWrapper>
      )}
    </>
  );
}
