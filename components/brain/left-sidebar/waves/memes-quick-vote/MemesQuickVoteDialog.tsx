"use client";

import {
  formatMemesQuickVoteLeftThisRoundText,
  formatMemesQuickVoteUnratedText,
  getDefaultQuickVoteAmount,
  getQuickVoteRatingRange,
  normalizeQuickVoteAmount,
} from "@/hooks/memesQuickVote.helpers";
import type { MemesQuickVoteDialogState } from "@/hooks/useMemesQuickVoteDialogController";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  MemesQuickVoteDialogDoneState,
  MemesQuickVoteDialogErrorState,
  MemesQuickVoteDialogRestartState,
} from "./MemesQuickVoteDialogStates";
import { XMarkIcon } from "@heroicons/react/24/outline";
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

type MemesQuickVoteDialogProps = MemesQuickVoteDialogState;

interface MemesQuickVoteDialogContentProps {
  readonly activeDrop: NonNullable<MemesQuickVoteDialogProps["activeDrop"]>;
  readonly isMobile: boolean;
  readonly leftThisRoundCount: number;
  readonly latestUsedAmount: number | null;
  readonly nextDrop: MemesQuickVoteDialogProps["nextDrop"];
  readonly onClose: () => void;
  readonly recentAmounts: number[];
  readonly sessionId: number;
  readonly submitVote: MemesQuickVoteDialogProps["submitVote"];
  readonly skipDrop: MemesQuickVoteDialogProps["skipDrop"];
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
}

interface MemesQuickVotePreviewPaneProps {
  readonly activeDrop: NonNullable<MemesQuickVoteDialogProps["activeDrop"]>;
  readonly className: string;
  readonly isBusy: boolean;
  readonly isMobile: boolean;
  readonly leftThisRoundCount: number;
  readonly nextDrop: MemesQuickVoteDialogProps["nextDrop"];
  readonly onAdvanceStart: () => void;
  readonly onSkip: () => void;
  readonly onVoteWithSwipe: () => void;
  readonly sessionId: number;
  readonly swipeVoteAmount: number | null;
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
}

interface MemesQuickVoteControlsPaneProps {
  readonly className: string;
  readonly customValue: string;
  readonly drop: NonNullable<MemesQuickVoteDialogProps["activeDrop"]>;
  readonly feedbackAmount: number | null;
  readonly feedbackSource: VoteFeedbackSource | null;
  readonly isCustomOpen: boolean;
  readonly isSubmitting: boolean;
  readonly isVoteFeedbackActive: boolean;
  readonly leftThisRoundCount: number;
  readonly latestUsedAmount: number | null;
  readonly quickAmounts: readonly number[];
  readonly allowsNegativeVotes: boolean;
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
  readonly onCustomChange: (value: string) => void;
  readonly onCustomSubmit: () => void;
  readonly onOpenCustom: () => void;
  readonly onSkip: () => void;
  readonly onVoteAmount: (amount: number) => void;
}

function getQuickVotePreloadedNextDrop(
  isOpen: boolean,
  nextDrop: MemesQuickVoteDialogProps["nextDrop"]
): MemesQuickVoteDialogProps["nextDrop"] {
  if (!isOpen || !nextDrop) {
    return null;
  }

  const artworkMedia = nextDrop.parts.at(0)?.media.at(0);
  const mediaMimeType = artworkMedia?.mime_type.toLowerCase();
  const mediaUrl = artworkMedia?.url.toLowerCase();
  const isGlbMedia =
    mediaMimeType === "model/gltf-binary" ||
    mediaMimeType === "model/gltf+json" ||
    (mediaUrl?.endsWith(".glb") ?? false) ||
    (mediaUrl?.endsWith(".gltf") ?? false);

  return isGlbMedia ? null : nextDrop;
}

