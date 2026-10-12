"use client";

import { useEffect, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import GroupCardActionFooter from "./utils/GroupCardActionFooter";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import type { GroupCardRateMatter } from "./GroupCard";

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
  compact = false,
  footerContent,
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
  readonly compact?: boolean | undefined;
  readonly footerContent?: React.ReactNode;
}) {
  const locale = useBrowserLocale();
  const MATTER_LABEL: Record<GroupCardRateMatter, string> = {
    [ApiRateMatter.Rep]: "Rep",
    [ApiRateMatter.Cic]: "NIC",
  };
  const getProgress = (): string => {
    if (
      typeof membersCount !== "number" ||
      typeof doneMembersCount !== "number"
    ) {
      return "0%";
    }
    return `${(doneMembersCount / membersCount) * 100}%`;
  };

  const [progress, setProgress] = useState(getProgress());

  useEffect(() => {
    setProgress(getProgress());
  }, [membersCount, doneMembersCount]);
  return (
    <div
      className={
        compact
          ? "tw-flex tw-min-w-0 tw-flex-col tw-gap-4"
          : "tw-flex tw-h-full tw-flex-col tw-gap-y-5 tw-px-4 tw-py-5 sm:tw-px-5 sm:tw-py-6"
      }
    >
      <div className="tw-flex-1">
        {addingRates ? (
          <div className="tw-space-y-4">
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
            <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-primary-400">
              {doneMembersCount}/{membersCount}
            </p>
            <div className="tw-h-3 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-white/5">
              <div
                className="tw-h-3 tw-rounded-full tw-bg-primary-400"
                style={{
                  width: progress,
                  transition: "width 0.5s ease-out",
                }}
              ></div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
      <GroupCardActionFooter
        compact={compact}
        saveButtonVariant={
          compact && matter === ApiRateMatter.Cic ? "success" : "action"
        }
        onCancel={onCancel}
        loading={loading}
        disabled={disabled}
        onSave={onSave}
      >
        {footerContent}
      </GroupCardActionFooter>
    </div>
  );
}
