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

function renderNotOwnProfileState(variant: WavePickerVariant) {
  const title = "No featured wave yet";
  const message =
    "This profile hasn't selected a featured wave for Curation yet.";

  if (variant === "panel") {
    return <CurationEmptyPanel title={title} message={message} />;
  }

  return <p className="tw-mb-0 tw-text-sm tw-text-iron-500">{message}</p>;
}

function renderProxyMode(variant: WavePickerVariant) {
  const message =
    "Switch out of proxy mode to change the featured wave shown in Curation.";

  if (variant === DROPDOWN_VARIANT) {
    return (
      <section className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl">
        <div className="tw-px-4 tw-py-4">
          <p className="tw-mb-0 tw-text-sm tw-text-iron-500">{message}</p>
        </div>
      </section>
    );
  }

  if (variant === MOBILE_SHEET_VARIANT) {
    return (
      <div className="tw-px-4 sm:tw-px-6">
        <p className="tw-mb-0 tw-text-sm tw-text-iron-500">{message}</p>
      </div>
    );
  }

  return <InfoPanel title="Switch out of proxy mode" message={message} />;
}

function renderMissingProfileState(variant: WavePickerVariant) {
  const title = "Create your profile first";
  const message =
    "Set up your profile on the Identity tab before choosing a featured curation wave.";

  if (variant === "panel") {
    return <CurationEmptyPanel title={title} message={message} />;
  }

  if (variant === DROPDOWN_VARIANT) {
    return (
      <section className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl">
        <div className="tw-space-y-2 tw-px-4 tw-py-4">
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {title}
          </p>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-500">{message}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="tw-space-y-2 tw-px-4 sm:tw-px-6">
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
        {title}
      </p>
      <p className="tw-mb-0 tw-text-sm tw-text-iron-500">{message}</p>
    </div>
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
  const title = hasCreatedWaves ? "No featured wave yet" : "No waves yet";
  const message = hasCreatedWaves
    ? "Only public waves can be used here. Create one to set it as your featured wave."
    : "Create your first public wave to set it as your featured wave.";

  if (variant === "panel") {
    return (
      <CurationEmptyPanel
        title={title}
        message={message}
        primaryAction={<CreateWaveLink />}
      />
    );
  }

  if (variant === DROPDOWN_VARIANT) {
    return (
      <section className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl">
        <div className="tw-space-y-3 tw-px-4 tw-py-4">
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {title}
          </p>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-500">{message}</p>
          <CreateWaveLink />
        </div>
      </section>
    );
  }

  return (
    <div className="tw-space-y-3 tw-px-4 sm:tw-px-6">
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
        {title}
      </p>
      <p className="tw-mb-0 tw-text-sm tw-text-iron-500">{message}</p>
      <CreateWaveLink />
    </div>
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
      return renderNotOwnProfileState(variant);
    case "proxy_mode":
      return renderProxyMode(variant);
    case "missing_profile":
      return renderMissingProfileState(variant);
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
