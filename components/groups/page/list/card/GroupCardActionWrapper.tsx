"use client";

import GroupCardActionFooter from "./utils/GroupCardActionFooter";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import type { GroupCardRateMatter } from "./GroupCard";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export default function GroupCardActionWrapper({
  loading,
  disabled,
  addingRates,
  doneMembersCount,
  membersCount,
  matter,
  onSave,
  onCancel,
  children,
}: {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly addingRates: boolean;
  readonly membersCount: number | null;
  readonly doneMembersCount: number | null;
  readonly matter: GroupCardRateMatter;
  readonly onSave: () => void;
  readonly onCancel: () => void;

  readonly children: React.ReactNode;
}) {
  const locale = useBrowserLocale();
  const MATTER_LABEL: Record<GroupCardRateMatter, string> = {
    [ApiRateMatter.Rep]: "REP",
    [ApiRateMatter.Cic]: "NIC",
  };
  const getProgress = (): string => {
    if (
      typeof membersCount !== "number" ||
      typeof doneMembersCount !== "number" ||
      membersCount <= 0
    ) {
      return "0%";
    }
    return `${Math.min(100, Math.max(0, (doneMembersCount / membersCount) * 100))}%`;
  };

  const progress = getProgress();
  return (
    <div className="tw-px-4 tw-pb-6 sm:tw-px-6">
      <div className="tw-min-h-36">
        {addingRates ? (
          <div role="status" aria-live="polite" className="tw-space-y-4">
            <div>
              <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
                {t(locale, "network.groupInspection.progress", {
                  matter: MATTER_LABEL[matter],
                })}
              </p>
              <p className="tw-mt-1 tw-text-sm tw-text-iron-300">
                {t(locale, "network.groupInspection.keepOpen")}
              </p>
            </div>
            <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-tabular-nums tw-text-iron-100">
              {formatInteger(locale, doneMembersCount)}/
              {formatInteger(locale, membersCount)}
            </p>
            <div
              role="progressbar"
              aria-label={t(locale, "network.groupInspection.progress", {
                matter: MATTER_LABEL[matter],
              })}
              aria-valuemin={0}
              aria-valuemax={membersCount ?? 0}
              aria-valuenow={Math.min(doneMembersCount ?? 0, membersCount ?? 0)}
              className="tw-h-2 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
            >
              <div
                className="tw-h-2 tw-rounded-full tw-bg-iron-300 tw-transition-[width] tw-duration-300 motion-reduce:tw-transition-none"
                style={{
                  width: progress,
                }}
              ></div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
      <GroupCardActionFooter
        onCancel={onCancel}
        loading={loading}
        disabled={disabled}
        onSave={onSave}
      />
    </div>
  );
}