function MemesQuickVotePreviewStack({
  activeDrop,
  isBusy,
  isMobile,
  leftThisRoundCount,
  nextDrop,
  onAdvanceStart,
  onSkip,
  onVoteWithSwipe,
  sessionId,
  swipeVoteAmount,
  uncastPower,
  unratedCount,
  votingLabel,
}: {
  readonly activeDrop: NonNullable<MemesQuickVoteDialogProps["activeDrop"]>;
  readonly isBusy: boolean;
  readonly isMobile: boolean;
  readonly leftThisRoundCount: number;
  readonly nextDrop: MemesQuickVoteDialogProps["nextDrop"];
  readonly onAdvanceStart: () => void;
  readonly onSkip: () => void;
  readonly onVoteWithSwipe: () => void;
  readonly sessionId: number;
  readonly swipeVoteAmount: number | null;
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
}) {
  const preloadedCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const preloadedCard = preloadedCardRef.current;

    if (!preloadedCard) {
      return;
    }

    preloadedCard.setAttribute("inert", "");

    return () => {
      preloadedCard.removeAttribute("inert");
    };
  }, [nextDrop]);

  return (
    <div className="tw-relative tw-h-full tw-w-full">
      {nextDrop && (
        <div
          ref={preloadedCardRef}
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-0 tw-overflow-hidden tw-opacity-0"
          data-testid="quick-vote-preview-card-next"
        >
          <MemesQuickVotePreview
            key={`next:${sessionId}:${nextDrop.id}`}
            drop={nextDrop}
            isBusy={false}
            isMobile={isMobile}
            leftThisRoundCount={leftThisRoundCount}
            renderMode="preloaded"
            swipeVoteAmount={swipeVoteAmount}
            uncastPower={uncastPower}
            unratedCount={unratedCount}
            votingLabel={votingLabel}
            onAdvanceStart={() => undefined}
            onSkip={() => undefined}
            onVoteWithSwipe={() => undefined}
          />
        </div>
      )}

      <div className="tw-relative tw-z-10 tw-h-full">
        <MemesQuickVotePreview
          key={`active:${sessionId}:${activeDrop.id}`}
          drop={activeDrop}
          isBusy={isBusy}
          isMobile={isMobile}
          leftThisRoundCount={leftThisRoundCount}
          renderMode="active"
          swipeVoteAmount={swipeVoteAmount}
          uncastPower={uncastPower}
          unratedCount={unratedCount}
          votingLabel={votingLabel}
          onAdvanceStart={onAdvanceStart}
          onSkip={onSkip}
          onVoteWithSwipe={onVoteWithSwipe}
        />
      </div>
    </div>
  );
}

function MemesQuickVotePreviewPane({
  activeDrop,
  className,
  isBusy,
  isMobile,
  leftThisRoundCount,
  nextDrop,
  onAdvanceStart,
  onSkip,
  onVoteWithSwipe,
  sessionId,
  swipeVoteAmount,
  uncastPower,
  unratedCount,
  votingLabel,
}: MemesQuickVotePreviewPaneProps) {
  return (
    <div className={className}>
      <MemesQuickVotePreviewStack
        activeDrop={activeDrop}
        isBusy={isBusy}
        isMobile={isMobile}
        leftThisRoundCount={leftThisRoundCount}
        nextDrop={nextDrop}
        sessionId={sessionId}
        swipeVoteAmount={swipeVoteAmount}
        uncastPower={uncastPower}
        unratedCount={unratedCount}
        votingLabel={votingLabel}
        onAdvanceStart={onAdvanceStart}
        onSkip={onSkip}
        onVoteWithSwipe={onVoteWithSwipe}
      />
    </div>
  );
}

function MemesQuickVoteControlsPane({
  className,
  customValue,
  drop,
  feedbackAmount,
  feedbackSource,
  isCustomOpen,
  isSubmitting,
  isVoteFeedbackActive,
  leftThisRoundCount,
  latestUsedAmount,
  quickAmounts,
  allowsNegativeVotes,
  uncastPower,
  unratedCount,
  votingLabel,
  onCustomChange,
  onCustomSubmit,
  onOpenCustom,
  onSkip,
  onVoteAmount,
}: MemesQuickVoteControlsPaneProps) {
  return (
    <div className={className}>
      <MemesQuickVoteControls
        customValue={customValue}
        drop={drop}
        isCustomOpen={isCustomOpen}
        isSubmitting={isSubmitting}
        feedbackAmount={feedbackAmount}
        feedbackSource={feedbackSource}
        isVoteFeedbackActive={isVoteFeedbackActive}
        leftThisRoundCount={leftThisRoundCount}
        latestUsedAmount={latestUsedAmount}
        quickAmounts={quickAmounts}
        allowsNegativeVotes={allowsNegativeVotes}
        uncastPower={uncastPower}
        unratedCount={unratedCount}
        votingLabel={votingLabel}
        onCustomChange={onCustomChange}
        onCustomSubmit={onCustomSubmit}
        onOpenCustom={onOpenCustom}
        onSkip={onSkip}
        onVoteAmount={onVoteAmount}
      />
    </div>
  );
}

