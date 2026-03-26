"use client";

import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  getDefaultQuickVoteAmount,
  normalizeQuickVoteAmount,
} from "@/hooks/memesQuickVote.helpers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMemesQuickVoteQueue } from "@/hooks/useMemesQuickVoteQueue";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MemesQuickVoteControls from "./MemesQuickVoteControls";
import MemesQuickVoteDialogSkeleton from "./MemesQuickVoteDialogSkeleton";
import MemesQuickVotePreview from "./MemesQuickVotePreview";

const QUICK_VOTE_MOBILE_QUERY = "(max-width: 767px)";
const QUICK_VOTE_BAR_FEEDBACK_DURATION_MS = 650;

type VoteFeedbackSource = "custom-submit" | "quick-amount";
type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

interface MemesQuickVoteDialogProps {
  readonly isOpen: boolean;
  readonly sessionId: number;
  readonly onClose: () => void;
}

interface MemesQuickVoteDialogContentProps {
  readonly activeDrop: NonNullable<
    ReturnType<typeof useMemesQuickVoteQueue>["activeDrop"]
  >;
  readonly isMobile: boolean;
  readonly latestUsedAmount: number | null;
  readonly onClose: () => void;
  readonly remainingCount: number;
  readonly recentAmounts: number[];
  readonly submitVote: ReturnType<typeof useMemesQuickVoteQueue>["submitVote"];
  readonly skipDrop: ReturnType<typeof useMemesQuickVoteQueue>["skipDrop"];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
}

