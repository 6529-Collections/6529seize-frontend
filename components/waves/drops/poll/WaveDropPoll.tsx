"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import Button from "@/components/utils/button/Button";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { useMyStreamActionsOptional } from "@/contexts/wave/MyStreamContext";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPoll } from "@/generated/models/ApiDropPoll";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { preserveAuthenticatedPollVote } from "@/helpers/waves/poll-vote-reconciliation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWavesWritesPaused } from "@/hooks/useWavesMovePhase";
import { t } from "@/i18n/messages";
import { voteDropPollV2 } from "@/services/api/wave-drops-v2-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  POLL_CARD_CLASS_NAME,
  POLL_FOOTER_CLASS_NAME,
  PollCardHeader,
  PollVotedStatus,
} from "./PollCardPresentation";
import { PollOptionVoters } from "./PollOptionVoters";
import { PollResultOption } from "./PollResultOption";
import { PollVoteOption } from "./PollVoteOption";
import {
  getOptimisticPoll,
  getPollClosingLabel,
  getPollSubmitLabel,
} from "./WaveDropPoll.helpers";

type PollView = "vote" | "results";

interface WaveDropPollProps {
  readonly drop: ApiDrop;
}

interface LocalPollOverride {
  readonly sourcePoll: ApiDropPoll | undefined;
  readonly poll: ApiDropPoll | null;
}

interface PollInteractionState {
  readonly pollKey: string;
  readonly view: PollView;
  readonly selectedOptionNos: readonly number[];
  readonly expandedOptionNo: number | null;
}

const getDefaultPollView = (poll: ApiDropPoll): PollView =>
  poll.is_open && poll.voted.length === 0 ? "vote" : "results";

const getVotedKey = (poll: ApiDropPoll): string =>
  [...poll.voted].sort((a, b) => a - b).join(",");

const getPollInteractionKey = (poll: ApiDropPoll): string =>
  `${poll.id}:${poll.is_open ? "open" : "closed"}:${getVotedKey(poll)}`;

const getDefaultPollInteractionState = (
  poll: ApiDropPoll
): PollInteractionState => ({
  pollKey: getPollInteractionKey(poll),
  view: getDefaultPollView(poll),
  selectedOptionNos: [...poll.voted],
  expandedOptionNo: null,
});

const getScopedPollInteractionState = (
  current: PollInteractionState | null,
  poll: ApiDropPoll
): PollInteractionState => {
  const pollKey = getPollInteractionKey(poll);
  return current?.pollKey === pollKey
    ? current
    : getDefaultPollInteractionState(poll);
};

const getEffectivePollView = ({
  canRespond,
  isOpen,
  scopedView,
}: {
  readonly canRespond: boolean;
  readonly isOpen: boolean;
  readonly scopedView: PollView;
}): PollView => {
  if (!canRespond || !isOpen || scopedView === "results") {
    return "results";
  }

  return "vote";
};

const getCanRespondToPoll = ({
  isViewerChatEligible,
  poll,
}: {
  readonly isViewerChatEligible: boolean;
  readonly poll: ApiDropPoll | null | undefined;
}): boolean =>
  poll?.only_droppers_can_respond === true ? isViewerChatEligible : true;

const stopPollEventPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
};

const getLocalPoll = (
  localPollOverride: LocalPollOverride | null,
  sourcePoll: ApiDropPoll | undefined
): ApiDropPoll | null => {
  if (!localPollOverride) {
    return null;
  }

  if (localPollOverride.sourcePoll === sourcePoll) {
    return localPollOverride.poll;
  }

  return (
    preserveAuthenticatedPollVote(sourcePoll, localPollOverride.poll, {
      preferExistingVote: true,
    }) ?? null
  );
};

const UPDATED_VOTE_STATUS_DURATION_MS = 2500;

const useUpdatedVoteStatus = () => {
  const showUpdatedTimeoutRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);
  const [showUpdated, setShowUpdated] = useState(false);

  const flashUpdatedVoteStatus = useCallback(() => {
    setShowUpdated(true);

    if (showUpdatedTimeoutRef.current) {
      globalThis.clearTimeout(showUpdatedTimeoutRef.current);
    }

    showUpdatedTimeoutRef.current = globalThis.setTimeout(() => {
      setShowUpdated(false);
      showUpdatedTimeoutRef.current = null;
    }, UPDATED_VOTE_STATUS_DURATION_MS);
  }, []);

  const clearUpdatedVoteStatus = useCallback(() => {
    if (showUpdatedTimeoutRef.current) {
      globalThis.clearTimeout(showUpdatedTimeoutRef.current);
      showUpdatedTimeoutRef.current = null;
    }

    setShowUpdated(false);
  }, []);

  useEffect(() => {
    return () => {
      if (showUpdatedTimeoutRef.current) {
        globalThis.clearTimeout(showUpdatedTimeoutRef.current);
      }
    };
  }, []);

  return {
    clearUpdatedVoteStatus,
    flashUpdatedVoteStatus,
    showUpdated,
  };
};

