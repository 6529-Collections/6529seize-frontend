"use client";

import { useMutation } from "@tanstack/react-query";
import React, { useContext, useMemo, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import type { DropRateChangeRequest } from "@/entities/IDrop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { commonApiPost } from "@/services/api/common-api";

import MyStreamWaveMyVotesResetProgress from "./MyStreamWaveMyVotesResetProgress";

interface MyStreamWaveMyVotesResetProps {
  readonly haveDrops: boolean;
  readonly availableVotes?: number | null;
  readonly selected: Set<string>;
  readonly allItemsSelected: boolean;
  readonly onToggleSelectAll: () => void;
  readonly removeSelected: (dropId: string) => void;
  readonly setPausePolling: (pausePolling: boolean) => void;
}

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

const MyStreamWaveMyVotesReset: React.FC<MyStreamWaveMyVotesResetProps> = ({
  haveDrops,
  availableVotes = null,
  selected,
  allItemsSelected,
  onToggleSelectAll,
  removeSelected,
  setPausePolling,
}) => {
  const { setToast } = useContext(AuthContext);
  // State for reset progress
  const [isResetting, setIsResetting] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);

  // Count total selected items
  const selectedCount = useMemo(() => {
    return selected.size;
  }, [selected]);

  const rateChangeMutation = useMutation({
    mutationFn: async (param: { dropId: string }) =>
      await commonApiPost<DropRateChangeRequest, ApiDrop>({
        endpoint: `drops/${param.dropId}/ratings`,
        body: {
          rating: 0,
          category: DEFAULT_DROP_RATE_CATEGORY,
        },
      }),
    onSuccess: (response: ApiDrop) => {
      removeSelected(response.id);
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      throw error;
    },
  });

  const [totalCount, setTotalCount] = useState(0);

  const handleReset = async () => {
    if (!selectedCount || isResetting) return;
    setTotalCount(selectedCount);
    setPausePolling(true);
    setIsResetting(true);
    setResetProgress(0);

    // Get all selected drop IDs
    const selectedDropIds = Array.from(selected);

    for (const dropId of selectedDropIds) {
      await rateChangeMutation.mutateAsync({ dropId });
      setResetProgress((prev) => prev + 1);
    }

    setIsResetting(false);
    setResetProgress(0);
    setPausePolling(false);
    setTotalCount(0);
  };

  if (!haveDrops) return null;
  return (
    <div className="tw-pl-1">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <SecondaryButton
            onClicked={onToggleSelectAll}
            size="sm"
            disabled={isResetting}
          >
            {allItemsSelected ? "Deselect All" : "Select All"}
          </SecondaryButton>
          <SecondaryButton
            onClicked={handleReset}
            size="sm"
            disabled={!selectedCount || isResetting}
          >
            {isResetting ? "Resetting..." : "Reset Votes"}
          </SecondaryButton>
        </div>
        {typeof availableVotes === "number" && (
          <p className="tw-mb-0 tw-text-xs tw-text-iron-500">
            Available{" "}
            <span className="tw-tabular-nums tw-text-iron-300">
              {formatNumberWithCommas(availableVotes)}
            </span>
          </p>
        )}
      </div>

      <MyStreamWaveMyVotesResetProgress
        isResetting={isResetting}
        resetProgress={resetProgress}
        totalCount={totalCount}
      />
    </div>
  );
};

export default MyStreamWaveMyVotesReset;
