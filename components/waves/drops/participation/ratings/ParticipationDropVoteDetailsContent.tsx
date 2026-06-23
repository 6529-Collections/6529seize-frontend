"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ReactNode } from "react";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useDropVoteLogs } from "@/hooks/useDropVoteLogs";
import { useDropVoters } from "@/hooks/useDropVoters";
import {
  ParticipationDropVoteDetailsLogRow,
  ParticipationDropVoteDetailsVoterRow,
} from "./ParticipationDropVoteDetailsRows";

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

const getVoteValueLabel = (vote: number): string => {
  if (vote === 0) {
    return "0";
  }

  const sign = vote < 0 ? "-" : "";
  return `${sign}${formatNumberWithCommas(Math.abs(vote))}`;
};

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

function VoteDetailsErrorState({
  label,
  onRetry,
}: VoteDetailsErrorStateProps) {
  return (
    <div className="tw-flex tw-min-h-32 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4 tw-py-8">
      <span className="tw-text-center tw-text-sm tw-font-medium tw-text-rose-300">
        {label}
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRetry();
        }}
        className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition-colors desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white"
      >
        Try again
      </button>
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
      className={`tw-flex-1 tw-rounded-md tw-border-0 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-transition-colors ${
        active
          ? "tw-bg-iron-700 tw-text-white"
          : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-iron-200"
      }`}
    >
      {children}
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
  const creditLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const votersQuery = useDropVoters({
    dropId: drop.id,
    enabled: isOpen && activeTab === "voters",
  });
  const logsQuery = useDropVoteLogs({
    dropId: drop.id,
    enabled: isOpen && activeTab === "logs",
  });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (
      activeTab === "voters" &&
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
    if (votersQuery.isError) {
      return (
        <VoteDetailsErrorState
          label="Could not load voters."
          onRetry={() => {
            void votersQuery.refetch();
          }}
        />
      );
    }

    if (votersQuery.voters.length === 0 && votersQuery.isLoading) {
      return <VoteDetailsEmptyState label="Loading voters..." />;
    }

    if (votersQuery.voters.length === 0) {
      return <VoteDetailsEmptyState label="No voters yet." />;
    }

    return (
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
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
          label="Could not load vote log."
          onRetry={() => {
            void logsQuery.refetch();
          }}
        />
      );
    }

    if (logsQuery.logs.length === 0 && logsQuery.isLoading) {
      return <VoteDetailsEmptyState label="Loading vote log..." />;
    }

    if (logsQuery.logs.length === 0) {
      return <VoteDetailsEmptyState label="No vote changes yet." />;
    }

    return (
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
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
      ? votersQuery.isFetchingNextPage || votersQuery.isLoading
      : logsQuery.isFetchingNextPage || logsQuery.isLoading;

  return (
    <div
      className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col"
      onClick={(event) => event.stopPropagation()}
    >
      {showHeader && (
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3">
          <div className="tw-min-w-0">
            <h3 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50">
              Votes
            </h3>
            <p className="tw-mb-0 tw-mt-0.5 tw-text-xs tw-text-iron-500">
              {formatNumberWithCommas(drop.raters_count)}{" "}
              {drop.raters_count === 1 ? "voter" : "voters"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close votes"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="tw-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-white"
          >
            <XMarkIcon className="tw-size-4" />
          </button>
        </div>
      )}

      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-font-medium tw-text-iron-500">
          <span>
            {formatNumberWithCommas(drop.raters_count)}{" "}
            {drop.raters_count === 1 ? "voter" : "voters"}
          </span>
          <span aria-hidden="true">/</span>
          <span>
            {getVoteValueLabel(drop.rating)} {creditLabel} total
          </span>
        </div>
        <div
          role="tablist"
          aria-label="Vote details"
          className="tw-mt-3 tw-flex tw-rounded-lg tw-bg-iron-900 tw-p-1"
        >
          <TabButton
            active={activeTab === "voters"}
            onClick={() => onActiveTabChange("voters")}
          >
            Voters
          </TabButton>
          <TabButton
            active={activeTab === "logs"}
            onClick={() => onActiveTabChange("logs")}
          >
            Vote log
          </TabButton>
        </div>
      </div>

      <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600 desktop-hover:hover:tw-scrollbar-thumb-iron-400">
        {activeTab === "voters" ? renderVoters() : renderLogs()}
        {isLoadingMore && <LoadingBar />}
        <div ref={intersectionElementRef} />
      </div>
    </div>
  );
}
