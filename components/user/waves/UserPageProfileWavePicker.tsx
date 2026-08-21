"use client";

import { useWaves } from "@/hooks/useWaves";
import { useEffect } from "react";
import UserPageProfileWavePickerNonReady from "./UserPageProfileWavePickerNonReady";
import UserPageProfileWavePickerReady from "./UserPageProfileWavePickerReady";
import { resolveWavePickerViewState } from "./userPageProfileWave.helpers";

export default function UserPageProfileWavePicker({
  title,
  identity,
  isOwnProfile,
  hasCreatedProfile,
  hasActiveProfileProxy,
  selectedWaveId,
  submittingWaveId,
  profileHref,
  onCreateProfileCuration,
  onSelectWave,
  variant = "panel",
}: {
  readonly title?: string;
  readonly identity: string;
  readonly isOwnProfile: boolean;
  readonly hasCreatedProfile: boolean;
  readonly hasActiveProfileProxy: boolean;
  readonly selectedWaveId: string | null;
  readonly submittingWaveId: string | null;
  readonly profileHref: string;
  readonly onCreateProfileCuration: () => void;
  readonly onSelectWave: (waveId: string) => void;
  readonly variant?: "panel" | "dropdown" | "mobile-sheet";
}) {
  const {
    waves: createdWaves,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useWaves({
    identity,
    waveName: null,
    limit: 20,
    directMessage: false,
    enabled:
      isOwnProfile &&
      hasCreatedProfile &&
      !hasActiveProfileProxy &&
      identity.length > 0,
  });
  const state = resolveWavePickerViewState({
    createdWaves,
    hasCreatedProfile,
    hasActiveProfileProxy,
    isOwnProfile,
    status,
  });
  const retryWavePickerLoad = async () => {
    await refetch();
  };

  useEffect(() => {
    if (status === "success" && hasNextPage && !isFetchingNextPage) {
      const fetchRemainingWaves = async () => {
        await fetchNextPage();
      };

      fetchRemainingWaves().catch(() => undefined);
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, status]);

  if (state.kind !== "ready") {
    return (
      <UserPageProfileWavePickerNonReady
        state={state}
        variant={variant}
        profileHref={profileHref}
        onCreateProfileCuration={onCreateProfileCuration}
        onRetry={retryWavePickerLoad}
      />
    );
  }

  return (
    <UserPageProfileWavePickerReady
      state={state}
      title={title}
      selectedWaveId={selectedWaveId}
      submittingWaveId={submittingWaveId}
      onCreateProfileCuration={onCreateProfileCuration}
      onSelectWave={onSelectWave}
      variant={variant}
    />
  );
}
