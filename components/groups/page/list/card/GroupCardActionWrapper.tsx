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
    <div className="tw-pt-4 tw-pb-3 tw-flex tw-flex-col tw-h-full tw-gap-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700 tw-relative">
      <div className="tw-px-4">
        {addingRates ? (
          <div>
            <p className="tw-mb-0 tw-text-base tw-text-iron-100 tw-font-semibold">
              {MATTER_LABEL[matter]} Progress
            </p>
            <p className="tw-mt-1 tw-text-iron-400 tw-text-sm">
              Please do not leave the page or close this window until the
              process is complete.
            </p>
            <p className="tw-mt-4 tw-mb-0 tw-text-xl tw-text-primary-400 tw-font-bold">
              {doneMembersCount}/{membersCount}
            </p>
            <div className="tw-mt-2 tw-w-full tw-bg-iron-700 tw-rounded-full tw-h-3">
              <div
                className="tw-bg-primary-400 tw-h-3 tw-rounded-full"
                style={{
                  width: progress,
                  transition: "width 0.5s ease-out",
                }}></div>
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
