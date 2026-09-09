"use client";

import React, { useContext, useState } from "react";
import Button from "@/components/utils/button/Button";
import MyStreamWaveMyVotesResetProgress from "./MyStreamWaveMyVotesResetProgress";
import { commonApiPost } from "@/services/api/common-api";
import type { DropRateChangeRequest } from "@/entities/IDrop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  applyWaveDropVoteUpdate,
  invalidateWaveApprovalSummaryQueries,
} from "@/hooks/waves/invalidateWaveApprovalStatusQueries";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

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
  const locale = useBrowserLocale();
  const { setToast } = useContext(AuthContext);
  const queryClient = useQueryClient();
  // State for reset progress
  const [isResetting, setIsResetting] = useState(false);
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false);
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
        title: t(locale, "waves.myVotes.resetError"),
        description: t(locale, "waves.myVotes.tryAgain"),
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
    if (!selectedCount || isResetting || isVotingClosed) return;
    setIsResetConfirmationOpen(true);
  };

  const handleConfirmReset = () => {
    setIsResetConfirmationOpen(false);
    void handleReset();
  };

  if (!haveDrops || isVotingClosed) return null;
  const selectedLabel = t(
    locale,
    selectedCount === 1
      ? "waves.myVotes.selected.one"
      : "waves.myVotes.selected.other",
    { count: formatInteger(locale, selectedCount) }
  );
  const resetSelectedMessage =
    selectedCount === 1
      ? "waves.myVotes.resetSelected.one"
      : "waves.myVotes.resetSelected.other";
  const resetButtonAriaLabel = selectedCount
    ? t(locale, resetSelectedMessage, {
        count: formatInteger(locale, selectedCount),
      })
    : t(locale, "waves.myVotes.resetVotes");
  const resetButtonLabel = t(locale, "waves.myVotes.resetVotes");

  return (
    <>
      <div className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-3">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 tw-px-2 sm:tw-px-4">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <Button
              onClick={onToggleSelectAll}
              variant="tertiary"
              size="xs"
              disabled={isResetting}
            >
              {t(
                locale,
                allItemsSelected
                  ? "waves.myVotes.deselectAll"
                  : "waves.myVotes.selectAll"
              )}
            </Button>
            <Button
              onClick={handleResetClick}
              variant="tertiary"
              size="xs"
              disabled={!selectedCount || isResetting}
              aria-label={resetButtonAriaLabel}
            >
              {isResetting
                ? t(locale, "waves.myVotes.resetting")
                : resetButtonLabel}
            </Button>
            {selectedCount > 0 && (
              <output
                className="tw-whitespace-nowrap tw-text-sm tw-leading-5 tw-text-iron-400"
              >
                {selectedLabel}
              </output>
            )}
          </div>
          {typeof availableVotes === "number" && (
            <p className="tw-m-0 tw-whitespace-nowrap tw-text-left tw-text-xs tw-leading-5 tw-text-iron-500">
              {t(locale, "waves.myVotes.availableInWave")}{" "}
              <span className="tw-font-semibold tw-tabular-nums tw-text-iron-200">
                {formatInteger(locale, availableVotes)}
              </span>
            </p>
          )}
        </div>

        <div className="tw-px-2 sm:tw-px-4">
          <MyStreamWaveMyVotesResetProgress
            isResetting={isResetting}
            resetProgress={resetProgress}
            totalCount={totalCount}
          />
        </div>
      </div>

      <MobileWrapperConfirmationDialog
        isOpen={isResetConfirmationOpen}
        onClose={() => setIsResetConfirmationOpen(false)}
        onConfirm={handleConfirmReset}
        title={t(
          locale,
          selectedCount === 1
            ? "waves.myVotes.resetTitle.one"
            : "waves.myVotes.resetTitle.other",
          { count: formatInteger(locale, selectedCount) }
        )}
        message={t(
          locale,
          selectedCount === 1
            ? "waves.myVotes.resetMessage.one"
            : "waves.myVotes.resetMessage.other",
          { count: formatInteger(locale, selectedCount) }
        )}
        confirmText={t(
          locale,
          selectedCount === 1
            ? "waves.myVotes.confirmReset.one"
            : "waves.myVotes.confirmReset.other",
          { count: formatInteger(locale, selectedCount) }
        )}
        confirmVariant="destructive"
        cancelText={t(locale, "waves.myVotes.cancelReset")}
      />
    </>
  );
};

export default MyStreamWaveMyVotesReset;
