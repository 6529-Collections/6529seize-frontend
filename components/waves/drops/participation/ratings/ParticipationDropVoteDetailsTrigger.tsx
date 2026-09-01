"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { trapTabFocus } from "@/components/utils/modal/focusTrap";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ParticipationDropVoteDetailsContent } from "./ParticipationDropVoteDetailsContent";

type VoteDetailsTab = "voters" | "logs";
type VoteDetailsTriggerDensity = "default" | "compact" | "gallery" | "tight";

interface ParticipationDropVoteDetailsTriggerProps {
  readonly drop: ApiDrop;
  readonly density?: VoteDetailsTriggerDensity | undefined;
  readonly visualVariant?: "default" | "memes" | undefined;
}

const VIEWPORT_PADDING_PX = 16;
const POPOVER_GAP_PX = 8;
const POPOVER_WIDTH_PX = 360;

const DENSITY_CLASS_NAMES: Record<VoteDetailsTriggerDensity, string> = {
  default: "tw-gap-1.5 tw-px-2 tw-py-1 tw-leading-5",
  compact: "tw-gap-1 tw-px-1.5 tw-py-0.5 tw-leading-4",
  gallery: "tw-box-border tw-h-8 tw-gap-1 tw-px-2.5 tw-py-0 tw-leading-4",
  tight: "tw-gap-1 tw-px-2 tw-py-1 tw-leading-5",
};

const isSmallDensity = (density: VoteDetailsTriggerDensity): boolean =>
  density === "compact" || density === "gallery";

const getTriggerTextSizeClassName = (
  density: VoteDetailsTriggerDensity,
  isMemesVariant: boolean
): string => {
  if (isSmallDensity(density)) {
    return "tw-text-xs";
  }

  return isMemesVariant ? "tw-text-meta" : "tw-text-sm";
};

const getTriggerAppearanceClassName = (isMemesVariant: boolean): string =>
  isMemesVariant
    ? "tw-rounded-md tw-border-iron-700 tw-bg-white/[0.05] tw-shadow-none desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-white/[0.08]"
    : "tw-rounded-md tw-border-white/[0.06] tw-bg-white/[0.05] tw-shadow-none desktop-hover:hover:tw-border-white/[0.09] desktop-hover:hover:tw-bg-white/[0.08] desktop-hover:hover:tw-text-iron-100";

interface TriggerClassNames {
  readonly triggerTextClassName: string;
  readonly countTextColorClassName: string;
  readonly labelTextColorClassName: string;
  readonly triggerClassName: string;
  readonly chevronClassName: string;
}

const getTriggerClassNames = (
  density: VoteDetailsTriggerDensity,
  visualVariant: NonNullable<
    ParticipationDropVoteDetailsTriggerProps["visualVariant"]
  >,
  isOpen: boolean
): TriggerClassNames => {
  const isMemesVariant = visualVariant === "memes";
  const triggerTextClassName = `${getTriggerTextSizeClassName(
    density,
    isMemesVariant
  )} tw-font-semibold`;
  const appearanceClassName = getTriggerAppearanceClassName(isMemesVariant);
  const triggerClassName = `tw-inline-flex tw-cursor-pointer tw-items-center tw-border tw-border-solid tw-transition-colors tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 ${appearanceClassName} ${DENSITY_CLASS_NAMES[density]}`;
  const chevronSizeClassName = isSmallDensity(density)
    ? "tw-size-3"
    : "tw-size-3.5";

  return {
    triggerTextClassName,
    countTextColorClassName: isMemesVariant
      ? "tw-text-iron-300"
      : "tw-text-iron-200",
    labelTextColorClassName: isMemesVariant
      ? "tw-text-iron-300"
      : "tw-text-iron-400",
    triggerClassName,
    chevronClassName: `tw-flex-shrink-0 tw-text-iron-500 tw-transition-transform tw-duration-200 ${chevronSizeClassName} ${
      isOpen ? "tw-rotate-180" : ""
    }`,
  };
};

