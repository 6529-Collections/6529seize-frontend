"use client";

import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { formatAddress } from "@/helpers/Helpers";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FocusTrap } from "focus-trap-react";
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useKeyPressEvent } from "react-use";

interface ReviewDistributionPlanTableSubscriptionFooterModalProps {
  readonly show?: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly size?: "sm" | "lg" | "xl";
  readonly closeButton?: boolean;
  readonly isDismissable?: boolean;
  readonly bodyTestId?: string;
}

interface ReviewDistributionPlanTableSubscriptionFooterContractRowProps {
  readonly contract: string;
  readonly tokenId: string;
  readonly muted?: boolean;
}

interface ReviewDistributionPlanTableSubscriptionFooterContractOnlyRowProps {
  readonly contract: string;
}

interface ReviewDistributionPlanTableSubscriptionFooterTokenIdRowProps {
  readonly confirmedTokenId?: string | null | undefined;
  readonly displayTokenId: string;
  readonly tokenId: string;
  readonly onTokenIdChange: (tokenId: string) => void;
}

interface ReviewDistributionPlanTableSubscriptionFooterMessageRowProps {
  readonly children: ReactNode;
}

interface ReviewDistributionPlanTableSubscriptionFooterAlertRowProps extends ReviewDistributionPlanTableSubscriptionFooterMessageRowProps {
  readonly variant: "danger" | "secondary" | "warning";
}

const ALERT_ROW_CLASSNAMES: Record<
  ReviewDistributionPlanTableSubscriptionFooterAlertRowProps["variant"],
  string
> = {
  danger:
    "tw-mb-0 tw-rounded-lg tw-border tw-border-red/30 tw-bg-red/10 tw-px-4 tw-py-3 tw-text-red",
  secondary:
    "tw-mb-0 tw-rounded-lg tw-border tw-border-iron-300 tw-bg-iron-100 tw-px-4 tw-py-3 tw-text-iron-800",
  warning:
    "tw-mb-0 tw-rounded-lg tw-border tw-border-yellow-700 tw-bg-yellow-100 tw-px-4 tw-py-3 tw-text-yellow-900",
};

const MODAL_SIZE_CLASSNAMES: Record<
  NonNullable<ReviewDistributionPlanTableSubscriptionFooterModalProps["size"]>,
  string
> = {
  sm: "sm:tw-max-w-[300px]",
  lg: "sm:tw-max-w-[800px]",
  xl: "sm:tw-max-w-[1140px]",
};

const ARIA_HIDDEN = "aria-hidden";

type ModalSiblingState = {
  element: HTMLElement;
  ariaHidden: string | null;
  inert: boolean;
};

let openModalCount = 0;
let previousBodyOverflow = "";
let modalSiblingStates: ModalSiblingState[] = [];

function lockPageForModal(modalRoot: HTMLElement | null) {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    modalSiblingStates = Array.from(document.body.children).flatMap((child) => {
      if (
        !(child instanceof HTMLElement) ||
        child === modalRoot ||
        (modalRoot !== null && child.contains(modalRoot)) ||
        child.querySelector("dialog[aria-modal='true']")
      ) {
        return [];
      }

      const state = {
        element: child,
        ariaHidden: child.getAttribute(ARIA_HIDDEN),
        inert: Boolean(child.inert),
      };

      child.setAttribute(ARIA_HIDDEN, "true");
      child.inert = true;
      return [state];
    });
    document.body.style.overflow = "hidden";
  }

  openModalCount += 1;

  return () => {
    openModalCount = Math.max(0, openModalCount - 1);

    if (openModalCount > 0) {
      return;
    }

    document.body.style.overflow = previousBodyOverflow;
    modalSiblingStates.forEach((state) => {
      if (state.ariaHidden === null) {
        state.element.removeAttribute(ARIA_HIDDEN);
      } else {
        state.element.setAttribute(ARIA_HIDDEN, state.ariaHidden);
      }
      state.element.inert = state.inert;
    });
    modalSiblingStates = [];
  };
}

