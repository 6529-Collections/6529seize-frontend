import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useAuth } from "@/components/auth/Auth";
import { useWaveTopVoters } from "@/hooks/useWaveTopVoters";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { WaveLeaderboardRightSidebarVoter } from "./WaveLeaderboardRightSidebarVoter";
import { ArrowPathIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { WaveLeaderboardRightSidebarState } from "./WaveLeaderboardRightSidebarState";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const WAVE_RIGHT_SIDEBAR_LOCALE = DEFAULT_LOCALE;

interface WaveLeaderboardRightSidebarVotersProps {
  readonly wave: ApiWave;
}

export const WaveLeaderboardRightSidebarVoters: React.FC<
  WaveLeaderboardRightSidebarVotersProps
> = ({ wave }) => {
  const { connectedProfile } = useAuth();
  const { voters, isFetchingNextPage, fetchNextPage, hasNextPage, isLoading } =
    useWaveTopVoters({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.handle ?? undefined,
      reverse: false,
      dropId: null,
      sortDirection: "DESC",
      sort: "ABSOLUTE",
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isLoading && !isFetchingNextPage) {
      void fetchNextPage();
    }
  });

  if (voters.length === 0 && isLoading) {
    return (
      <WaveLeaderboardRightSidebarState
        announce
        icon={
          <ArrowPathIcon
            aria-hidden="true"
            className="tw-size-5 tw-animate-spin motion-reduce:tw-animate-none"
          />
        }
        title={t(
          WAVE_RIGHT_SIDEBAR_LOCALE,
          "waves.sidebar.rightPanel.voters.loading"
        )}
      />
    );
  }

  if (voters.length === 0) {
    return (
      <WaveLeaderboardRightSidebarState
        icon={<UserGroupIcon aria-hidden="true" className="tw-size-5" />}
        title={t(
          WAVE_RIGHT_SIDEBAR_LOCALE,
          "waves.sidebar.rightPanel.voters.emptyTitle"
        )}
        description={t(
          WAVE_RIGHT_SIDEBAR_LOCALE,
          "waves.sidebar.rightPanel.voters.emptyDescription"
        )}
      />
    );
  }

  return (
    <div>
      {voters.map((voter, index) => (
        <WaveLeaderboardRightSidebarVoter
          voter={voter}
          key={voter.voter.id}
          position={index + 1}
          creditType={wave.voting.credit_type}
        />
      ))}
      {isFetchingNextPage && (
        <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
          <div className="tw-h-full tw-w-full tw-animate-loading-bar tw-bg-indigo-400" />
        </div>
      )}
      <div ref={intersectionElementRef} />
    </div>
  );
};
