"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FocusTrap } from "focus-trap-react";
import type { FormEvent} from "react";
import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";

export enum WaveGroupManageIdentitiesMode {
  INCLUDE = "INCLUDE",
  EXCLUDE = "EXCLUDE",
}

export interface WaveGroupManageIdentitiesConfirmEvent {
  readonly identity: string;
  readonly mode: WaveGroupManageIdentitiesMode;
}

export default function WaveGroupManageIdentitiesModal({
  mode,
  onClose,
  onConfirm,
}: {
  readonly mode: WaveGroupManageIdentitiesMode;
  readonly onClose: () => void;
  readonly onConfirm: (event: WaveGroupManageIdentitiesConfirmEvent) => void;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", (event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    if (
      activeElement &&
      modalRef.current?.contains(activeElement) &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT" ||
        activeElement.isContentEditable ||
        activeElement.getAttribute("role") === "combobox")
    ) {
      return;
    }

    onClose();
  });

  const title =
    mode === WaveGroupManageIdentitiesMode.INCLUDE
      ? "Include identity"
      : "Exclude identity";

  const description =
    mode === WaveGroupManageIdentitiesMode.INCLUDE
      ? "Add an identity to this group's allow list."
      : "Move an identity to this group's exclude list.";

  const [identity, setIdentity] = useState<string | null>(null);
  const actionLabel =
    mode === WaveGroupManageIdentitiesMode.INCLUDE ? "Include" : "Exclude";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (identity) {
      onConfirm({
        identity,
        mode,
      });
      onClose();
    }
  };

  return createPortal(
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        fallbackFocus: () => modalRef.current ?? document.body,
      }}>
      <div className="tw-cursor-default tw-relative tw-z-50">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
        <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
            <dialog
              ref={modalRef}
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              tabIndex={-1}
              open
              className="sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6">
              <div className="tw-flex tw-justify-between tw-items-start">
                <div className="tw-flex tw-flex-col tw-gap-y-2">
                  <p
                    id={titleId}
                    className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-mb-0">
                    {title}
                  </p>
                  <p
                    id={descriptionId}
                    className="tw-text-sm tw-text-iron-400 tw-mb-0">
                    {description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  type="button"
                  aria-label="Close dialog"
                  className="tw-p-2 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out">
                  <span className="tw-sr-only">Close</span>
                  <FontAwesomeIcon icon={faXmark} className="tw-h-5 tw-w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="tw-mt-6">
                  <IdentitySearch
                    size={IdentitySearchSize.MD}
                    identity={identity}
                    setIdentity={setIdentity}
                    autoFocus
                    label="Identity handle or address"
                  />
                </div>
                <div className="tw-mt-6 tw-flex tw-justify-end">
                  <button
                    onClick={onClose}
                    type="button"
                    className="tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 hover:tw-border-iron-600">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!identity}
                    className={`tw-ml-3 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-rounded-lg tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out ${
                      identity
                        ? "tw-bg-primary-500 tw-border-primary-500 tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600"
                        : "tw-bg-iron-800 tw-border-iron-700 tw-text-iron-400 tw-opacity-60"
                    }`}>
                    {actionLabel}
                  </button>
                </div>
              </form>
            </dialog>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
