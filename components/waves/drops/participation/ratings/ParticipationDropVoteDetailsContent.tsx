"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ReactNode } from "react";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useDropVoteLogs } from "@/hooks/useDropVoteLogs";
import { useDropVoters } from "@/hooks/useDropVoters";
import {
  ParticipationDropVoteDetailsLogRow,
  ParticipationDropVoteDetailsVoterRow,
} from "./ParticipationDropVoteDetailsRows";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import { t } from "@/i18n/messages";

type VoteDetailsTab = "voters" | "logs";

interface ParticipationDropVoteDetailsContentProps {
  readonly drop: ApiDrop;
  readonly activeTab: VoteDetailsTab;
  readonly isOpen: boolean;
  readonly onActiveTabChange: (tab: VoteDetailsTab) => void;
  readonly onClose: () => void;
  readonly showHeader: boolean;
}

interface VoteDetailsErrorStateProps {
  readonly label: string;
  readonly onRetry: () => void;
}

function LoadingBar() {
  return (
    <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
      <div className="tw-h-full tw-w-full tw-animate-loading-bar tw-bg-indigo-400" />
    </div>
  );
}

function VoteDetailsEmptyState({ label }: { readonly label: string }) {
  return (
    <div className="tw-flex tw-min-h-32 tw-items-center tw-justify-center tw-px-4 tw-py-8">
      <span className="tw-text-center tw-text-sm tw-font-medium tw-text-iron-500">
        {label}
      </span>
    </div>
  );
}

function VoteDetailsErrorState({ label, onRetry }: VoteDetailsErrorStateProps) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-min-h-32 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4 tw-py-8">
      <span className="tw-text-center tw-text-sm tw-font-medium tw-text-rose-300">
        {label}
      </span>
      <Button
        onClick={(event) => {
          event.stopPropagation();
          onRetry();
        }}
        variant="tertiary"
        size="xs"
      >
        {t(locale, "waves.voteDetails.retry")}
      </Button>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  readonly active: boolean;
  readonly children: ReactNode;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`tw-relative tw-flex tw-flex-1 tw-items-center tw-justify-center tw-rounded-t-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-0 tw-text-sm tw-font-medium tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 ${
        active
          ? "tw-text-iron-50"
          : "tw-text-iron-500 desktop-hover:hover:tw-bg-white/[0.025] desktop-hover:hover:tw-text-iron-200"
      }`}
    >
      <span
        className={`tw-relative tw-inline-flex tw-py-3 ${
          active
            ? "after:tw-absolute after:tw-inset-x-0 after:-tw-bottom-px after:tw-h-px after:tw-bg-primary-400 after:tw-content-['']"
            : ""
        }`}
      >
        {children}
      </span>
    </button>
  );
}

