"use client";

import { Spinner } from "@/components/dotLoader/DotLoader";
import { useAuth } from "@/components/auth/Auth";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import type { ApiWave } from "@/generated/models/ApiWave";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import { isPublicNonDirectMessageWave } from "@/helpers/waves/wave.helpers";
import clsx from "clsx";
import { useCallback } from "react";

export default function WaveProfileWaveAction({
  wave,
  isMobile = false,
  onSuccess,
}: {
  readonly wave: ApiWave;
  readonly isMobile?: boolean | undefined;
  readonly onSuccess?: (() => void) | undefined;
}) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { updateProfileWave, clearSelectedProfileWave, isPending } =
    useProfileWaveMutation(connectedProfile);

  const isSelectedProfileWave = connectedProfile?.profile_wave_id === wave.id;
  const canManageProfileWave =
    Boolean(connectedProfile) &&
    !activeProfileProxy &&
    areSameProfileIdentity({
      left: connectedProfile
        ? {
            id: connectedProfile.id,
            handle: connectedProfile.handle,
            primary_address: connectedProfile.primary_wallet,
          }
        : null,
      right: wave.author,
    }) &&
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
      className={clsx(
        "tw-flex tw-w-full tw-items-center tw-gap-2 tw-border-none tw-bg-transparent tw-text-left tw-text-iron-300 tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400",
        isMobile
          ? "tw-min-h-12 tw-rounded-xl tw-px-4 tw-py-3 tw-text-base tw-font-semibold active:tw-bg-iron-800"
          : "tw-px-3 tw-py-1 tw-text-sm tw-leading-6 hover:tw-bg-iron-800"
      )}
      role={isMobile ? undefined : "menuitem"}
      tabIndex={isMobile ? undefined : -1}
    >
      {isPending && <Spinner dimension={14} />}
      {buttonLabel}
    </button>
  );
}
