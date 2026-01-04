"use client";

import type { ReactElement, RefObject} from "react";
import { useEffect, useState } from "react";
import CommonDropdownItemsMobileWrapper from "./CommonDropdownItemsMobileWrapper";
import { createBreakpoint } from "react-use";
import CommonDropdownItemsDefaultWrapper from "./CommonDropdownItemsDefaultWrapper";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });
export default function CommonDropdownItemsWrapper({
  isOpen,
  filterLabel,
  buttonRef,
  dynamicPosition = true,
  setOpen,
  onIsMobile,
  children,
}: {
  readonly isOpen: boolean;
  readonly filterLabel: string;
  readonly buttonRef: RefObject<HTMLButtonElement | HTMLDivElement | null>;
  readonly dynamicPosition?: boolean | undefined;
  readonly setOpen: (isOpen: boolean) => void;
  readonly onIsMobile: (isMobile: boolean) => void;
  readonly children: ReactElement | ReactElement[];
}) {
  const breakpoint = useBreakpoint();

  const getIsMobile = () => breakpoint !== "LG";
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setIsMobile(getIsMobile());
  }, [breakpoint]);

  useEffect(() => {
    onIsMobile(isMobile);
  }, [isMobile]);

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
          buttonRef={buttonRef}
        >
          {children}
        </CommonDropdownItemsDefaultWrapper>
      )}
    </>
  );
}
