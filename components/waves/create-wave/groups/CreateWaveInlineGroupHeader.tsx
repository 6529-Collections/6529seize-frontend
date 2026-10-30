import type { ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ActionButton } from "./CreateWaveInlineGroupButtons";

export default function CreateWaveInlineGroupHeader({
  currentGroupLabel,
  showCurrentGroupTitle,
  showSummary = true,
  unsavedGroupDescription,
  unsavedGroupSummary,
  membersPreview,
  onCancel,
  disabled = false,
  flat = false,
  quiet = false,
}: {
  readonly currentGroupLabel: string;
  readonly showCurrentGroupTitle: boolean;
  readonly showSummary?: boolean;
  readonly unsavedGroupDescription: string | null;
  readonly unsavedGroupSummary: string | null;
  readonly membersPreview?: ReactNode | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly disabled?: boolean;
  readonly flat?: boolean;
  readonly quiet?: boolean;
}) {
  const locale = useBrowserLocale();
  const summaryWidthClass =
    quiet || flat || onCancel ? "tw-w-full" : "tw-w-fit md:tw-max-w-sm";
  let surfaceClass =
    "tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.04] tw-px-3 tw-py-2";
  if (quiet) {
    surfaceClass =
      "tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/40 tw-p-3";
  }
  if (flat) {
    surfaceClass = "tw-border-0 tw-bg-transparent tw-p-0";
  }
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3">
      <div
        className={`tw-min-w-0 tw-max-w-full ${surfaceClass} ${summaryWidthClass} ${
          onCancel
            ? "tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-1"
            : "tw-flex tw-flex-col tw-items-start tw-gap-0.5"
        }`}
      >
        {showCurrentGroupTitle ? (
          <p
            className={
              quiet
                ? "tw-m-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400"
                : "tw-m-0 tw-flex-shrink-0 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
            }
          >
            {t(locale, "waves.create.groups.currentGroup")}
          </p>
        ) : null}
        {onCancel && (
          <div className="tw-col-start-2 tw-row-start-1 tw-justify-self-end">
            <ActionButton
              icon={
                <XMarkIcon
                  aria-hidden="true"
                  className="tw-size-3.5 tw-flex-shrink-0"
                />
              }
              label={t(locale, "waves.create.actions.cancel")}
              disabled={disabled}
              quiet={quiet}
              active
              onClick={onCancel}
            />
          </div>
        )}
        {showSummary &&
          (membersPreview === null || membersPreview === undefined ? (
            <p
              className={`${showCurrentGroupTitle ? "tw-col-span-full" : "tw-col-start-1 tw-row-start-1"} tw-m-0 tw-max-w-full tw-truncate tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100`}
            >
              {currentGroupLabel}
            </p>
          ) : (
            <div
              className={`${showCurrentGroupTitle ? "tw-col-span-full" : "tw-col-start-1 tw-row-start-1"} ${quiet ? "tw-w-full" : "tw-mt-1.5"}`}
            >
              {membersPreview}
            </div>
          ))}
      </div>

      {unsavedGroupSummary && (
        <div className="tw-w-fit tw-max-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/40 tw-p-3 md:tw-max-w-sm">
          <p className="tw-m-0 tw-mb-1 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
            {t(locale, "waves.create.groups.unsavedGroup")}
          </p>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {unsavedGroupSummary}
          </p>
          {unsavedGroupDescription && (
            <p className="tw-m-0 tw-mt-1 tw-text-xs tw-font-medium tw-text-iron-400">
              {unsavedGroupDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
