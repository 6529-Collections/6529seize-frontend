"use client";

import UserPageProfileWaveMasonry, {
  type ProfileIdentitySummary,
} from "@/components/user/waves/UserPageProfileWaveMasonry";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import { PlusIcon } from "@heroicons/react/24/outline";
import { resolveProfileCurationViewState } from "./userPageProfileWave.helpers";
import {
  CurationEmptyPanel,
  InfoPanel,
  LoadingPanel,
  RetryButton,
} from "./UserPageProfileWaveShared";

export default function UserPageProfileWaveContent({
  canManageOwnOfficialWave,
  containerWidth,
  onCreateCuration,
  profileIdentity,
  areCurationsError,
  areCurationsFetching,
  areCurationsLoading,
  hasLoadedCurations,
  onRetryCurations,
  profileCuration,
  wave,
}: {
  readonly canManageOwnOfficialWave: boolean;
  readonly containerWidth: number;
  readonly onCreateCuration: () => void;
  readonly profileIdentity: ProfileIdentitySummary;
  readonly areCurationsError: boolean;
  readonly areCurationsFetching: boolean;
  readonly areCurationsLoading: boolean;
  readonly hasLoadedCurations: boolean;
  readonly onRetryCurations: () => void;
  readonly profileCuration: ApiWaveCuration | null;
  readonly wave: ApiWave;
}) {
  const {
    dataUpdatedAt,
    drops,
    fetchNextPage,
    hasNextPage,
    isError: areDropsError,
    isFetching: areDropsFetching,
    isFetchingNextPage,
    isPlaceholderData,
    refetch: refetchDrops,
  } = useWaveCurationDrops({
    wave,
    curationId: profileCuration?.id,
    enabled: profileCuration !== null,
  });
  const state = resolveProfileCurationViewState({
    areCurationsError,
    areCurationsLoading,
    canManageOwnOfficialWave,
    containerWidth,
    hasLoadedCurations,
    profileCuration,
    drops,
    dropsDataUpdatedAt: dataUpdatedAt,
    areDropsError,
    isDropsPlaceholderData: isPlaceholderData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });
  const retryDropsLoad = async () => {
    await refetchDrops();
  };
  const createCurationAction = canManageOwnOfficialWave ? (
    <ProfileCurationActionButton
      label="Create curation"
      onClick={onCreateCuration}
    />
  ) : undefined;

  switch (state.kind) {
    case "curations_error":
      return (
        <InfoPanel
          title="Unable to load curations"
          message="There was a temporary problem loading the curations in this wave."
          actions={
            <RetryButton
              isLoading={areCurationsFetching}
              onClick={onRetryCurations}
            />
          }
        />
      );
    case "loading_curations":
      return <LoadingPanel label="Loading curations..." />;
    case "no_curation":
      return (
        <CurationEmptyPanel
          title={state.emptyState.title}
          message={state.emptyState.message}
          primaryAction={createCurationAction}
        />
      );
    case "empty_drops":
      return (
        <CurationEmptyPanel
          title={state.emptyState.title}
          message={state.emptyState.message}
        />
      );
    case "drops_error":
      return (
        <InfoPanel
          title="Unable to load curation"
          message="There was a temporary problem loading drops for this curation."
          actions={
            <RetryButton
              isLoading={areDropsFetching}
              onClick={retryDropsLoad}
            />
          }
        />
      );
    case "loading_drops":
      return <LoadingPanel label="Loading curation..." />;
    case "ready":
      return (
        <div className="tw-overflow-hidden tw-rounded-2xl">
          <UserPageProfileWaveMasonry
            curationId={state.curation.id}
            curationName={state.curation.name}
            containerWidth={containerWidth}
            drops={state.drops}
            fetchNextPage={state.fetchNextPage}
            hasNextPage={state.hasNextPage}
            isFetchingNextPage={state.isFetchingNextPage}
            showIdentity={false}
            profileIdentity={profileIdentity}
          />
        </div>
      );
  }
}

function ProfileCurationActionButton({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-950 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white disabled:tw-cursor-not-allowed disabled:tw-border-white/15 disabled:tw-bg-white/10 disabled:tw-text-iron-400 desktop-hover:hover:tw-border-iron-200 desktop-hover:hover:tw-bg-iron-100"
    >
      <PlusIcon className="-tw-ml-0.5 tw-h-5 tw-w-5 tw-flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
}
