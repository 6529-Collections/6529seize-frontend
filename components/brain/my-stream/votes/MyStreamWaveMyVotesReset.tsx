"use client";

import React, { useContext, useState } from "react";
import {
  COMPACT_ACTION_BUTTON_CLASS,
  COMPACT_ACTION_CONTENT_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import MyStreamWaveMyVotesResetProgress from "./MyStreamWaveMyVotesResetProgress";
import { commonApiPost } from "@/services/api/common-api";
import type { DropRateChangeRequest } from "@/entities/IDrop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import {
  chainWriteDetails,
  chainWriteFailure,
} from "@/components/chain-waves/chainWavesErrorMessage";
import {
  applyWaveDropVoteUpdate,
  invalidateWaveApprovalSummaryQueries,
} from "@/hooks/waves/invalidateWaveApprovalStatusQueries";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useChainWavesWriters } from "@/components/chain-waves/useChainWavesWriters";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { scheduleIndexRefresh } from "@/lib/chain-waves/optimistic";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

interface MyStreamWaveMyVotesResetProps {
  readonly mobile?: boolean;
  readonly isSelecting?: boolean;
  readonly onToggleSelection?: (() => void) | undefined;
  readonly toolbarContent?: React.ReactNode;
  readonly resetVote?: ((dropId: string) => Promise<void>) | undefined;
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
  mobile = false,
  isSelecting = true,
  onToggleSelection,
  waveId,
  toolbarContent,
  resetVote,
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
  const { isApp } = useDeviceInfo();
  const isMobileViewport = useIsMobileLayoutViewport();
  const buttonHeightClassName =
    isApp || isMobileViewport ? "tw-min-h-11" : "tw-h-8";
  const buttonClassName = `${COMPACT_ACTION_BUTTON_CLASS} ${buttonHeightClassName}`;
  const { setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);
  const chainWriters = useChainWavesWriters();
  const queryClient = useQueryClient();
  // State for reset progress
  const [isResetting, setIsResetting] = useState(false);
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);

  const selectedCount = selected.size;

  const rateChangeMutation = useMutation({
    mutationFn: async (param: { dropId: string }) => {
      if (resetVote) {
        await resetVote(param.dropId);
        return null;
      }
      if (chainWriters) {
        // No drop comes back from the chain; the list refetches when the
        // reset ends.
        await chainWriters.vote({ dropId: param.dropId, amount: 0 });
        return null;
      }
      return await commonApiPost<DropRateChangeRequest, ApiDrop>({
        endpoint: `drops/${param.dropId}/ratings`,
        body: {
          rating: 0,
          category: DEFAULT_DROP_RATE_CATEGORY,
        },
      });
    },
    onSuccess: (response: ApiDrop | null, { dropId }) => {
      if (response)
        applyWaveDropVoteUpdate(queryClient, response, waveId, {
          contextProfile: activeProfileProxy
            ? undefined
            : connectedProfile?.handle,
          invalidateWaveSummary: false,
        });
      removeSelected(dropId);
    },
    onError: (error) => {
      // Cancelled at the wallet prompt: nothing more is sent, and that is not
      // an error.
      if (isUserRejectedSigningError(error)) {
        throw error;
      }
      setToast({
        type: "error",
        title: t(locale, "waves.myVotes.resetError"),
        description: chainWriteFailure(
          locale,
          error,
          t(locale, "waves.myVotes.tryAgain")
        ),
        details: chainWriteDetails(error),
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

    if (didResetAnyDrop && !resetVote && chainWriters) {
      // 6529.io's index shows the resets once it has read their blocks; a
      // refetch now would bring the old votes back.
      scheduleIndexRefresh(async () => {
        invalidateWaveApprovalSummaryQueries(queryClient, waveId);
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId }],
        });
      });
    } else if (didResetAnyDrop && !resetVote) {
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

  const showResetControls = (haveDrops && !isVotingClosed) || isResetting;
  if (
    !showResetControls &&
    (toolbarContent === undefined || toolbarContent === null)
  )
    return null;
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
  const showResetActions = selectedCount > 0 || isResetting;
  const selectAllButton = (
    <button
      type="button"
      onClick={onToggleSelectAll}
      className={`${buttonClassName} tw-shrink-0 !tw-font-medium`}
      disabled={isResetting}
    >
      <span className={`${COMPACT_ACTION_CONTENT_CLASS} !tw-font-medium`}>
        {t(
          locale,
          allItemsSelected
            ? "waves.myVotes.deselectAll"
            : "waves.myVotes.selectAll"
        )}
      </span>
    </button>
  );

  const resetActions = (
    <div className="tw-flex tw-items-center tw-gap-2">
      <button
        type="button"
        onClick={handleResetClick}
        className={buttonClassName}
        disabled={isResetting}
        aria-label={resetButtonAriaLabel}
      >
        <span className={COMPACT_ACTION_CONTENT_CLASS}>
          {isResetting
            ? t(locale, "waves.myVotes.resetting")
            : resetButtonLabel}
        </span>
      </button>
      {selectedCount > 0 && (
        <output className="tw-whitespace-nowrap tw-text-sm tw-leading-5 tw-text-iron-400">
          {selectedLabel}
        </output>
      )}
    </div>
  );

  return (
    <>
      <div
        className={`tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-3 ${mobile ? "tw-bg-iron-950 tw-pt-3" : ""}`}
      >
        <div
          className={`tw-flex tw-px-4 ${mobile ? "tw-flex-col tw-gap-1" : "tw-flex-row-reverse tw-items-center tw-gap-4"}`}
        >
          {typeof availableVotes === "number" && (
            <p
              className={`tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400 ${mobile ? "" : "tw-shrink-0 tw-whitespace-nowrap"}`}
            >
              {t(locale, "waves.myVotes.availableInWave")}{" "}
              <span className="tw-font-semibold !tw-tabular-nums tw-text-iron-100">
                {formatInteger(locale, availableVotes)}
              </span>
            </p>
          )}
          <div
            className={`tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 ${mobile ? "tw-w-full" : "tw-flex-1"}`}
          >
            <div
              className={`tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 ${mobile ? "" : "tw-flex-wrap"}`}
            >
              <div className="tw-min-w-0">{toolbarContent}</div>
              {showResetControls && (!mobile || isSelecting) && selectAllButton}
              {!mobile && showResetControls && showResetActions && resetActions}
            </div>
            {mobile && showResetControls && onToggleSelection && (
              <button
                type="button"
                onClick={onToggleSelection}
                disabled={isResetting}
                className={`${buttonClassName} tw-ml-auto tw-text-iron-300 enabled:tw-cursor-pointer`}
              >
                <span
                  className={`${COMPACT_ACTION_CONTENT_CLASS} !tw-border-transparent !tw-bg-transparent !tw-font-medium !tw-text-iron-300 desktop-hover:group-hover:!tw-bg-iron-900/50 desktop-hover:group-hover:!tw-text-iron-100`}
                >
                  {t(
                    locale,
                    !isSelecting
                      ? "waves.myVotes.select"
                      : "waves.myVotes.doneSelecting"
                  )}
                </span>
              </button>
            )}
            {mobile && showResetControls && isSelecting && showResetActions && (
              <div className="tw-basis-full">{resetActions}</div>
            )}
          </div>
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
