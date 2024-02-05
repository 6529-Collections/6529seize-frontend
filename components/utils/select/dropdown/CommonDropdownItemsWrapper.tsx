import {
  Children,
  ReactElement,
  RefObject,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";
import CommonDropdownItemsMobileWrapper from "./CommonDropdownItemsMobileWrapper";
import { createBreakpoint } from "react-use";
import CommonDropdownItemsDefaultWrapper from "./CommonDropdownItemsDefaultWrapper";
import CommonDropdownItem from "./CommonDropdownItem";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });
export default function CommonDropdownItemsWrapper({
  isOpen,
  filterLabel,
  buttonRef,
  buttonPosition,
  setOpen,
  onIsMobile,
  children,
}: {
  readonly isOpen: boolean;
  readonly filterLabel: string;
  readonly buttonRef: RefObject<HTMLButtonElement>;
  readonly buttonPosition?: { readonly bottom: number; readonly right: number };
  readonly setOpen: (isOpen: boolean) => void;
  readonly onIsMobile: (isMobile: boolean) => void;
  readonly children:
    | ReactElement<typeof CommonDropdownItem>
    | ReactElement<typeof CommonDropdownItem>[];
}) {
  const breakpoint = useBreakpoint();

  const getIsMobile = () => breakpoint !== "LG";
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobile());

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
          filterLabel={filterLabel}
          setOpen={setOpen}
        >
          {children}
        </CommonDropdownItemsMobileWrapper>
      ) : (
        <CommonDropdownItemsDefaultWrapper
          isOpen={isOpen}
          setOpen={setOpen}
          buttonRef={buttonRef}
          buttonPosition={buttonPosition}
        >
          {children}
        </CommonDropdownItemsDefaultWrapper>
      )}
    </>
  );
}