function MemesQuickVoteDialogContent({
  activeDrop,
  isMobile,
  leftThisRoundCount,
  latestUsedAmount,
  nextDrop,
  onClose,
  recentAmounts,
  sessionId,
  submitVote,
  skipDrop,
  uncastPower,
  unratedCount,
  votingLabel,
}: MemesQuickVoteDialogContentProps) {
  const ratingRange = useMemo(
    () => getQuickVoteRatingRange(activeDrop),
    [activeDrop]
  );
  const allowsNegativeVotes = ratingRange.minRating < 0;
  const defaultAmount = useMemo(
    () =>
      ratingRange.maxRating > 0
        ? getDefaultQuickVoteAmount(ratingRange.maxRating)
        : 1,
    [ratingRange.maxRating]
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
      : normalizeQuickVoteAmount(latestUsedAmount, ratingRange);
  const normalizedCustomAmount = normalizeQuickVoteAmount(
    customValue,
    ratingRange
  );
  const visibleQuickAmounts = useMemo(() => {
    if (ratingRange.maxRating <= 0 && ratingRange.minRating >= 0) {
      return [];
    }

    return Array.from(
      new Set(
        recentAmounts
          .map((amount) => normalizeQuickVoteAmount(amount, ratingRange))
          .filter((amount): amount is number => amount !== null)
      )
    ).sort((left, right) => left - right);
  }, [ratingRange, recentAmounts]);

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

      const normalizedAmount = normalizeQuickVoteAmount(amount, ratingRange);

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
      ratingRange,
      queueVoteAmount,
    ]
  );

  const queueSkip = useCallback(() => {
    skipDrop(activeDrop)
      .then((wasQueued) => {
        if (!wasQueued) {
          setIsAdvancing(false);
        }
      })
      .catch(() => {
        setIsAdvancing(false);
      });
  }, [activeDrop, skipDrop]);

  const handleAdvanceStart = useCallback(() => {
    setIsAdvancing(true);
  }, []);

  const handleSkip = () => {
    if (isControlsSubmitting) {
      return;
    }

    setIsAdvancing(true);
    queueSkip();
  };

  const handleVoteWithSwipe = useCallback(() => {
    if (swipeVoteAmount === null) {
      setIsAdvancing(false);
      return;
    }

    setIsAdvancing(true);
    queueVoteAmount(swipeVoteAmount);
  }, [queueVoteAmount, swipeVoteAmount]);

  const handleCustomChange = useCallback(
    (value: string) => {
      if (value === "") {
        setCustomValue("");
        return;
      }

      if (!allowsNegativeVotes) {
        setCustomValue(value.replace(/[^\d]/g, ""));
        return;
      }

      const isNegative = value.trim().startsWith("-");
      const digits = value.replace(/[^\d]/g, "");

      if (digits.length === 0) {
        setCustomValue(isNegative ? "-" : "");
        return;
      }

      setCustomValue(`${isNegative ? "-" : ""}${digits}`);
    },
    [allowsNegativeVotes]
  );

  const handleCustomSubmit = useCallback(() => {
    handleBarVoteAmount(customValue, "custom-submit");
  }, [customValue, handleBarVoteAmount]);

  const handleToggleCustom = useCallback(() => {
    setIsCustomOpen((current) => !current);
  }, []);

  const handleQuickAmountVote = useCallback(
    (amount: number) => {
      handleBarVoteAmount(amount, "quick-amount");
    },
    [handleBarVoteAmount]
  );
  const previewPaneProps = {
    activeDrop,
    isBusy: isControlsSubmitting,
    isMobile,
    leftThisRoundCount,
    nextDrop,
    onAdvanceStart: handleAdvanceStart,
    onSkip: queueSkip,
    onVoteWithSwipe: handleVoteWithSwipe,
    sessionId,
    swipeVoteAmount,
    uncastPower,
    unratedCount,
    votingLabel,
  } satisfies Omit<MemesQuickVotePreviewPaneProps, "className">;
  const controlsPaneProps = {
    customValue,
    drop: activeDrop,
    feedbackAmount: voteFeedback?.amount ?? null,
    feedbackSource: voteFeedback?.source ?? null,
    isCustomOpen,
    isSubmitting: isControlsSubmitting,
    isVoteFeedbackActive,
    leftThisRoundCount,
    latestUsedAmount: normalizedLatestUsedAmount,
    quickAmounts: visibleQuickAmounts,
    allowsNegativeVotes,
    uncastPower,
    unratedCount,
    votingLabel,
    onCustomChange: handleCustomChange,
    onCustomSubmit: handleCustomSubmit,
    onOpenCustom: handleToggleCustom,
    onSkip: handleSkip,
    onVoteAmount: handleQuickAmountVote,
  } satisfies Omit<MemesQuickVoteControlsPaneProps, "className">;

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
              {formatMemesQuickVoteLeftThisRoundText(leftThisRoundCount)}
            </span>
            <span className="tw-truncate tw-text-[12px] tw-font-medium tw-leading-tight tw-text-iron-500">
              {formatMemesQuickVoteUnratedText(unratedCount)}
            </span>
          </div>

          <div className="tw-size-10 tw-shrink-0" aria-hidden="true" />
        </div>
      )}

      {isMobile ? (
        <div className="tw-relative tw-z-10 tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-flex-col tw-overflow-hidden">
          <MemesQuickVotePreviewPane
            className="tw-min-h-0 tw-flex-1"
            {...previewPaneProps}
          />

          <MemesQuickVoteControlsPane
            className="tw-shrink-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-[#0a0a0a] md:tw-hidden"
            {...controlsPaneProps}
          />
        </div>
      ) : (
        <>
          <MemesQuickVotePreviewPane
            className="tw-min-h-0 tw-flex-1 md:tw-min-h-0 md:tw-border-y-0 md:tw-border-b-0 md:tw-border-l-0 md:tw-border-r md:tw-border-solid md:tw-border-white/10"
            {...previewPaneProps}
          />

          <MemesQuickVoteControlsPane
            className="tw-shrink-0 md:tw-min-h-0 md:tw-self-stretch"
            {...controlsPaneProps}
          />
        </>
      )}
    </div>
  );
}

