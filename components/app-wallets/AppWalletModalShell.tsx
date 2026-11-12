"use client";

import type { ReactNode } from "react";
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useAndroidBackLayer } from "@/hooks/useAndroidBackLayer";

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

// Events a layered dialog keeps to itself, so modal layers underneath it
// (document key handlers, click-away handlers) never react to it.
const LAYERED_CONTAINED_EVENTS = [
  "mousedown",
  "pointerdown",
  "touchstart",
] as const;

function closeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

export function AppWalletModalShell(
  props: Readonly<{
    show: boolean;
    title: string;
    onHide: () => void;
    dismissDisabled?: boolean;
    /** Above every other modal layer: their focus traps pause, key and pointer
     * events stay inside, Escape closes only this. No React keydown inside. */
    layered?: boolean;
    /** Locale of the dialog body, so the whole dialog uses one language. */
    locale?: SupportedLocale | undefined;
    children: ReactNode;
    footer: ReactNode;
  }>
) {
  const titleId = useId();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const {
    children,
    dismissDisabled = false,
    footer,
    layered = false,
    locale = DEFAULT_LOCALE,
    onHide,
    show,
    title,
  } = props;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const requestHide = useEffectEvent(() => {
    if (!dismissDisabled) onHide();
  });
  useAndroidBackLayer(show && isHydrated, dialogRef, () => {
    if (!dismissDisabled) onHide();
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    if (!show) {
      closeDialog(dialog);
      return undefined;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.setAttribute("open", "");
    }
    // Start on the first field, otherwise on the heading: never on a control
    // that dismisses or confirms the dialog.
    const initialFocus =
      dialog.querySelector<HTMLElement>("[autofocus], input:not([disabled])") ??
      titleRef.current;
    initialFocus?.focus();

    return () => {
      closeDialog(dialog);
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    };
  }, [isHydrated, show]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!layered || !show || !dialog) {
      return undefined;
    }

    const keepInside = (event: Event) => {
      event.stopPropagation();
    };
    const onKeyDown = (event: Event) => {
      event.stopPropagation();
      if ("key" in event && event.key === "Escape") {
        event.preventDefault();
        requestHide();
      }
    };
    dialog.addEventListener("keydown", onKeyDown);
    for (const type of LAYERED_CONTAINED_EVENTS) {
      dialog.addEventListener(type, keepInside);
    }
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      for (const type of LAYERED_CONTAINED_EVENTS) {
        dialog.removeEventListener(type, keepInside);
      }
    };
  }, [isHydrated, layered, show]);

  if (!isHydrated) {
    return null;
  }

  const dialogElement = (
    <dialog
      ref={dialogRef}
      data-modal-layer={layered ? "top" : undefined}
      aria-modal="true"
      aria-labelledby={titleId}
      className="tailwind-scope tw-relative tw-m-0 tw-h-[100dvh] tw-max-h-none tw-w-screen tw-max-w-none tw-overflow-y-auto tw-border-none tw-bg-transparent tw-p-0 tw-text-inherit backdrop:tw-bg-black/75 backdrop:tw-backdrop-blur-sm"
      onClose={() => {
        // Closed by any other path while it should be shown: dismissed, so
        // whoever waits on this dialog is always answered.
        if (show) onHide();
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!dismissDisabled) {
          onHide();
        }
      }}
    >
      <button
        type="button"
        aria-label={t(locale, "appWallet.modal.close")}
        className="tw-absolute tw-inset-0 tw-cursor-default tw-appearance-none tw-border-0 tw-bg-transparent tw-p-0"
        onClick={onHide}
        disabled={dismissDisabled}
        tabIndex={-1}
      />
      <div className="tw-relative tw-z-10 tw-flex tw-min-h-full tw-w-full tw-items-center tw-justify-center tw-px-4 tw-pb-[max(1rem,env(safe-area-inset-bottom,0px))] tw-pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <section className="tw-my-auto tw-w-full tw-max-w-md tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-50 tw-shadow-2xl tw-shadow-black/60 tw-ring-1 tw-ring-white/5">
          <header className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-5 tw-py-4 sm:tw-px-6">
            <h2
              ref={titleRef}
              id={titleId}
              tabIndex={-1}
              className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 focus:tw-outline-none"
            >
              {title}
            </h2>
            <button
              type="button"
              aria-label={t(locale, "appWallet.modal.close")}
              onClick={onHide}
              disabled={dismissDisabled}
              className="tw--mr-2 tw-inline-flex tw-size-11 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-bg-white/5 active:tw-text-iron-100 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-100"
            >
              <XMarkIcon className="tw-size-5" aria-hidden="true" />
            </button>
          </header>
          <div className="tw-px-5 tw-py-5 sm:tw-px-6">{children}</div>
          <div
            data-testid="app-wallet-modal-actions"
            className="tw-flex tw-flex-col tw-justify-end tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-black/20 tw-px-5 tw-py-4 sm:tw-flex-row sm:tw-px-6 [&>button]:tw-w-full sm:[&>button]:tw-w-auto"
          >
            {footer}
          </div>
        </section>
      </div>
    </dialog>
  );

  return createPortal(
    layered ? (
      <FocusTrap
        active={show}
        focusTrapOptions={{
          // The dialog moves focus itself; this trap exists so that any
          // focus trap already active underneath pauses while it is open.
          initialFocus: false,
          fallbackFocus: () => dialogRef.current ?? document.body,
          allowOutsideClick: true,
          clickOutsideDeactivates: false,
          escapeDeactivates: false,
          returnFocusOnDeactivate: false,
        }}
      >
        {dialogElement}
      </FocusTrap>
    ) : (
      dialogElement
    ),
    document.body
  );
}
