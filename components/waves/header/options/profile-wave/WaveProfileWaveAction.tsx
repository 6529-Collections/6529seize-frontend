"use client";

import { Spinner } from "@/components/dotLoader/DotLoader";
import { useAuth } from "@/components/auth/Auth";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import type { ApiWave } from "@/generated/models/ApiWave";
import { isPublicNonDirectMessageWave } from "@/helpers/waves/wave.helpers";
import { useCallback } from "react";

export default function WaveProfileWaveAction({
  wave,
  onSuccess,
}: {
  readonly wave: ApiWave;
  readonly onSuccess?: (() => void) | undefined;
}) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { updateProfileWave, clearSelectedProfileWave, isPending } =
    useProfileWaveMutation(connectedProfile);

  const isSelectedProfileWave = connectedProfile?.profile_wave_id === wave.id;
  const canManageProfileWave =
    Boolean(connectedProfile?.handle) &&
    !activeProfileProxy &&
    connectedProfile?.handle === wave.author.handle &&
    isPublicNonDirectMessageWave(wave);

  const handleClick = useCallback(async () => {
    if (isPending) {
      return;
    }

    const updatedProfile = isSelectedProfileWave
      ? await clearSelectedProfileWave()
      : await updateProfileWave(wave.id);

    if (updatedProfile) {
      onSuccess?.();
    }
  }, [
    clearSelectedProfileWave,
    isPending,
    isSelectedProfileWave,
    onSuccess,
    updateProfileWave,
    wave.id,
  ]);

  const buttonLabel = (() => {
    if (isPending) {
      return isSelectedProfileWave ? "Clearing wave" : "Saving wave";
    }

    return isSelectedProfileWave ? "Clear profile wave" : "Set as profile wave";
  })();

  if (!canManageProfileWave) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={async (event) => {
        event.stopPropagation();
        await handleClick();
      }}
      className="tw-flex tw-w-full tw-items-center tw-gap-2 tw-border-none tw-bg-transparent tw-px-3 tw-py-1 tw-text-left tw-text-sm tw-leading-6 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800"
      role="menuitem"
      tabIndex={-1}
    >
      {isPending && <Spinner dimension={14} />}
      {buttonLabel}
    </button>
  );
}
