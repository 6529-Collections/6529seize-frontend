"use client";

import { useEffect, useState } from "react";
import GroupCardActionFooter from "./utils/GroupCardActionFooter";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";

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
  readonly matter: ApiRateMatter;
  readonly onSave: () => void;
  readonly onCancel: () => void;

  readonly children: React.ReactNode;
}) {
  const MATTER_LABEL: Record<ApiRateMatter, string> = {
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
    <div className="tw-flex tw-h-full tw-flex-col tw-gap-y-5 tw-px-4 tw-py-5 sm:tw-px-5 sm:tw-py-6">
      <div className="tw-flex-1">
        {addingRates ? (
          <div className="tw-space-y-4">
            <div>
              <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
                {MATTER_LABEL[matter]} Progress
              </p>
              <p className="tw-mt-1 tw-text-sm tw-text-iron-300">
                Keep this window open while we distribute credits across the
                group.
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
        onCancel={onCancel}
        loading={loading}
        disabled={disabled}
        onSave={onSave}
      />
    </div>
  );
}
