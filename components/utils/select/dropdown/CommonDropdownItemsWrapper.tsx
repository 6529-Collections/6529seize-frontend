import { ReactNode } from "react";
import CommonDropdownItemsMobileWrapper from "./CommonDropdownItemsMobileWrapper";
import { createBreakpoint } from "react-use";
import CommonDropdownItemsDefaultWrapper from "./CommonDropdownItemsDefaultWrapper";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function CommonDropdownItemsWrapper({
  isOpen,
  filterLabel,
  setOpen,
  children,
}: {
  readonly isOpen: boolean;
  readonly filterLabel: string;
  readonly setOpen: (isOpen: boolean) => void;
  readonly children: ReactNode;
}) {
  const breakpoint = useBreakpoint();
  if (breakpoint === "LG") {
    return (
      <CommonDropdownItemsDefaultWrapper isOpen={isOpen} setOpen={setOpen}>
        {children}
      </CommonDropdownItemsDefaultWrapper>
    );
  } else {
    return (
      <CommonDropdownItemsMobileWrapper
        isOpen={isOpen}
        filterLabel={filterLabel}
        setOpen={setOpen}
      >
        {children}
      </CommonDropdownItemsMobileWrapper>
    );
  }
}
