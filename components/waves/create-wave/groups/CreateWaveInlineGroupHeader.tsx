import type { ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveInlineGroupHeader({
  currentGroupLabel,
  showCurrentGroupTitle,
  unsavedGroupDescription,
  unsavedGroupSummary,
  membersPreview,
}: {
  readonly currentGroupLabel: string;
  readonly showCurrentGroupTitle: boolean;
  readonly unsavedGroupDescription: string | null;
  readonly unsavedGroupSummary: string | null;
  readonly membersPreview?: ReactNode | undefined;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3">
      <div className="tw-flex tw-w-fit tw-max-w-full tw-flex-col tw-items-start tw-gap-0.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.04] tw-px-3 tw-py-2 md:tw-max-w-sm">
        {showCurrentGroupTitle ? (
          <p className="tw-m-0 tw-flex-shrink-0 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
            {t(locale, "waves.create.groups.currentGroup")}
          </p>
        ) : null}
        {membersPreview === null || membersPreview === undefined ? (
          <p className="tw-m-0 tw-max-w-full tw-truncate tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100">
            {currentGroupLabel}
          </p>
        ) : (
          <div className="tw-mt-1.5">{membersPreview}</div>
        )}
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
