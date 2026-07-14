"use client";

import React, { useContext, useState } from "react";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import MyStreamWaveMyVotesResetProgress from "./MyStreamWaveMyVotesResetProgress";
import { commonApiPost } from "@/services/api/common-api";
import type { DropRateChangeRequest } from "@/entities/IDrop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  applyWaveDropVoteUpdate,
  invalidateWaveApprovalSummaryQueries,
} from "@/hooks/waves/invalidateWaveApprovalStatusQueries";

interface MyStreamWaveMyVotesResetProps {
  readonly waveId: string;
  readonly haveDrops: boolean;
  readonly availableVotes?: number | null;
  readonly selected: Set<string>;
  readonly allItemsSelected: boolean;
  readonly isVotingClosed?: boolean | undefined;
  readonly onToggleSelectAll: () => void;
  readonly removeSelected: (dropId: string) => void;
  readonly onResettingChange: (isResetting: boolean) => void;
}

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

const MyStreamWaveMyVotesReset: React.FC<MyStreamWaveMyVotesResetProps> = ({
  waveId,
  haveDrops,
  availableVotes = null,
  selected,
  allItemsSelected,
  isVotingClosed = false,
  onToggleSelectAll,
  removeSelected,
  onResettingChange,
}) => {
  const { setToast } = useContext(AuthContext);
  const queryClient = useQueryClient();
  // State for reset progress
  const [isResetting, setIsResetting] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);

  const selectedCount = selected.size;

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
      applyWaveDropVoteUpdate(queryClient, response, waveId, {
        invalidateWaveSummary: false,
      });
      removeSelected(response.id);
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't reset this vote.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
      throw error;
    },
  });

  const [totalCount, setTotalCount] = useState(0);

  const handleReset = async () => {
    if (!selectedCount || isResetting || isVotingClosed) return;
    setTotalCount(selectedCount);
    onResettingChange(true);
    setIsResetting(true);
    setResetProgress(0);

    // Get all selected drop IDs
    const selectedDropIds = Array.from(selected);
    let didResetAnyDrop = false;

    try {
      for (const dropId of selectedDropIds) {
        await rateChangeMutation.mutateAsync({ dropId });
        didResetAnyDrop = true;
        setResetProgress((prev) => prev + 1);
      }
    } catch {
      // The mutation onError shows the toast. Stop the batch and clean up below.
    } finally {
      setIsResetting(false);
      setResetProgress(0);
      onResettingChange(false);
      setTotalCount(0);
    }

    if (didResetAnyDrop) {
      invalidateWaveApprovalSummaryQueries(queryClient, waveId);
    }
  };

  const handleResetClick = () => {
    void handleReset();
  };

  if (!haveDrops || isVotingClosed) return null;
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
            onClicked={handleResetClick}
            size="sm"
            disabled={!selectedCount || isResetting}
          >
            {isResetting ? "Resetting..." : "Reset Votes"}
          </SecondaryButton>
        </div>
        {typeof availableVotes === "number" && (
          <p className="tw-mb-0 tw-text-xs tw-text-iron-500">
            Available in wave{" "}
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
