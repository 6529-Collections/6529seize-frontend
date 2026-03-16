"use client";

import Link from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";

import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import useHasTouchInput from "@/hooks/useHasTouchInput";
import useIsMobileDevice from "@/hooks/isMobileDevice";

import { useLinkPreviewContext } from "./LinkPreviewContext";

type StopEvent =
  | MouseEvent<HTMLElement>
  | KeyboardEvent<HTMLElement>
  | PointerEvent<HTMLElement>
  | TouchEvent<HTMLElement>;

type ChatItemHrefButtonsLayout = "overlay" | "rail";

const stopPropagation = (event: StopEvent) => {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
};

const OVERLAY_TRIGGER_BUTTON_CLASSES =
  "tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/70 tw-text-iron-100 tw-shadow-lg tw-shadow-black/40 tw-backdrop-blur-sm tw-transition tw-duration-200 hover:tw-bg-black/85 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

const MENU_ITEM_CLASSES =
  "tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-100 tw-transition-colors hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-bg-iron-800";

const RAIL_BUTTON_CLASSES =
  "tw-flex tw-items-center tw-gap-x-2 tw-rounded-xl tw-border-0 tw-bg-iron-900 tw-p-2 hover:tw-text-iron-400";

function PreviewToggleIcon({ isLoading }: { readonly isLoading: boolean }) {
  if (isLoading) {
    return (
      <svg
        className="tw-h-4 tw-w-4 tw-animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="tw-opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="tw-opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 6.75C3 5.7835 3.7835 5 4.75 5H19.25C20.2165 5 21 5.7835 21 6.75V17.25C21 18.2165 20.2165 19 19.25 19H4.75C3.7835 19 3 18.2165 3 17.25V6.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.25 8.5H17.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.25 12.25H11.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.25 15.5H11.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M14 12H18V16H14V12Z" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 4L20 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className="tw-h-4 tw-w-4 tw-flex-shrink-0"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth="3"
      stroke="currentColor"
      fill="none"
      aria-hidden="true"
    >
      <path d="M55.4,32V53.58a1.81,1.81,0,0,1-1.82,1.82H10.42A1.81,1.81,0,0,1,8.6,53.58V10.42A1.81,1.81,0,0,1,10.42,8.6H32" />
      <polyline points="40.32 8.6 55.4 8.6 55.4 24.18" />
      <line x1="19.32" y1="45.72" x2="54.61" y2="8.91" />
    </svg>
  );
}

export default function ChatItemHrefButtons({
  href,
  relativeHref,
  hideLink = false,
  layout = "rail",
}: {
  href: string;
  relativeHref?: string | undefined;
  hideLink?: boolean | undefined;
  layout?: ChatItemHrefButtonsLayout | undefined;
}) {
  const { previewToggle, onCardActionsActiveChange } = useLinkPreviewContext();
  const hasTouchInput = useHasTouchInput();
  const isMobileDevice = useIsMobileDevice();
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const actionSurfaceId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previewToggleButtonRef = useRef<HTMLButtonElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const openLinkButtonRef = useRef<HTMLAnchorElement>(null);
  const lastReportedActiveRef = useRef(false);
  const shouldFocusFirstMenuItemRef = useRef(false);
  const actionSurfaceStateRef = useRef({
    isMenuOpen: false,
    isHovered: false,
    isFocused: false,
  });
  const showPreviewToggle = Boolean(previewToggle && !previewToggle.isHidden);
  const isOverlay = layout === "overlay";
  const showPersistentOverlayTrigger =
    isOverlay && (hasTouchInput || isMobileDevice);

  useEffect(() => {
    return () => {
      if (lastReportedActiveRef.current && onCardActionsActiveChange) {
        onCardActionsActiveChange(actionSurfaceId, false);
        lastReportedActiveRef.current = false;
      }
    };
  }, [actionSurfaceId, onCardActionsActiveChange]);

  const updateActionSurfaceState = (
    nextStatePatch: Partial<typeof actionSurfaceStateRef.current>
  ) => {
    const currentState = actionSurfaceStateRef.current;
    const nextState = { ...currentState, ...nextStatePatch };

    if (
      nextState.isMenuOpen === currentState.isMenuOpen &&
      nextState.isHovered === currentState.isHovered &&
      nextState.isFocused === currentState.isFocused
    ) {
      return;
    }

    actionSurfaceStateRef.current = nextState;

    if (nextState.isMenuOpen !== currentState.isMenuOpen) {
      setIsMenuOpen(nextState.isMenuOpen);
    }

    if (!isOverlay || !onCardActionsActiveChange) {
      return;
    }

    const isActionSurfaceActive =
      nextState.isMenuOpen || nextState.isHovered || nextState.isFocused;

    if (lastReportedActiveRef.current === isActionSurfaceActive) {
      return;
    }

    onCardActionsActiveChange(actionSurfaceId, isActionSurfaceActive);
    lastReportedActiveRef.current = isActionSurfaceActive;
  };

  const focusFirstMenuItemIfRequested = () => {
    if (!shouldFocusFirstMenuItemRef.current) {
      return;
    }

    const firstEnabledMenuItem = [
      previewToggleButtonRef.current,
      copyButtonRef.current,
      openLinkButtonRef.current,
    ].find((element): element is HTMLButtonElement | HTMLAnchorElement => {
      return Boolean(element) && !element?.hasAttribute("disabled");
    });

    if (!firstEnabledMenuItem) {
      return;
    }

    firstEnabledMenuItem.focus();
    shouldFocusFirstMenuItemRef.current = false;
  };

  const handlePreviewToggleButtonRef = (element: HTMLButtonElement | null) => {
    previewToggleButtonRef.current = element;
    focusFirstMenuItemIfRequested();
  };

  const handleCopyButtonRef = (element: HTMLButtonElement | null) => {
    copyButtonRef.current = element;
    focusFirstMenuItemIfRequested();
  };

  const handleOpenLinkButtonRef = (element: HTMLAnchorElement | null) => {
    openLinkButtonRef.current = element;
    focusFirstMenuItemIfRequested();
  };

  const closeMenu = () => {
    shouldFocusFirstMenuItemRef.current = false;
    updateActionSurfaceState({ isMenuOpen: false });
  };

  const handleMenuOpenChange = (nextIsOpen: boolean) => {
    if (!nextIsOpen) {
      shouldFocusFirstMenuItemRef.current = false;
    }

    updateActionSurfaceState({ isMenuOpen: nextIsOpen });
  };

  const toggleLinkPreviews = (event: MouseEvent<HTMLButtonElement>) => {
    stopPropagation(event);
    if (!previewToggle || previewToggle.isLoading || !previewToggle.canToggle) {
      return;
    }

    previewToggle.onToggle();
    closeMenu();
  };

  const copyToClipboard = (event: MouseEvent<HTMLButtonElement>) => {
    stopPropagation(event);
    closeMenu();
    void navigator.clipboard.writeText(href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    });
  };

  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    stopPropagation(event);
    updateActionSurfaceState({
      isMenuOpen: !actionSurfaceStateRef.current.isMenuOpen,
    });
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      event.key !== "Enter" &&
      event.key !== " " &&
      event.key !== "Spacebar"
    ) {
      return;
    }

    stopPropagation(event);
    shouldFocusFirstMenuItemRef.current = true;
  };

  const handleTriggerPointerStart = (event: StopEvent) => {
    shouldFocusFirstMenuItemRef.current = false;
    stopPropagation(event);
  };

  const dismissOverlayMenu = (event: StopEvent) => {
    event.preventDefault();
    stopPropagation(event);
    closeMenu();
  };

  const handleOverlayBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }

    updateActionSurfaceState({ isFocused: false });
  };

  const previewToggleButton = showPreviewToggle ? (
    <button
      ref={handlePreviewToggleButtonRef}
      type="button"
      className={`${isOverlay ? MENU_ITEM_CLASSES : RAIL_BUTTON_CLASSES} ${
        previewToggle?.isLoading || !previewToggle?.canToggle
          ? "tw-cursor-default tw-opacity-60"
          : ""
      }`}
      aria-label={previewToggle?.label}
      disabled={previewToggle?.isLoading ?? !previewToggle?.canToggle}
      onClick={toggleLinkPreviews}
      onPointerDown={stopPropagation}
      onMouseDown={stopPropagation}
      onTouchStart={stopPropagation}
    >
      <PreviewToggleIcon isLoading={previewToggle?.isLoading ?? false} />
      {isOverlay && <span>{previewToggle?.label}</span>}
    </button>
  ) : null;

  const copyButton = (
    <button
      ref={handleCopyButtonRef}
      type="button"
      className={isOverlay ? MENU_ITEM_CLASSES : RAIL_BUTTON_CLASSES}
      aria-label="Copy link"
      onClick={copyToClipboard}
      onPointerDown={stopPropagation}
      onMouseDown={stopPropagation}
      onTouchStart={stopPropagation}
    >
      {isOverlay ? (
        <DocumentDuplicateIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      ) : (
        <svg
          className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke={copied ? "#27ae60" : "currentColor"}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
      )}
      {isOverlay && <span>Copy link</span>}
    </button>
  );

  const openLinkButton = !hideLink ? (
    <Link
      ref={handleOpenLinkButtonRef}
      href={relativeHref ?? href}
      target={relativeHref ? undefined : "_blank"}
      className={isOverlay ? MENU_ITEM_CLASSES : RAIL_BUTTON_CLASSES}
      onClick={(event) => {
        stopPropagation(event);
        closeMenu();
      }}
      onPointerDown={stopPropagation}
      onMouseDown={stopPropagation}
      onTouchStart={stopPropagation}
    >
      {isOverlay ? (
        <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      ) : (
        <ExternalLinkIcon />
      )}
      {isOverlay && <span>Open link</span>}
    </Link>
  ) : null;

  if (!isOverlay) {
    return (
      <div className="tw-mt-1 tw-flex tw-h-full tw-flex-col tw-justify-start tw-gap-y-2">
        {previewToggleButton}
        {copyButton}
        {openLinkButton}
      </div>
    );
  }

  return (
    <>
      {isMenuOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Dismiss link actions"
          className="tw-absolute tw-inset-0 tw-z-10 tw-cursor-default tw-border-0 tw-bg-transparent tw-p-0"
          onClick={dismissOverlayMenu}
          onPointerDown={dismissOverlayMenu}
          onMouseDown={dismissOverlayMenu}
          onTouchStart={dismissOverlayMenu}
        />
      )}
      <div className="tw-absolute tw-bottom-3 tw-right-3 tw-z-20">
        <div
          className={`tw-transition-opacity tw-duration-200 ${
            showPersistentOverlayTrigger || isMenuOpen
              ? "tw-pointer-events-auto tw-opacity-100"
              : "tw-pointer-events-none tw-opacity-0 group-focus-within/link-card:tw-pointer-events-auto group-focus-within/link-card:tw-opacity-100 desktop-hover:group-hover/link-card:tw-pointer-events-auto desktop-hover:group-hover/link-card:tw-opacity-100"
          }`}
          onMouseEnter={() => updateActionSurfaceState({ isHovered: true })}
          onMouseLeave={() => updateActionSurfaceState({ isHovered: false })}
          onFocusCapture={() => updateActionSurfaceState({ isFocused: true })}
          onBlurCapture={handleOverlayBlur}
        >
          <button
            ref={buttonRef}
            type="button"
            className={OVERLAY_TRIGGER_BUTTON_CLASSES}
            aria-label="Link actions"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            onClick={handleTriggerClick}
            onKeyDown={handleTriggerKeyDown}
            onPointerDown={handleTriggerPointerStart}
            onMouseDown={handleTriggerPointerStart}
            onTouchStart={handleTriggerPointerStart}
          >
            <EllipsisHorizontalIcon className="tw-h-5 tw-w-5" />
          </button>
        </div>
        <CommonDropdownItemsDefaultWrapper
          isOpen={isMenuOpen}
          setOpen={handleMenuOpenChange}
          buttonRef={buttonRef}
        >
          {previewToggleButton && (
            <li className="tw-list-none">{previewToggleButton}</li>
          )}
          <li className="tw-list-none">{copyButton}</li>
          {!hideLink && <li className="tw-list-none">{openLinkButton}</li>}
        </CommonDropdownItemsDefaultWrapper>
      </div>
    </>
  );
}