export function ParticipationDropVoteDetailsContent({
  drop,
  activeTab,
  isOpen,
  onActiveTabChange,
  onClose,
  showHeader,
}: ParticipationDropVoteDetailsContentProps) {
  const locale = useBrowserLocale();
  const votersUnavailable = drop.voters_count_available === false;
  const creditLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const voterCountMessageKey =
    selectPluralCategory(locale, drop.raters_count) === "one"
      ? "waves.voteDetails.voters.one"
      : "waves.voteDetails.voters.other";
  const voterCountLabel = votersUnavailable
    ? t(locale, "waves.voteDetails.voters.unavailable")
    : t(locale, voterCountMessageKey, {
        count: formatInteger(locale, drop.raters_count),
      });
  const votersQuery = useDropVoters({
    dropId: drop.id,
    enabled: isOpen && activeTab === "voters" && !votersUnavailable,
  });
  const logsQuery = useDropVoteLogs({
    dropId: drop.id,
    enabled: isOpen && activeTab === "logs",
  });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (
      activeTab === "voters" &&
      !votersUnavailable &&
      votersQuery.hasNextPage &&
      !votersQuery.isLoading &&
      !votersQuery.isFetchingNextPage
    ) {
      void votersQuery.fetchNextPage();
      return;
    }

    if (
      activeTab === "logs" &&
      logsQuery.hasNextPage &&
      !logsQuery.isLoading &&
      !logsQuery.isFetchingNextPage
    ) {
      void logsQuery.fetchNextPage();
    }
  });

  const renderVoters = () => {
    if (votersUnavailable) {
      return (
        <VoteDetailsEmptyState
          label={t(locale, "waves.voteDetails.voters.unavailableExplanation", {
            voteLogTab: t(locale, "waves.voteDetails.logs.tab"),
          })}
        />
      );
    }
    if (votersQuery.isError) {
      return (
        <VoteDetailsErrorState
          label={t(locale, "waves.voteDetails.voters.error")}
          onRetry={() => {
            void votersQuery.refetch();
          }}
        />
      );
    }

    if (votersQuery.voters.length === 0 && votersQuery.isLoading) {
      return (
        <VoteDetailsEmptyState
          label={t(locale, "waves.voteDetails.voters.loading")}
        />
      );
    }

    if (votersQuery.voters.length === 0) {
      return (
        <VoteDetailsEmptyState
          label={t(locale, "waves.voteDetails.voters.empty")}
        />
      );
    }

    return (
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06]">
        {votersQuery.voters.map((voter) => (
          <ParticipationDropVoteDetailsVoterRow
            key={voter.voter.id}
            voter={voter}
            creditType={drop.wave.voting_credit_type}
          />
        ))}
      </div>
    );
  };

  const renderLogs = () => {
    if (logsQuery.isError) {
      return (
        <VoteDetailsErrorState
          label={t(locale, "waves.voteDetails.logs.error")}
          onRetry={() => {
            void logsQuery.refetch();
          }}
        />
      );
    }

    if (logsQuery.logs.length === 0 && logsQuery.isLoading) {
      return (
        <VoteDetailsEmptyState
          label={t(locale, "waves.voteDetails.logs.loading")}
        />
      );
    }

    if (logsQuery.logs.length === 0) {
      return (
        <VoteDetailsEmptyState
          label={t(locale, "waves.voteDetails.logs.empty")}
        />
      );
    }

    return (
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06]">
        {logsQuery.logs.map((log) => (
          <ParticipationDropVoteDetailsLogRow
            key={log.id}
            log={log}
            creditType={drop.wave.voting_credit_type}
          />
        ))}
      </div>
    );
  };

  const isLoadingMore =
    activeTab === "voters"
      ? !votersUnavailable &&
        (votersQuery.isFetchingNextPage || votersQuery.isLoading)
      : logsQuery.isFetchingNextPage || logsQuery.isLoading;

  return (
    <div
      className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col"
      onClick={(event) => event.stopPropagation()}
    >
      {showHeader && (
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-px-4 tw-pb-0 tw-pt-2">
          <h3 className="tw-mb-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50">
            {t(locale, "waves.voteDetails.title")}
          </h3>
          <button
            type="button"
            aria-label={t(locale, "waves.voteDetails.close")}
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="tw-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400/60 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-white"
          >
            <XMarkIcon className="tw-size-4" />
          </button>
        </div>
      )}

      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-4 tw-pt-2">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-500">
          <span>{voterCountLabel}</span>
          <span aria-hidden="true" className="tw-text-iron-700">
            /
          </span>
          <span>
            {t(locale, "waves.voteDetails.total", {
              value: formatInteger(locale, drop.rating),
              unit: creditLabel,
            })}
          </span>
        </div>
        <div
          role="tablist"
          aria-label={t(locale, "waves.voteDetails.tabsLabel")}
          className="tw-mt-2 tw-flex"
        >
          <TabButton
            active={activeTab === "voters"}
            onClick={() => onActiveTabChange("voters")}
          >
            {t(locale, "waves.voteDetails.voters.tab")}
          </TabButton>
          <TabButton
            active={activeTab === "logs"}
            onClick={() => onActiveTabChange("logs")}
          >
            {t(locale, "waves.voteDetails.logs.tab")}
          </TabButton>
        </div>
      </div>

      <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-500">
        {activeTab === "voters" ? renderVoters() : renderLogs()}
        {isLoadingMore && <LoadingBar />}
        <div ref={intersectionElementRef} />
      </div>
    </div>
  );
}