export function ReviewDistributionPlanTableSubscriptionFooterModal({
  show = true,
  title,
  onClose,
  children,
  footer,
  size,
  closeButton = true,
  isDismissable = true,
  bodyTestId,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterModalProps>) {
  const modalSizeClassName = size
    ? MODAL_SIZE_CLASSNAMES[size]
    : "sm:tw-max-w-[500px]";
  const modalRef = useRef<HTMLDialogElement>(null);
  const modalRootRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const showCloseButton = closeButton && isDismissable;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useKeyPressEvent("Escape", () => {
    if (show && isDismissable) {
      onCloseRef.current();
    }
  });

  useEffect(() => {
    if (!show) {
      return;
    }

    previousActiveElement.current =
      document.activeElement as HTMLElement | null;
    const unlockPage = lockPageForModal(modalRootRef.current);

    return () => {
      unlockPage();
      if (
        previousActiveElement.current &&
        document.contains(previousActiveElement.current)
      ) {
        previousActiveElement.current.focus();
      }
    };
  }, [show]);

  const handleOutsideClick = (event: MouseEvent<HTMLDivElement>) => {
    if (isDismissable && event.target === event.currentTarget) {
      onCloseRef.current();
    }
  };

  if (!show || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <FocusTrap
      active
      focusTrapOptions={{
        allowOutsideClick: true,
        initialFocus: () => modalRef.current ?? document.body,
        fallbackFocus: () => modalRef.current ?? document.body,
      }}
    >
      <div
        ref={modalRootRef}
        className="tailwind-scope tw-relative tw-z-[1055]"
      >
        <div
          aria-hidden="true"
          className="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-[1px]"
        />
        <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
          <div
            className="tw-flex tw-min-h-full tw-items-start tw-justify-center tw-px-2 tw-py-7 sm:tw-px-0 sm:tw-py-8"
            onClick={handleOutsideClick}
          >
            <dialog
              ref={modalRef}
              open
              tabIndex={-1}
              aria-modal="true"
              aria-labelledby={titleId}
              className={`tw-relative tw-m-0 tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-300 tw-bg-white tw-p-0 tw-text-left tw-text-iron-900 tw-shadow-xl tw-outline-none ${modalSizeClassName}`}
            >
              <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-0 tw-border-b tw-border-solid tw-border-iron-200 tw-px-4 tw-py-3">
                <h2
                  id={titleId}
                  className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-950"
                >
                  {title}
                </h2>
                {showCloseButton && (
                  <button
                    type="button"
                    aria-label="Close modal"
                    onClick={onClose}
                    className="tw-inline-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition hover:tw-bg-iron-100 hover:tw-text-iron-900 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    <XMarkIcon className="tw-h-5 tw-w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="tw-px-4 tw-py-3" data-testid={bodyTestId}>
                <div>{children}</div>
              </div>
              {footer !== undefined && footer !== null && (
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-iron-200 tw-px-4 tw-py-3">
                  {footer}
                </div>
              )}
            </dialog>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterContractRow({
  contract,
  tokenId,
  muted = false,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterContractRowProps>) {
  return (
    <div className="tw-py-2">
      <div className={muted ? "tw-text-sm tw-text-iron-500" : undefined}>
        Contract: The Memes - {formatAddress(contract)} | Token ID: {tokenId}
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterContractOnlyRow({
  contract,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterContractOnlyRowProps>) {
  return (
    <div className="tw-py-2">
      <div>
        Contract: The Memes - <span>{formatAddress(contract)}</span>
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterTokenIdRow({
  confirmedTokenId,
  displayTokenId,
  tokenId,
  onTokenIdChange,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterTokenIdRowProps>) {
  return (
    <div className="tw-py-2">
      <div>
        Token ID:{" "}
        {confirmedTokenId !== undefined && confirmedTokenId !== null ? (
          <span>{displayTokenId}</span>
        ) : (
          <input
            className="tw-w-[100px] tw-text-black"
            min={1}
            step={1}
            type="number"
            aria-label="Token ID"
            value={tokenId}
            onChange={(e) => {
              onTokenIdChange(e.target.value);
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterLoadingRow({
  children,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterMessageRowProps>) {
  return (
    <div className="tw-py-4">
      <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
        <CircleLoader />
        <span>{children}</span>
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterAlertRow({
  variant,
  children,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterAlertRowProps>) {
  return (
    <div className="tw-py-2">
      <div>
        <div className={ALERT_ROW_CLASSNAMES[variant]}>{children}</div>
      </div>
    </div>
  );
}

export function ReviewDistributionPlanTableSubscriptionFooterRow({
  children,
}: Readonly<ReviewDistributionPlanTableSubscriptionFooterMessageRowProps>) {
  return (
    <div className="tw-py-2">
      <div>{children}</div>
    </div>
  );
}
