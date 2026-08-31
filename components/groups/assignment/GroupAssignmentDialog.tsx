"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FocusTrap } from "focus-trap-react";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import Button from "@/components/utils/button/Button";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import GroupAssignmentPanel from "./GroupAssignmentPanel";

export default function GroupAssignmentDialog({
  title,
  description,
  suggestedName,
  defaultLabel,
  selectedGroup,
  membersRoleLabel,
  selectedGroupCriteriaStatus,
  selectedGroupIncludedWallets,
  selectedGroupExcludedWallets,
  defaultIncludedIdentity,
  startMode = "existing",
  beforePanel,
  isContentLoading = false,
  contentError = false,
  paused = false,
  disabled = false,
  allowGroupClear = true,
  onRetry,
  onClose,
  onChange,
  onCreateGroup,
}: {
  readonly title: string;
  readonly description: string;
  readonly suggestedName: string;
  readonly defaultLabel: string;
  readonly selectedGroup: ApiGroupFull | null;
  readonly membersRoleLabel?: string | undefined;
  readonly selectedGroupCriteriaStatus?: "loading" | "unavailable" | undefined;
  readonly selectedGroupIncludedWallets?: readonly string[] | undefined;
  readonly selectedGroupExcludedWallets?: readonly string[] | undefined;
  readonly defaultIncludedIdentity?: CommunityMemberMinimal | null | undefined;
  readonly startMode?: "actions" | "existing" | "criteria" | undefined;
  readonly beforePanel?: ReactNode | undefined;
  readonly isContentLoading?: boolean | undefined;
  readonly contentError?: boolean | undefined;
  readonly paused?: boolean | undefined;
  readonly disabled?: boolean;
  readonly allowGroupClear?: boolean;
  readonly onRetry?: (() => void) | undefined;
  readonly onClose: () => void;
  readonly onChange: (
    group: ApiGroupFull | null
  ) => void | boolean | Promise<void | boolean>;
  readonly onCreateGroup: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
}) {
  const locale = useBrowserLocale();
  const modalRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useClickAway(modalRef, () => {
    if (!paused) {
      onClose();
    }
  });
  useKeyPressEvent("Escape", (event: KeyboardEvent) => {
    if (paused || event.defaultPrevented) {
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

  let panelContent: ReactNode = (
    <GroupAssignmentPanel
      suggestedName={suggestedName}
      defaultLabel={defaultLabel}
      disabled={disabled}
      selectedGroup={selectedGroup}
      selectedGroupIncludedWallets={selectedGroupIncludedWallets}
      selectedGroupExcludedWallets={selectedGroupExcludedWallets}
      defaultIncludedIdentity={defaultIncludedIdentity}
      membersRoleLabel={membersRoleLabel}
      selectedGroupCriteriaStatus={selectedGroupCriteriaStatus}
      allowGroupClear={allowGroupClear}
      collapseOnClickAway={false}
      startMode={startMode}
      onChange={onChange}
      onCreateGroup={onCreateGroup}
    />
  );
  if (contentError) {
    panelContent = (
      <div
        role="alert"
        className="tw-flex tw-min-h-52 tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-text-center"
      >
        <div>
          <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-100">
            {t(locale, "waves.create.groups.editAccess.loadErrorTitle")}
          </p>
          <p className="tw-mb-0 tw-text-sm tw-leading-5 tw-text-iron-400">
            {t(locale, "waves.create.groups.editAccess.loadErrorDescription")}
          </p>
        </div>
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {t(locale, "waves.create.groups.editAccess.retry")}
          </Button>
        ) : null}
      </div>
    );
  } else if (isContentLoading) {
    panelContent = (
      <output
        aria-live="polite"
        className="tw-flex tw-min-h-52 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-text-sm tw-font-medium tw-text-iron-400"
      >
        <CircleLoader />
        <span>{t(locale, "waves.create.groups.editAccess.loading")}</span>
      </output>
    );
  }

  return createPortal(
    <FocusTrap
      paused={paused}
      focusTrapOptions={{
        allowOutsideClick: true,
        fallbackFocus: () => modalRef.current ?? document.body,
      }}
    >
      <div className="tw-relative tw-z-50 tw-cursor-default">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-950/75"></div>
        <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-px-0 tw-pt-8 tw-text-center sm:tw-items-center sm:tw-p-4">
            <dialog
              ref={modalRef}
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              tabIndex={-1}
              open
              className="tw-relative tw-m-0 tw-flex tw-max-h-[90dvh] tw-w-full tw-transform tw-flex-col tw-overflow-hidden tw-rounded-t-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-0 tw-text-left tw-shadow-2xl tw-transition-all tw-duration-300 sm:tw-max-w-5xl sm:tw-rounded-2xl"
            >
              <div className="tw-flex tw-flex-shrink-0 tw-items-start tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-p-5 sm:tw-p-6">
                <div className="tw-min-w-0 tw-flex-1">
                  <p
                    id={titleId}
                    className="tw-mb-1.5 tw-text-lg tw-font-semibold tw-text-iron-50"
                  >
                    {title}
                  </p>
                  <p
                    id={descriptionId}
                    className="tw-mb-0 tw-text-sm tw-leading-5 tw-text-iron-400"
                  >
                    {description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  type="button"
                  aria-label="Close dialog"
                  className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-p-0 tw-text-iron-400 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50"
                >
                  <span className="tw-sr-only">Close</span>
                  <FontAwesomeIcon icon={faXmark} className="tw-size-4" />
                </button>
              </div>

              <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-p-5 sm:tw-p-6">
                <div className="tw-flex tw-flex-col tw-gap-4">
                  {beforePanel}
                  {panelContent}
                </div>
              </div>
            </dialog>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