function MemesQuickVoteDialogContent({
  activeDrop,
  isMobile,
  latestUsedAmount,
  onClose,
  remainingCount,
  recentAmounts,
  submitVote,
  skipDrop,
  uncastPower,
  votingLabel,
}: MemesQuickVoteDialogContentProps) {
  const maxRating = activeDrop.context_profile_context?.max_rating ?? 0;
  const defaultAmount = useMemo(
    () => (maxRating > 0 ? getDefaultQuickVoteAmount(maxRating) : 1),
    [maxRating]
  );
  const [customValue, setCustomValue] = useState(() => `${defaultAmount}`);
  const [isCustomOpen, setIsCustomOpen] = useState(
    () => recentAmounts.length === 0
  );
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [voteFeedback, setVoteFeedback] = useState<{
    readonly amount: number;
    readonly source: VoteFeedbackSource;
  } | null>(null);
  const barVoteTimeoutRef = useRef<TimeoutHandle | null>(null);
  const isVoteFeedbackActive = voteFeedback !== null;
  const isControlsSubmitting = isAdvancing || isVoteFeedbackActive;
  const normalizedLatestUsedAmount =
    latestUsedAmount === null
      ? null
      : normalizeQuickVoteAmount(latestUsedAmount, maxRating);
  const normalizedCustomAmount = normalizeQuickVoteAmount(
    customValue,
    maxRating
  );
  const visibleQuickAmounts = useMemo(() => {
    if (maxRating <= 0) {
      return [];
    }

    return Array.from(
      new Set(
        recentAmounts
          .map((amount) => normalizeQuickVoteAmount(amount, maxRating))
          .filter((amount): amount is number => amount !== null)
      )
    ).sort((left, right) => left - right);
  }, [maxRating, recentAmounts]);

  const swipeVoteAmount = isCustomOpen
    ? normalizedCustomAmount
    : (normalizedLatestUsedAmount ?? normalizedCustomAmount);

  const clearBarVoteTimeout = useCallback(() => {
    if (barVoteTimeoutRef.current === null) {
      return;
    }

    globalThis.clearTimeout(barVoteTimeoutRef.current);
    barVoteTimeoutRef.current = null;
  }, []);

  const queueVoteAmount = useCallback(
    (amount: number | string) => {
      submitVote(activeDrop, amount)
        .then((wasQueued) => {
          if (!wasQueued) {
            setIsAdvancing(false);
            setVoteFeedback(null);
          }
        })
        .catch(() => {
          setIsAdvancing(false);
          setVoteFeedback(null);
        });
    },
    [activeDrop, submitVote]
  );

  useEffect(
    () => () => {
      clearBarVoteTimeout();
    },
    [clearBarVoteTimeout]
  );

  const handleBarVoteAmount = useCallback(
    (amount: number | string, source: VoteFeedbackSource) => {
      if (isAdvancing || isVoteFeedbackActive) {
        return;
      }

      const normalizedAmount = normalizeQuickVoteAmount(amount, maxRating);

      if (normalizedAmount === null) {
        return;
      }

      setIsAdvancing(true);
      setVoteFeedback({
        amount: normalizedAmount,
        source,
      });
      clearBarVoteTimeout();
      barVoteTimeoutRef.current = globalThis.setTimeout(() => {
        barVoteTimeoutRef.current = null;
        setIsAdvancing(true);
        queueVoteAmount(normalizedAmount);
      }, QUICK_VOTE_BAR_FEEDBACK_DURATION_MS);
    },
    [
      clearBarVoteTimeout,
      isAdvancing,
      isVoteFeedbackActive,
      maxRating,
      queueVoteAmount,
    ]
  );

  const queueSkip = () => {
    skipDrop(activeDrop);
  };

  const handleSkip = () => {
    if (isControlsSubmitting) {
      return;
    }

    setIsAdvancing(true);
    queueSkip();
  };

  return (
    <div className="tw-flex tw-h-full tw-flex-col md:tw-grid md:tw-min-h-0 md:tw-grid-cols-[minmax(0,1.22fr)_minmax(25rem,1fr)] md:tw-items-stretch">
      {isMobile && (
        <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/40 tw-px-4 tw-pb-3 tw-pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] tw-backdrop-blur-xl md:tw-hidden">
          <button
            type="button"
            onClick={onClose}
            data-autofocus="true"
            className="tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.05] tw-text-iron-400 tw-shadow-inner tw-transition-colors active:tw-bg-white/10"
            aria-label="Close quick vote"
          >
            <XMarkIcon className="tw-size-5 tw-shrink-0" />
          </button>

          <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-px-3">
            <span className="tw-truncate tw-text-[13px] tw-font-bold tw-leading-tight tw-text-iron-300">
              {formatNumberWithCommas(remainingCount)} unexplored
            </span>
          </div>

          <div className="tw-size-10 tw-shrink-0" aria-hidden="true" />
        </div>
      )}

      {isMobile ? (
        <div className="tw-relative tw-z-10 tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-flex-col tw-overflow-hidden">
          <div className="tw-h-full">
            <MemesQuickVotePreview
              drop={activeDrop}
              isBusy={isAdvancing}
              isMobile={isMobile}
              remainingCount={remainingCount}
              swipeVoteAmount={swipeVoteAmount}
              uncastPower={uncastPower}
              votingLabel={votingLabel}
              onAdvanceStart={() => {
                setIsAdvancing(true);
              }}
              onSkip={queueSkip}
              onVoteWithSwipe={() => {
                if (swipeVoteAmount === null) {
                  setIsAdvancing(false);
                  return;
                }

                queueVoteAmount(swipeVoteAmount);
              }}
            />
          </div>

          <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-20 md:tw-hidden">
            <MemesQuickVoteControls
              customValue={customValue}
              drop={activeDrop}
              isCustomOpen={isCustomOpen}
              isSubmitting={isControlsSubmitting}
              feedbackAmount={voteFeedback?.amount ?? null}
              feedbackSource={voteFeedback?.source ?? null}
              isVoteFeedbackActive={isVoteFeedbackActive}
              latestUsedAmount={normalizedLatestUsedAmount}
              remainingCount={remainingCount}
              quickAmounts={visibleQuickAmounts}
              uncastPower={uncastPower}
              votingLabel={votingLabel}
              onCustomChange={(value) => {
                if (value === "") {
                  setCustomValue("");
                  return;
                }

                setCustomValue(value.replace(/[^\d]/g, ""));
              }}
              onCustomSubmit={() => {
                handleBarVoteAmount(customValue, "custom-submit");
              }}
              onOpenCustom={() => {
                setIsCustomOpen((current) => !current);
              }}
              onSkip={handleSkip}
              onVoteAmount={(amount) => {
                handleBarVoteAmount(amount, "quick-amount");
              }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="tw-min-h-0 tw-flex-1 md:tw-min-h-0 md:tw-border-y-0 md:tw-border-b-0 md:tw-border-l-0 md:tw-border-r md:tw-border-solid md:tw-border-white/10">
            <MemesQuickVotePreview
              drop={activeDrop}
              isBusy={isAdvancing}
              isMobile={isMobile}
              remainingCount={remainingCount}
              swipeVoteAmount={swipeVoteAmount}
              uncastPower={uncastPower}
              votingLabel={votingLabel}
              onAdvanceStart={() => {
                setIsAdvancing(true);
              }}
              onSkip={queueSkip}
              onVoteWithSwipe={() => {
                if (swipeVoteAmount === null) {
                  setIsAdvancing(false);
                  return;
                }

                queueVoteAmount(swipeVoteAmount);
              }}
            />
          </div>

          <div className="tw-shrink-0 md:tw-min-h-0 md:tw-self-stretch">
            <MemesQuickVoteControls
              customValue={customValue}
              drop={activeDrop}
              isCustomOpen={isCustomOpen}
              isSubmitting={isControlsSubmitting}
              feedbackAmount={voteFeedback?.amount ?? null}
              feedbackSource={voteFeedback?.source ?? null}
              isVoteFeedbackActive={isVoteFeedbackActive}
              latestUsedAmount={normalizedLatestUsedAmount}
              remainingCount={remainingCount}
              quickAmounts={visibleQuickAmounts}
              uncastPower={uncastPower}
              votingLabel={votingLabel}
              onCustomChange={(value) => {
                if (value === "") {
                  setCustomValue("");
                  return;
                }

                setCustomValue(value.replace(/[^\d]/g, ""));
              }}
              onCustomSubmit={() => {
                handleBarVoteAmount(customValue, "custom-submit");
              }}
              onOpenCustom={() => {
                setIsCustomOpen((current) => !current);
              }}
              onSkip={handleSkip}
              onVoteAmount={(amount) => {
                handleBarVoteAmount(amount, "quick-amount");
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MemesQuickVoteDialogDoneState({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  return (
    <div className="tw-relative tw-flex tw-min-h-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-[#0c0c0d]/95 tw-px-6 tw-py-10 md:tw-px-8 md:tw-py-12">
      <div className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-h-72 tw-w-72 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-primary-500/10 tw-blur-[84px]" />
      <div className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-h-44 tw-w-44 -tw-translate-x-1/2 -tw-translate-y-[58%] tw-rounded-full tw-bg-white/5 tw-blur-[48px]" />
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_46%)]" />

      <div className="tw-relative tw-z-10 tw-flex tw-w-full tw-max-w-md tw-flex-col tw-items-center tw-text-center">
        <div className="tw-relative tw-mx-auto tw-mb-8 tw-flex tw-size-24 tw-items-center tw-justify-center md:tw-size-28">
          <div className="tw-absolute tw-inset-0 tw-rounded-full tw-bg-primary-500/10 tw-blur-2xl" />
          <div className="tw-absolute tw-inset-3 tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.03] tw-backdrop-blur-md" />
          <div className="tw-relative tw-flex tw-size-20 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/50 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:tw-size-24">
            <CheckCircleIcon className="tw-size-10 tw-text-iron-100 md:tw-size-12" />
          </div>
        </div>
        <p className="tw-mb-3 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-[1.75rem]">
          You&apos;re all caught up
        </p>
        <p className="tw-mx-auto tw-mb-8 tw-max-w-sm tw-text-sm tw-leading-6 tw-text-iron-400 md:tw-text-[15px]">
          No unrated memes are left in quick vote right now.
        </p>

        <button
          type="button"
          data-autofocus="true"
          onClick={onClose}
          className="tw-inline-flex tw-h-11 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.05] tw-px-6 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-all active:tw-scale-[0.98] desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-white/[0.08]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function MemesQuickVoteDialogErrorState({
  onRetry,
}: {
  readonly onRetry: () => void;
}) {
  return (
    <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center tw-py-8">
      <div className="tw-w-full tw-max-w-xl tw-rounded-[1.75rem] tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-6 tw-py-10 tw-text-center tw-shadow-[0_24px_60px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm">
        <p className="tw-mb-2 tw-text-lg tw-font-semibold tw-text-white">
          Couldn&apos;t load your queue
        </p>
        <p className="tw-mb-4 tw-text-sm tw-text-iron-400">
          Quick vote couldn&apos;t reach the leaderboard. Try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-transition-colors desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/10"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function MemesQuickVoteDialog({
  isOpen,
  sessionId,
  onClose,
}: MemesQuickVoteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef("");
  const isMobile = useMediaQuery(QUICK_VOTE_MOBILE_QUERY);
  const {
    activeDrop,
    hasDiscoveryError,
    isExhausted,
    isLoading,
    latestUsedAmount,
    recentAmounts,
    remainingCount,
    retryDiscovery,
    submitVote,
    skipDrop,
    uncastPower,
    votingLabel,
  } = useMemesQuickVoteQueue({ enabled: isOpen, sessionId });

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (!isOpen) {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = previousBodyOverflowRef.current;
      previouslyFocusedElementRef.current?.focus();
      return;
    }

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
    previousBodyOverflowRef.current = document.body.style.overflow;

    if (!dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const autofocusTarget = dialog.querySelector<HTMLElement>(
        "[data-autofocus='true']"
      );
      autofocusTarget?.focus();
    });

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current;
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();

      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [onClose]);

  let dialogBody: ReactNode;

  if (isExhausted) {
    dialogBody = <MemesQuickVoteDialogDoneState onClose={onClose} />;
  } else if (!activeDrop && hasDiscoveryError) {
    dialogBody = <MemesQuickVoteDialogErrorState onRetry={retryDiscovery} />;
  } else if (!activeDrop && isLoading) {
    dialogBody = <MemesQuickVoteDialogSkeleton />;
  } else if (!activeDrop) {
    dialogBody = <MemesQuickVoteDialogSkeleton />;
  } else {
    dialogBody = (
      <MemesQuickVoteDialogContent
        key={`${sessionId}:${activeDrop.serial_no}:${isOpen ? "open" : "closed"}`}
        activeDrop={activeDrop}
        isMobile={isMobile}
        latestUsedAmount={latestUsedAmount}
        onClose={onClose}
        remainingCount={remainingCount}
        recentAmounts={recentAmounts}
        submitVote={submitVote}
        skipDrop={skipDrop}
        uncastPower={uncastPower}
        votingLabel={votingLabel}
      />
    );
  }

  return (
    <dialog
      ref={dialogRef}
      data-session-id={sessionId}
      className="tailwind-scope tw-fixed tw-inset-0 tw-m-0 tw-h-[100dvh] tw-max-h-[100dvh] tw-w-screen tw-max-w-none tw-overflow-hidden tw-border-none tw-bg-transparent tw-p-0"
      aria-label="Memes quick vote"
    >
      <div
        className="tw-flex tw-h-full tw-w-full tw-items-stretch tw-justify-center tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px] md:tw-items-center md:tw-p-6"
        onClick={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }

          onClose();
        }}
      >
        <div className="tw-relative tw-flex tw-h-full tw-max-h-full tw-w-full tw-flex-col tw-overflow-hidden tw-bg-[#0a0a0a] tw-shadow-[0_0_80px_rgba(0,0,0,0.8)] md:tw-h-[38rem] md:tw-max-h-[min(calc(100vh-3rem),38rem)] md:tw-max-w-[68rem] md:tw-rounded-2xl md:tw-border md:tw-border-solid md:tw-border-white/10">
          <button
            type="button"
            data-autofocus={isMobile ? undefined : "true"}
            onClick={onClose}
            className="tw-absolute tw-right-4 tw-top-[calc(env(safe-area-inset-top,0px)+0.75rem)] tw-z-20 tw-hidden tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.05] tw-text-iron-400 tw-shadow-inner tw-backdrop-blur-md tw-transition-colors active:tw-bg-white/10 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-text-white md:tw-right-6 md:tw-top-6 md:tw-inline-flex"
            aria-label="Close quick vote"
          >
            <XMarkIcon className="tw-size-5 tw-shrink-0" />
          </button>

          <div className="tw-relative tw-z-10 tw-min-h-0 tw-flex-1 tw-overflow-hidden md:tw-p-0">
            {dialogBody}
          </div>
        </div>
      </div>
    </dialog>
  );
}
