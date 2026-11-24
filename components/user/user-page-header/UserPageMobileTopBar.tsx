"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import BackButton from "@/components/navigation/BackButton";
import { useOptionalHeaderContext } from "@/contexts/HeaderContext";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";

export const PROFILE_TOP_BAR_BUTTON_CLASS =
  "tw-relative tw-inline-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/60 tw-p-0 tw-text-iron-50 tw-transition-colors after:tw-absolute after:-tw-inset-1 after:tw-content-[''] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-bg-iron-800 motion-reduce:tw-transition-none";

export default function UserPageMobileTopBar({
  headingRef,
  label,
  children,
}: {
  readonly headingRef: RefObject<HTMLDivElement | null>;
  readonly label: string;
  readonly children: ReactNode;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const header = useOptionalHeaderContext();
  const headerRef = header?.headerRef;
  const setHeaderRef = header?.setHeaderRef;
  const { registerRef } = useLayout();

  useEffect(() => {
    const bar = barRef.current;
    setHeaderRef?.(bar);
    registerRef("header", bar);
    return () => {
      if (headerRef?.current === bar) {
        setHeaderRef?.(null);
        registerRef("header", null);
      }
    };
  }, [headerRef, registerRef, setHeaderRef]);

  useEffect(() => {
    const heading = headingRef.current;
    const bar = barRef.current;
    if (!heading || !bar) return;

    let observer: IntersectionObserver;
    const observeHeading = () => {
      observer?.disconnect();
      const barHeight = bar.getBoundingClientRect().height;
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry) setCollapsed(entry.boundingClientRect.top < barHeight);
        },
        { rootMargin: `-${barHeight}px 0px 0px 0px`, threshold: [0, 1] }
      );
      observer.observe(heading);
    };
    const resizeObserver = new ResizeObserver(observeHeading);
    resizeObserver.observe(bar);
    observeHeading();
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [headingRef]);

  return (
    <div
      ref={barRef}
      data-profile-top-bar
      data-collapsed={collapsed}
      data-pull-to-refresh-fixed-overlay="true"
      className={`tw-fixed tw-inset-x-0 tw-top-0 tw-z-[60] tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-pt-[env(safe-area-inset-top,0px)] tw-transition-[background-color,border-color] tw-duration-150 motion-reduce:tw-transition-none ${collapsed ? "tw-border-iron-800 tw-bg-black" : "tw-border-transparent tw-bg-transparent"}`}
    >
      <div className="tw-grid tw-h-14 tw-grid-cols-[88px_minmax(0,1fr)_88px] tw-items-center tw-gap-3 tw-px-4">
        <BackButton
          className={`${PROFILE_TOP_BAR_BUTTON_CLASS} !tw-size-9 !tw-rounded-full !tw-bg-black/60`}
        />
        <span
          aria-hidden={!collapsed}
          className={`tw-truncate tw-text-center tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-opacity tw-duration-150 motion-reduce:tw-transition-none ${collapsed ? "tw-opacity-100" : "tw-opacity-0"}`}
        >
          {label}
        </span>
        <div className="tw-flex tw-items-center tw-justify-end">{children}</div>
      </div>
    </div>
  );
}