const getVoterLabel = (voterCount: number): string =>
  voterCount === 1 ? "voter" : "voters";

const isInsideElement = (
  element: HTMLElement | null,
  target: EventTarget | null
): boolean => {
  if (!element || typeof globalThis.Node === "undefined") {
    return false;
  }

  return target instanceof globalThis.Node && element.contains(target);
};

export default function ParticipationDropVoteDetailsTrigger({
  drop,
  density = "default",
  visualVariant = "default",
}: ParticipationDropVoteDetailsTriggerProps) {
  const isMobileScreen = useIsMobileScreen();
  const isTouchDevice = useIsTouchDevice();
  const useSheet = isMobileScreen || isTouchDevice;
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<VoteDetailsTab>("voters");
  const [popoverPosition, setPopoverPosition] = useState<{
    readonly left: number;
    readonly top: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const closeDetails = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openDetails = useCallback(() => {
    setActiveTab("voters");
    setPopoverPosition(null);
    setIsOpen(true);
  }, []);

  const toggleDetails = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (isOpen) {
      closeDetails();
      return;
    }

    openDetails();
  };

  const updatePopoverPosition = useCallback(() => {
    if (!isOpen || useSheet) {
      return;
    }

    const button = triggerRef.current;
    const surface = surfaceRef.current;
    if (!button || !surface) {
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const surfaceWidth = surface.offsetWidth || POPOVER_WIDTH_PX;
    const surfaceHeight = surface.offsetHeight;
    const viewportWidth =
      globalThis.innerWidth ||
      globalThis.document.documentElement.clientWidth ||
      POPOVER_WIDTH_PX + VIEWPORT_PADDING_PX * 2;
    const viewportHeight =
      globalThis.innerHeight ||
      globalThis.document.documentElement.clientHeight ||
      surfaceHeight + VIEWPORT_PADDING_PX * 2;

    const maxLeft = Math.max(
      VIEWPORT_PADDING_PX,
      viewportWidth - VIEWPORT_PADDING_PX - surfaceWidth
    );
    const left = Math.min(
      Math.max(buttonRect.left, VIEWPORT_PADDING_PX),
      maxLeft
    );

    const availableBelow =
      viewportHeight - buttonRect.bottom - VIEWPORT_PADDING_PX;
    const availableAbove = buttonRect.top - VIEWPORT_PADDING_PX;
    const shouldOpenAbove =
      surfaceHeight > 0 &&
      availableBelow < surfaceHeight + POPOVER_GAP_PX &&
      availableAbove > availableBelow;
    const unclampedTop = shouldOpenAbove
      ? buttonRect.top - surfaceHeight - POPOVER_GAP_PX
      : buttonRect.bottom + POPOVER_GAP_PX;
    const maxTop = Math.max(
      VIEWPORT_PADDING_PX,
      viewportHeight - VIEWPORT_PADDING_PX - surfaceHeight
    );
    const top = Math.min(Math.max(unclampedTop, VIEWPORT_PADDING_PX), maxTop);

    setPopoverPosition({ left, top });
  }, [isOpen, useSheet]);

  useEffect(() => {
    if (!isOpen || useSheet) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        isInsideElement(surfaceRef.current, event.target) ||
        isInsideElement(triggerRef.current, event.target)
      ) {
        return;
      }

      closeDetails();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetails();
        return;
      }

      const surface = surfaceRef.current;
      if (surface) {
        trapTabFocus(event, surface);
      }
    };

    globalThis.document.addEventListener("mousedown", handlePointerDown);
    globalThis.document.addEventListener("touchstart", handlePointerDown);
    globalThis.document.addEventListener("keydown", handleKeyDown);

    return () => {
      globalThis.document.removeEventListener("mousedown", handlePointerDown);
      globalThis.document.removeEventListener("touchstart", handlePointerDown);
      globalThis.document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDetails, isOpen, useSheet]);

  useEffect(() => {
    if (!isOpen || useSheet) {
      return;
    }

    const activeElement = globalThis.document.activeElement;
    previouslyFocusedElementRef.current =
      typeof globalThis.HTMLElement !== "undefined" &&
      activeElement instanceof globalThis.HTMLElement
        ? activeElement
        : triggerRef.current;

    surfaceRef.current?.focus({ preventScroll: true });

    return () => {
      const restoreTarget = previouslyFocusedElementRef.current?.isConnected
        ? previouslyFocusedElementRef.current
        : triggerRef.current;
      restoreTarget?.focus({ preventScroll: true });
      previouslyFocusedElementRef.current = null;
    };
  }, [isOpen, useSheet]);

  useLayoutEffect(() => {
    updatePopoverPosition();
  }, [updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen || useSheet) {
      return;
    }

    const surface = surfaceRef.current;
    if (!surface) {
      return;
    }

    if (typeof globalThis.ResizeObserver === "undefined") {
      updatePopoverPosition();
      return;
    }

    const resizeObserver = new globalThis.ResizeObserver(() => {
      updatePopoverPosition();
    });
    resizeObserver.observe(surface);

    return () => resizeObserver.disconnect();
  }, [isOpen, updatePopoverPosition, useSheet]);

  useEffect(() => {
    if (!isOpen || useSheet) {
      return;
    }

    globalThis.addEventListener("resize", updatePopoverPosition);
    globalThis.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      globalThis.removeEventListener("resize", updatePopoverPosition);
      globalThis.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isOpen, updatePopoverPosition, useSheet]);

  const detailsContent = (
    <ParticipationDropVoteDetailsContent
      drop={drop}
      activeTab={activeTab}
      isOpen={isOpen}
      onActiveTabChange={setActiveTab}
      onClose={closeDetails}
      showHeader={!useSheet}
    />
  );

  const mobileSurface =
    isOpen && useSheet && typeof globalThis.document !== "undefined"
      ? createPortal(
          <MobileWrapperDialog
            title="Votes"
            isOpen={isOpen}
            onClose={closeDetails}
            noPadding
            fixedHeight
            tall
            showScrollbar
            headerClassName="tw-pb-0 tw-pt-2"
            titleClassName="tw-m-0"
          >
            <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
              {detailsContent}
            </div>
          </MobileWrapperDialog>,
          globalThis.document.body
        )
      : null;

  const desktopSurface =
    isOpen && !useSheet && typeof globalThis.document !== "undefined"
      ? createPortal(
          <div
            className="tailwind-scope tw-fixed tw-z-[1200]"
            style={{
              left: popoverPosition?.left ?? 0,
              top: popoverPosition?.top ?? 0,
              visibility: popoverPosition ? "visible" : "hidden",
              width: POPOVER_WIDTH_PX,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              ref={surfaceRef}
              role="dialog"
              aria-label="Votes"
              tabIndex={-1}
              className="tw-flex tw-max-h-[26rem] tw-w-[22.5rem] tw-max-w-[calc(100vw-2rem)] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0E1012] tw-shadow-[0_16px_48px_rgba(0,0,0,0.48)]"
            >
              {detailsContent}
            </div>
          </div>,
          globalThis.document.body
        )
      : null;
  const {
    triggerTextClassName,
    countTextColorClassName,
    labelTextColorClassName,
    triggerClassName,
    chevronClassName,
  } = getTriggerClassNames(density, visualVariant, isOpen);
  const voterLabel = getVoterLabel(drop.raters_count);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`View voters and vote log for ${formatNumberWithCommas(
          drop.raters_count
        )} ${voterLabel}`}
        onClick={toggleDetails}
        className={triggerClassName}
      >
        <span className={`${triggerTextClassName} ${countTextColorClassName}`}>
          {formatNumberWithCommas(drop.raters_count)}
        </span>
        <span className={`${triggerTextClassName} ${labelTextColorClassName}`}>
          {voterLabel}
        </span>
        <ChevronDownIcon aria-hidden="true" className={chevronClassName} />
      </button>
      {mobileSurface}
      {desktopSurface}
    </>
  );
}