export default function MemesQuickVoteDialog({
  isOpen,
  sessionId,
  onClose,
  activeDrop,
  hasDiscoveryError,
  isExhausted,
  isRestartingRound,
  leftThisRoundCount,
  latestUsedAmount,
  nextDrop,
  recentAmounts,
  retryDiscovery,
  submitVote,
  skipDrop,
  uncastPower,
  unratedCount,
  votingLabel,
}: MemesQuickVoteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef("");
  const isMobile = useMediaQuery(QUICK_VOTE_MOBILE_QUERY);
  const showStandaloneStateShellClose = activeDrop === null && !isExhausted;

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

  let dialogBody: ReactNode = null;

  if (isOpen) {
    if (isRestartingRound) {
      dialogBody = <MemesQuickVoteDialogRestartState />;
    } else if (isExhausted) {
      dialogBody = (
        <MemesQuickVoteDialogDoneState
          description="No unrated memes are left in quick vote right now."
          onClose={onClose}
          title="You're all caught up"
        />
      );
    } else if (!activeDrop && hasDiscoveryError) {
      dialogBody = <MemesQuickVoteDialogErrorState onRetry={retryDiscovery} />;
    } else if (!activeDrop) {
      dialogBody = <MemesQuickVoteDialogSkeleton />;
    } else {
      const contentResetKey = `${sessionId}:${activeDrop.id}:open`;
      const preloadedNextDrop = getQuickVotePreloadedNextDrop(isOpen, nextDrop);

      dialogBody = (
        <MemesQuickVoteDialogContent
          key={contentResetKey}
          activeDrop={activeDrop}
          isMobile={isMobile}
          leftThisRoundCount={leftThisRoundCount}
          latestUsedAmount={latestUsedAmount}
          nextDrop={preloadedNextDrop}
          onClose={onClose}
          recentAmounts={recentAmounts}
          sessionId={sessionId}
          submitVote={submitVote}
          skipDrop={skipDrop}
          uncastPower={uncastPower}
          unratedCount={unratedCount}
          votingLabel={votingLabel}
        />
      );
    }
  }

  return (
    <dialog
      ref={dialogRef}
      data-session-id={sessionId}
      className="tailwind-scope tw-fixed tw-inset-0 tw-m-0 tw-h-[100dvh] tw-max-h-[100dvh] tw-w-screen tw-max-w-none tw-overflow-hidden tw-border-none tw-bg-transparent tw-p-0"
      aria-label="Memes quick vote"
    >
      {isOpen && (
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
              data-autofocus={
                !isMobile || showStandaloneStateShellClose ? "true" : undefined
              }
              onClick={onClose}
              className={`tw-absolute tw-right-4 tw-top-[calc(env(safe-area-inset-top,0px)+0.75rem)] tw-z-20 tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.05] tw-text-iron-400 tw-shadow-inner tw-backdrop-blur-md tw-transition-colors active:tw-bg-white/10 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-text-white md:tw-right-6 md:tw-top-6 ${
                showStandaloneStateShellClose
                  ? "tw-inline-flex md:tw-inline-flex"
                  : "tw-hidden md:tw-inline-flex"
              }`}
              aria-label="Close quick vote"
            >
              <XMarkIcon className="tw-size-5 tw-shrink-0" />
            </button>

            <div className="tw-relative tw-z-10 tw-min-h-0 tw-flex-1 tw-overflow-hidden md:tw-p-0">
              {dialogBody}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