export default function WaveDropPoll({ drop }: WaveDropPollProps) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useAuth();
  const { getEligibility } = useWaveEligibility();
  const myStream = useMyStreamActionsOptional();
  const { clearUpdatedVoteStatus, flashUpdatedVoteStatus, showUpdated } =
    useUpdatedVoteStatus();
  const [localPollOverride, setLocalPollOverride] =
    useState<LocalPollOverride | null>(null);
  const localPoll = getLocalPoll(localPollOverride, drop.poll);
  const poll = localPoll ?? drop.poll;
  const [interactionState, setInteractionState] =
    useState<PollInteractionState | null>(null);

  const waveEligibility = getEligibility(drop.wave.id);
  const isViewerChatEligible =
    waveEligibility?.authenticated_user_eligible_to_chat ??
    drop.wave.authenticated_user_eligible_to_chat;
  // Poll ballots move to the 6529 Network: the results stay readable.
  const pollBallotsPaused = useWavesWritesPaused();
  const canRespondToPoll =
    !pollBallotsPaused &&
    getCanRespondToPoll({
      isViewerChatEligible,
      poll,
    });

  const voteMutation = useMutation({
    mutationFn: async (options: readonly number[]) =>
      await voteDropPollV2({
        drop,
        options,
      }),
    onSuccess: (updatedDrop) => {
      if (updatedDrop.poll) {
        setLocalPollOverride({
          sourcePoll: drop.poll,
          poll: updatedDrop.poll,
        });
        setInteractionState({
          ...getDefaultPollInteractionState(updatedDrop.poll),
          view: "results",
        });
      }
      updateDropInCachedDrops(queryClient, updatedDrop);
      void myStream?.processIncomingDrop(
        updatedDrop,
        ProcessIncomingDropType.DROP_INSERT
      );
      queryClient
        .invalidateQueries({
          queryKey: [QueryKey.DROP_POLL_VOTERS],
        })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({
          queryKey: [QueryKey.WAVE_POLLS],
        })
        .catch(() => undefined);
    },
    onError: (error) => {
      clearUpdatedVoteStatus();
      setToast({
        type: "error",
        title: "Couldn't submit your poll vote.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
  });

  const submitPollVote = useCallback(
    async (
      selectedOptionNos: readonly number[],
      {
        showUpdatedStatus = false,
      }: {
        readonly showUpdatedStatus?: boolean;
      } = {}
    ): Promise<boolean> => {
      if (
        !poll?.is_open ||
        !canRespondToPoll ||
        selectedOptionNos.length === 0
      ) {
        return false;
      }

      const { success } = await requestAuth();
      if (!success) {
        return false;
      }

      const previousLocalPollOverride = localPollOverride;
      const previousInteractionState = interactionState;
      const optimisticPoll = getOptimisticPoll(poll, selectedOptionNos);

      setLocalPollOverride({
        sourcePoll: drop.poll,
        poll: optimisticPoll,
      });
      setInteractionState({
        ...getDefaultPollInteractionState(optimisticPoll),
        view: "results",
      });

      voteMutation.mutate(selectedOptionNos, {
        onSuccess: () => {
          if (showUpdatedStatus) {
            flashUpdatedVoteStatus();
          }
        },
        onError: () => {
          setLocalPollOverride(previousLocalPollOverride);
          setInteractionState(previousInteractionState);
        },
      });

      return true;
    },
    [
      drop.poll,
      flashUpdatedVoteStatus,
      interactionState,
      localPollOverride,
      poll,
      canRespondToPoll,
      requestAuth,
      voteMutation,
    ]
  );

  const handleVoteOptionChange = useCallback(
    (optionNo: number) => {
      if (!poll || !canRespondToPoll) {
        return;
      }

      if (!poll.multichoice) {
        const showUpdatedStatus = poll.voted.length > 0;
        setInteractionState((current) => {
          const scopedState = getScopedPollInteractionState(current, poll);
          return {
            ...scopedState,
            selectedOptionNos: [optionNo],
          };
        });
        submitPollVote([optionNo], { showUpdatedStatus })
          .then((submitted) => {
            if (submitted) {
              return;
            }

            setInteractionState((current) => {
              const scopedState = getScopedPollInteractionState(current, poll);
              if (
                scopedState.selectedOptionNos.length !== 1 ||
                scopedState.selectedOptionNos[0] !== optionNo
              ) {
                return scopedState;
              }

              return {
                ...scopedState,
                selectedOptionNos: [...poll.voted],
              };
            });
          })
          .catch(() => undefined);
        return;
      }

      setInteractionState((current) => {
        const scopedState = getScopedPollInteractionState(current, poll);
        const next = new Set(scopedState.selectedOptionNos);
        if (next.has(optionNo)) {
          next.delete(optionNo);
        } else {
          next.add(optionNo);
        }
        return {
          ...scopedState,
          selectedOptionNos: [...next].sort((a, b) => a - b),
        };
      });
    },
    [canRespondToPoll, poll, submitPollVote]
  );

  const handleSubmitVote = useCallback(async () => {
    if (!poll?.is_open || !canRespondToPoll) {
      return;
    }

    const scopedState = getScopedPollInteractionState(interactionState, poll);
    if (scopedState.selectedOptionNos.length === 0) {
      return;
    }

    await submitPollVote(scopedState.selectedOptionNos, {
      showUpdatedStatus: poll.voted.length > 0,
    });
  }, [canRespondToPoll, interactionState, poll, submitPollVote]);

  const showVoteView = useCallback(() => {
    if (!poll?.is_open || !canRespondToPoll) {
      return;
    }

    setInteractionState((current) => {
      const scopedState = getScopedPollInteractionState(current, poll);
      return {
        ...scopedState,
        view: "vote",
        selectedOptionNos:
          poll.voted.length > 0
            ? [...poll.voted]
            : scopedState.selectedOptionNos,
        expandedOptionNo: null,
      };
    });
  }, [canRespondToPoll, poll]);

  const showResultsView = useCallback(() => {
    if (!poll) {
      return;
    }

    setInteractionState((current) => {
      const scopedState = getScopedPollInteractionState(current, poll);
      return {
        ...scopedState,
        view: "results",
        expandedOptionNo: null,
      };
    });
  }, [poll]);

  const cancelVoteChange = useCallback(() => {
    if (!poll) {
      return;
    }

    setInteractionState((current) => {
      const scopedState = getScopedPollInteractionState(current, poll);
      return {
        ...scopedState,
        view: "results",
        selectedOptionNos: [...poll.voted],
        expandedOptionNo: null,
      };
    });
  }, [poll]);

  if (!poll) {
    return null;
  }

  const hasVoted = poll.voted.length > 0;
  const scopedState = getScopedPollInteractionState(interactionState, poll);
  const selectedOptions = new Set(scopedState.selectedOptionNos);
  const totalVotes = poll.options.reduce((total, option) => {
    return total + option.votes;
  }, 0);
  const votedOptionNos = new Set(poll.voted);
  const showSelectionIndicator = votedOptionNos.size > 0;
  const effectiveView = getEffectivePollView({
    canRespond: canRespondToPoll,
    isOpen: poll.is_open,
    scopedView: scopedState.view,
  });
  const expandedOptionNo = scopedState.expandedOptionNo;
  const voteOptionGroupName = `drop-poll-${poll.id}`;
  const submitButtonLabel = getPollSubmitLabel({
    isPending: voteMutation.isPending,
    hasVoted,
  });
  const showResultsFooterAction =
    effectiveView === "results" && poll.is_open && canRespondToPoll;
  const showVoteResultsFooterAction =
    effectiveView === "vote" && poll.is_open && canRespondToPoll && !hasVoted;
  const isChangingVote = effectiveView === "vote" && hasVoted;
  const showVoteEditFooterAction =
    effectiveView === "vote" && poll.is_open && isChangingVote;
  const resultsFooterActionLabel = hasVoted
    ? t(locale, "waves.poll.actions.changeVote")
    : t(locale, "waves.poll.actions.vote");
  const voteStatusLabel = showUpdated
    ? t(locale, "waves.poll.status.updated")
    : t(locale, "waves.poll.status.voted");
  const showMultichoiceActions =
    poll.multichoice && (selectedOptions.size > 0 || isChangingVote);
  const multichoiceSubmitDisabled =
    selectedOptions.size === 0 || voteMutation.isPending;

  return (
    <div
      role="presentation"
      className={POLL_CARD_CLASS_NAME}
      onClick={stopPollEventPropagation}
      onKeyDown={stopPollEventPropagation}
    >
      <PollCardHeader
        title="Poll"
        status={getPollClosingLabel(poll)}
        open={poll.is_open}
      />

      {effectiveView === "vote" && poll.is_open ? (
        <div className="tw-flex tw-flex-col tw-gap-2">
          {poll.options.map((option) => (
            <PollVoteOption
              key={option.option_no}
              label={option.option_string}
              checked={selectedOptions.has(option.option_no)}
              multichoice={poll.multichoice}
              groupName={voteOptionGroupName}
              disabled={voteMutation.isPending || !canRespondToPoll}
              onChange={() => handleVoteOptionChange(option.option_no)}
            />
          ))}
          {poll.multichoice && !isChangingVote && (
            <div
              className={`tw-grid tw-transition-all tw-duration-300 tw-ease-out ${
                showMultichoiceActions
                  ? "tw-mt-3.5 tw-grid-rows-[1fr] tw-opacity-100"
                  : "tw-mt-0 tw-grid-rows-[0fr] tw-opacity-0"
              }`}
            >
              <div
                aria-hidden={!showMultichoiceActions}
                inert={!showMultichoiceActions}
                className="tw-overflow-hidden"
              >
                <div className="tw-flex tw-gap-2">
                  <Button
                    type="button"
                    disabled={multichoiceSubmitDisabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSubmitVote().catch(() => undefined);
                    }}
                    variant="primary"
                    size="sm"
                    className="tw-flex-1"
                  >
                    {submitButtonLabel}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-2">
          {poll.options.map((option) => {
            const canShowOptionVoters = !poll.anonymous && option.votes > 0;
            const isExpanded =
              canShowOptionVoters && expandedOptionNo === option.option_no;

            return (
              <div key={option.option_no}>
                <PollResultOption
                  label={option.option_string}
                  votes={option.votes}
                  totalVotes={totalVotes}
                  canShowVoters={canShowOptionVoters}
                  isSelected={votedOptionNos.has(option.option_no)}
                  isDimmed={hasVoted && !votedOptionNos.has(option.option_no)}
                  isExpanded={isExpanded}
                  showSelectionIndicator={showSelectionIndicator}
                  onToggle={() =>
                    setInteractionState((current) => {
                      const currentState = getScopedPollInteractionState(
                        current,
                        poll
                      );
                      return {
                        ...currentState,
                        expandedOptionNo:
                          currentState.expandedOptionNo === option.option_no
                            ? null
                            : option.option_no,
                      };
                    })
                  }
                />
                {canShowOptionVoters && (
                  <div
                    className={`tw-grid tw-transition-all tw-duration-300 tw-ease-out ${
                      isExpanded
                        ? "tw-mb-1 tw-mt-1 tw-grid-rows-[1fr] tw-opacity-100"
                        : "tw-mb-0 tw-mt-0 tw-grid-rows-[0fr] tw-opacity-0"
                    }`}
                  >
                    <div
                      aria-hidden={!isExpanded}
                      inert={!isExpanded}
                      className="tw-overflow-hidden"
                    >
                      <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-2.5">
                        <PollOptionVoters
                          dropId={drop.id}
                          option={option}
                          enabled={isExpanded}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showVoteResultsFooterAction && (
        <div className={POLL_FOOTER_CLASS_NAME}>
          <div className="tw-flex tw-justify-start">
            <Button
              type="button"
              disabled={voteMutation.isPending}
              onClick={(event) => {
                event.stopPropagation();
                showResultsView();
              }}
              variant="secondary"
              size="xs"
            >
              {t(locale, "waves.poll.actions.viewResults")}
            </Button>
          </div>
        </div>
      )}

      {showVoteEditFooterAction && (
        <div className={POLL_FOOTER_CLASS_NAME}>
          {poll.multichoice ? (
            <div className="tw-flex tw-gap-2">
              <Button
                type="button"
                disabled={voteMutation.isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  cancelVoteChange();
                }}
                variant="secondary"
                size="sm"
                className="tw-flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={multichoiceSubmitDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  handleSubmitVote().catch(() => undefined);
                }}
                variant="primary"
                size="sm"
                className="tw-flex-1"
              >
                {submitButtonLabel}
              </Button>
            </div>
          ) : (
            <div className="tw-flex tw-justify-start">
              <Button
                type="button"
                disabled={voteMutation.isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  cancelVoteChange();
                }}
                variant="secondary"
                size="xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {showResultsFooterAction && (
        <div className={POLL_FOOTER_CLASS_NAME}>
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <Button
              type="button"
              disabled={voteMutation.isPending}
              onClick={(event) => {
                event.stopPropagation();
                showVoteView();
              }}
              variant="secondary"
              size="xs"
            >
              {resultsFooterActionLabel}
            </Button>
            {hasVoted && (
              <PollVotedStatus label={voteStatusLabel} updated={showUpdated} />
            )}
          </div>
        </div>
      )}

      {pollBallotsPaused && poll.is_open && (
        <div className={POLL_FOOTER_CLASS_NAME}>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "wavesMove.paused")}
          </p>
        </div>
      )}
    </div>
  );
}
