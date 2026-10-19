"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  calculateTooltipLayout,
  measureTooltipSize,
} from "@/components/utils/tooltip/tooltipPositioning";
import { useTooltipReposition } from "@/components/utils/tooltip/useTooltipReposition";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const subscribeToHydration = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const PAGE_SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

/** Keeps guidance interactions and portal visibility under one React state. */
export default function UserPageIdentityStatementsGuidance() {
  const locale = useBrowserLocale();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot
  );
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<ReturnType<
    typeof calculateTooltipLayout
  > | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isPointerOverTooltip = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = undefined;
  }, []);

  const open = () => {
    cancelHide();
    setIsOpen(true);
  };

  const close = useCallback(() => {
    cancelHide();
    isPointerOverTooltip.current = false;
    setIsOpen(false);
  }, [cancelHide]);

  const hideAfterPointerLeaves = () => {
    cancelHide();
    if (
      isPointerOverTooltip.current ||
      document.activeElement === buttonRef.current
    )
      return;
    hideTimer.current = setTimeout(close, 150);
  };

  const handleTooltipEnter = () => {
    isPointerOverTooltip.current = true;
    cancelHide();
  };

  const handleTooltipLeave = () => {
    isPointerOverTooltip.current = false;
    hideAfterPointerLeaves();
  };

  const reposition = useCallback(() => {
    if (!buttonRef.current || !tooltipRef.current) return;
    setLayout(
      calculateTooltipLayout({
        childRect: buttonRef.current.getBoundingClientRect(),
        tooltipRect: measureTooltipSize(tooltipRef.current),
        placement: "top",
        offset: 8,
      })
    );
  }, []);

  useLayoutEffect(() => {
    if (isOpen) reposition();
  }, [isOpen, locale, reposition]);
  useTooltipReposition(isOpen, reposition);

  useEffect(() => cancelHide, [cancelHide]);

  useEffect(() => {
    if (!isOpen) return;
    const isInsideTooltip = (target: EventTarget | null) =>
      target instanceof Node && tooltipRef.current?.contains(target);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      // Space activates the focused help button; it is not a page-scroll
      // gesture there. Scrolling within the guidance also keeps it open.
      const activatesButton =
        event.key === " " &&
        event.target instanceof Node &&
        buttonRef.current?.contains(event.target);
      if (
        PAGE_SCROLL_KEYS.has(event.key) &&
        !activatesButton &&
        !isInsideTooltip(event.target)
      ) {
        close();
      }
    };
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !buttonRef.current?.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
        close();
      }
    };
    const handleScrollGesture = (event: Event) => {
      if (!isInsideTooltip(event.target)) close();
    };
    // Browser scroll anchoring and pending scroll-into-view can move the page
    // after activation. Reposition for those events; dismiss on user input.
    // Pointer-based scrollbar use is covered by outside-pointer dismissal.
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("wheel", handleScrollGesture, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchmove", handleScrollGesture, {
      capture: true,
      passive: true,
    });
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("wheel", handleScrollGesture, true);
      window.removeEventListener("touchmove", handleScrollGesture, true);
      document.removeEventListener("pointerdown", handleOutsidePointer);
    };
  }, [close, isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={!hydrated}
        aria-label={t(locale, "user.profile.identity.statements.help")}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        onMouseEnter={open}
        onMouseLeave={hideAfterPointerLeaves}
        onFocus={open}
        onBlur={hideAfterPointerLeaves}
        onClick={open}
        className="tw-inline-flex tw-h-8 tw-w-8 tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-white/5 hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <svg
          className="tw-h-[18px] tw-w-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
            onFocus={cancelHide}
            onBlur={hideAfterPointerLeaves}
            className="tw-w-80 tw-max-w-[calc(100vw-2rem)] tw-whitespace-normal tw-text-left tw-text-xs tw-leading-5"
            style={{
              ...TOOLTIP_STYLES,
              position: "fixed",
              left: layout?.position.x ?? 0,
              top: layout?.position.y ?? 0,
              visibility: layout ? "visible" : "hidden",
              pointerEvents: "auto",
            }}
          >
            <ul className="tw-m-0 tw-max-h-[calc(100dvh-3rem)] tw-list-disc tw-space-y-1 tw-overflow-y-auto tw-py-1 tw-pl-4 tw-font-normal tw-text-iron-300">
              <li>{t(locale, "user.profile.identity.statements.optional")}</li>
              <li>
                {t(
                  locale,
                  "user.profile.identity.statements.permanentlyPublic"
                )}
              </li>
              <li>
                {t(
                  locale,
                  "user.profile.identity.statements.socialAccountsDisclaimer"
                )}
              </li>
              <li>
                {t(locale, "user.profile.identity.statements.communityRates")}
              </li>
            </ul>
            <span
              aria-hidden="true"
              className="tw-pointer-events-none tw-absolute tw-h-2 tw-w-2 tw-rotate-45"
              style={{
                background: TOOLTIP_STYLES.background,
                left: (layout?.arrowPosition.x ?? 0) - 4,
                ...(layout?.placement === "top" ? { bottom: -4 } : { top: -4 }),
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
