"use client";

import Link from "next/link";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { CREATE_WAVE_HREF } from "./userPageProfileWave.helpers";
import type { resolveWavePickerViewState } from "./userPageProfileWave.helpers";
import {
  CurationEmptyPanel,
  InfoPanel,
  LoadingPanel,
  RetryButton,
} from "./UserPageProfileWaveShared";

type WavePickerVariant = "panel" | "dropdown" | "mobile-sheet";
type WavePickerState = ReturnType<typeof resolveWavePickerViewState>;
type NonReadyWavePickerState = Exclude<WavePickerState, { kind: "ready" }>;
const DROPDOWN_VARIANT = "dropdown";
const MOBILE_SHEET_VARIANT = "mobile-sheet";

function CreateWaveLink() {
  return (
    <Link
      href={CREATE_WAVE_HREF}
      className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-950 tw-no-underline tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white desktop-hover:hover:tw-border-iron-200 desktop-hover:hover:tw-bg-iron-100 desktop-hover:hover:tw-text-iron-950 desktop-hover:hover:tw-no-underline"
    >
      Create wave
    </Link>
  );
}

function renderProxyMode(variant: WavePickerVariant) {
  if (variant === DROPDOWN_VARIANT) {
    return (
      <section className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl">
        <div className="tw-px-4 tw-py-4">
          <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
            Official wave setup is only available when you are acting as
            yourself.
          </p>
        </div>
      </section>
    );
  }

  if (variant === MOBILE_SHEET_VARIANT) {
    return (
      <div className="tw-px-4 sm:tw-px-6">
        <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
          Official wave setup is only available when you are acting as yourself.
        </p>
      </div>
    );
  }

  return (
    <InfoPanel
      title="Switch out of proxy mode"
      message="Official wave setup is only available when you are acting as yourself."
    />
  );
}

function renderLoadingState(variant: WavePickerVariant) {
  if (variant === DROPDOWN_VARIANT) {
    return (
      <section className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl">
        <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-4 tw-text-sm tw-text-iron-400">
          <Spinner dimension={14} />
          <span>Loading waves...</span>
        </div>
      </section>
    );
  }

  if (variant === MOBILE_SHEET_VARIANT) {
    return (
      <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-text-sm tw-text-iron-400 sm:tw-px-6">
        <Spinner dimension={14} />
        <span>Loading waves...</span>
      </div>
    );
  }

  return <LoadingPanel label="Loading your waves..." />;
}

function renderErrorState({
  onRetry,
  variant,
}: {
  readonly onRetry: () => void;
  readonly variant: WavePickerVariant;
}) {
  if (variant === DROPDOWN_VARIANT) {
    return (
      <section className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl">
        <div className="tw-space-y-3 tw-px-4 tw-py-4">
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            Unable to load your waves
          </p>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
            There was a temporary problem loading the waves you can use for your
            profile.
          </p>
          <RetryButton isLoading={false} onClick={onRetry} />
        </div>
      </section>
    );
  }

  if (variant === MOBILE_SHEET_VARIANT) {
    return (
      <div className="tw-space-y-3 tw-px-4 sm:tw-px-6">
        <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
          Unable to load your waves
        </p>
        <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
          There was a temporary problem loading the waves you can use for your
          profile.
        </p>
        <RetryButton isLoading={false} onClick={onRetry} />
      </div>
    );
  }

  return (
    <InfoPanel
      title="Unable to load your waves"
      message="There was a temporary problem loading the waves you can use for your profile."
      actions={<RetryButton isLoading={false} onClick={onRetry} />}
    />
  );
}

function renderNoPublicWavesState({
  hasCreatedWaves,
  variant,
}: {
  readonly hasCreatedWaves: boolean;
  readonly variant: WavePickerVariant;
}) {
  if (variant === "panel" && !hasCreatedWaves) {
    return (
      <CurationEmptyPanel
        title="No waves yet"
        message="Create your first public wave to start curating on your profile."
        primaryAction={<CreateWaveLink />}
      />
    );
  }

  if (variant === DROPDOWN_VARIANT) {
    return (
      <section className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl">
        <div className="tw-space-y-3 tw-px-4 tw-py-4">
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            No public waves available yet
          </p>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
            Create a public wave to feature it on your profile.
          </p>
          <CreateWaveLink />
        </div>
      </section>
    );
  }

  if (variant === MOBILE_SHEET_VARIANT) {
    return (
      <div className="tw-space-y-3 tw-px-4 sm:tw-px-6">
        <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
          No public waves available yet
        </p>
        <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
          Create a public wave to feature it on your profile.
        </p>
        <CreateWaveLink />
      </div>
    );
  }

  return (
    <InfoPanel
      title="No public waves available yet"
      message="Official wave must be public and non-DM. Create a new public wave if none of your existing waves fit."
      actions={<CreateWaveLink />}
    />
  );
}

export default function UserPageProfileWavePickerNonReady({
  state,
  variant,
  onRetry,
}: {
  readonly state: NonReadyWavePickerState;
  readonly variant: WavePickerVariant;
  readonly onRetry: () => void;
}) {
  switch (state.kind) {
    case "not_own_profile":
      return (
        <p className="tw-py-4 tw-text-sm tw-italic tw-text-iron-500">
          This profile has not selected an official wave yet.
        </p>
      );
    case "proxy_mode":
      return renderProxyMode(variant);
    case "loading":
      return renderLoadingState(variant);
    case "error":
      return renderErrorState({ onRetry, variant });
    case "no_public_waves":
      return renderNoPublicWavesState({
        hasCreatedWaves: state.hasCreatedWaves,
        variant,
      });
  }
}
