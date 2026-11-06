"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import BellIcon from "@/components/common/icons/BellIcon";
import {
  SIDEBAR_HOVER_CLOSE_DELAY_MS,
  SIDEBAR_HOVER_OPEN_DELAY_MS,
} from "@/constants/sidebar";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useHoverIntent } from "@/hooks/useHoverIntent";
import { t } from "@/i18n/messages";

function InboxLoading() {
  const locale = useBrowserLocale();
  return (
    <output className="tw-block tw-p-6 tw-text-sm tw-text-iron-300">
      {t(locale, "notifications.inbox.loading")}
    </output>
  );
}

const Inbox = dynamic(() => import("./NotificationsInbox"), {
  loading: InboxLoading,
});

export default function DesktopNotifications({
  collapsed,
  unread,
}: {
  readonly collapsed: boolean;
  readonly unread: boolean;
}) {
  const locale = useBrowserLocale();
  const title = t(locale, "notifications.inbox.title");
  const unreadDescriptionId = useId();
  const panelId = useId();
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusPanelRef = useRef(false);
  const keyboardFocusRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, bottom: 16 });
  const { schedule: scheduleOpen, cancel: cancelOpen } = useHoverIntent(
    SIDEBAR_HOVER_OPEN_DELAY_MS
  );
  const { schedule: scheduleClose, cancel: cancelClose } = useHoverIntent(
    SIDEBAR_HOVER_CLOSE_DELAY_MS
  );

  const close = useCallback(
    (restoreFocus = false) => {
      cancelOpen();
      cancelClose();
      focusPanelRef.current = false;
      keyboardFocusRef.current = false;
      setOpen(false);
      if (restoreFocus) triggerRef.current?.focus();
    },
    [cancelOpen, cancelClose]
  );

  const containsTarget = useCallback(
    (target: EventTarget | null) =>
      target instanceof Node &&
      (triggerRef.current?.contains(target) === true ||
        panelRef.current?.contains(target) === true),
    []
  );

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(416, window.innerWidth - 32);
      const height = panelRef.current?.getBoundingClientRect().height ?? 0;
      setPosition({
        left: Math.max(
          16,
          Math.min(rect.right + 12, window.innerWidth - width - 16)
        ),
        bottom: Math.max(
          16,
          Math.min(
            window.innerHeight - rect.bottom,
            window.innerHeight - height - 16
          )
        ),
      });
    };
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    if (triggerRef.current) observer.observe(triggerRef.current);
    if (panelRef.current) observer.observe(panelRef.current);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    if (focusPanelRef.current) {
      panelRef.current?.focus();
      focusPanelRef.current = false;
    }
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      if (!containsTarget(event.target)) close();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close(true);
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close, containsTarget]);

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!containsTarget(event.relatedTarget)) close();
  };
  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    cancelOpen();
    scheduleClose(() => {
      const hasKeyboardFocus =
        keyboardFocusRef.current &&
        panelRef.current?.contains(document.activeElement);
      if (!hasKeyboardFocus) close();
    });
  };

  return (
    <>
      <Link
        ref={triggerRef}
        href="/notifications"
        prefetch={false}
        aria-label={title}
        aria-expanded={open}
        aria-keyshortcuts="ArrowDown"
        aria-controls={open ? panelId : undefined}
        aria-describedby={unread ? unreadDescriptionId : undefined}
        data-tooltip-id="sidebar-tooltip"
        data-tooltip-content={title}
        data-tooltip-hidden={!collapsed || open}
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse") return;
          cancelClose();
          if (!open) scheduleOpen(() => setOpen(true));
        }}
        onPointerLeave={handlePointerLeave}
        onBlur={handleBlur}
        onClick={() => close()}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          keyboardFocusRef.current = true;
          cancelOpen();
          cancelClose();
          if (open) panelRef.current?.focus();
          else {
            focusPanelRef.current = true;
            setOpen(true);
          }
        }}
        className="tw-flex tw-h-[2.875rem] tw-w-full tw-items-center tw-gap-2 tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-base tw-font-medium tw-text-iron-400 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-white"
      >
        <span className="tw-flex tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center">
          <span className="tw-relative">
            <BellIcon aria-hidden="true" className="tw-size-6" />
            {unread && (
              <span
                aria-hidden="true"
                className="tw-absolute tw-right-0 tw-top-0 tw-size-2 tw-rounded-full tw-bg-red"
              />
            )}
          </span>
        </span>
        {!collapsed && <span>{title}</span>}
        {unread && (
          <span id={unreadDescriptionId} className="tw-sr-only">
            {t(locale, "notifications.inbox.unread")}
          </span>
        )}
      </Link>
      {open &&
        createPortal(
          <div
            id={panelId}
            ref={panelRef}
            tabIndex={-1}
            role="region"
            aria-label={title}
            onPointerEnter={cancelClose}
            onPointerLeave={handlePointerLeave}
            onBlur={handleBlur}
            onKeyDown={() => {
              keyboardFocusRef.current = true;
            }}
            onPointerDown={() => {
              keyboardFocusRef.current = false;
            }}
            style={position}
            className="tailwind-scope tw-fixed tw-z-[100] tw-flex tw-max-h-[min(36rem,calc(100dvh-2rem))] tw-w-[26rem] tw-max-w-[calc(100vw-2rem)] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-shadow-2xl focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <Inbox onClose={() => close(true)} />
          </div>,
          document.body
        )}
    </>
  );
}
