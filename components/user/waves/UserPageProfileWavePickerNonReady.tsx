"use client";

import { Spinner } from "@/components/dotLoader/DotLoader";
import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
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

function CreateWaveLink({
  variant = "secondary",
}: {
  readonly variant?: "primary" | "secondary";
}) {
  const locale = useBrowserLocale();
  return (
    <ButtonLink href={CREATE_WAVE_HREF} variant={variant} size="sm">
      {t(locale, "profileCuration.entry.advancedWave")}
    </ButtonLink>
  );
}

function CreateProfileCurationButton({
  onClick,
}: {
  readonly onClick: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <Button onClick={onClick} variant="primary" size="sm">
      {t(locale, "profileCuration.entry.create")}
    </Button>
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

function renderMissingProfileState(
  variant: WavePickerVariant,
  profileHref: string,
  locale: SupportedLocale
) {
  const title = t(locale, "profileCuration.entry.missingProfileTitle");
  const message = t(locale, "profileCuration.entry.missingProfileMessage");

  if (variant === "panel") {
    return (
      <CurationEmptyPanel
        title={title}
        message={message}
        primaryAction={
          <ButtonLink href={profileHref} variant="primary" size="sm">
            {t(locale, "profileCuration.entry.goIdentity")}
          </ButtonLink>
        }
      />
    );
  }

  if (variant === DROPDOWN_VARIANT) {
    return (
      <section className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl">
        <div className="tw-space-y-2 tw-px-4 tw-py-4">
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {title}
          </p>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-500">{message}</p>
          <ButtonLink href={profileHref} variant="primary" size="sm">
            {t(locale, "profileCuration.entry.goIdentity")}
          </ButtonLink>
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
      <ButtonLink href={profileHref} variant="primary" size="sm">
        {t(locale, "profileCuration.entry.goIdentity")}
      </ButtonLink>
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
  onCreateProfileCuration,
  locale,
  variant,
}: {
  readonly hasCreatedWaves: boolean;
  readonly onCreateProfileCuration: () => void;
  readonly locale: SupportedLocale;
  readonly variant: WavePickerVariant;
}) {
  const title = t(locale, "profileCuration.entry.title");
  const message = hasCreatedWaves
    ? t(locale, "profileCuration.entry.noEligibleSome")
    : t(locale, "profileCuration.entry.noEligibleNone");
  const actions = (
    <div className="tw-flex tw-flex-wrap tw-justify-center tw-gap-3">
      <CreateProfileCurationButton onClick={onCreateProfileCuration} />
      <CreateWaveLink />
    </div>
  );

  if (variant === "panel") {
    return (
      <CurationEmptyPanel
        title={title}
        message={message}
        primaryAction={actions}
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
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <CreateProfileCurationButton onClick={onCreateProfileCuration} />
            <CreateWaveLink />
          </div>
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
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <CreateProfileCurationButton onClick={onCreateProfileCuration} />
        <CreateWaveLink />
      </div>
    </div>
  );
}

export default function UserPageProfileWavePickerNonReady({
  state,
  variant,
  profileHref,
  onCreateProfileCuration,
  onRetry,
}: {
  readonly state: NonReadyWavePickerState;
  readonly variant: WavePickerVariant;
  readonly profileHref: string;
  readonly onCreateProfileCuration: () => void;
  readonly onRetry: () => void;
}) {
  const locale = useBrowserLocale();
  switch (state.kind) {
    case "not_own_profile":
      return renderNotOwnProfileState(variant);
    case "proxy_mode":
      return renderProxyMode(variant);
    case "missing_profile":
      return renderMissingProfileState(variant, profileHref, locale);
    case "loading":
      return renderLoadingState(variant);
    case "error":
      return renderErrorState({ onRetry, variant });
    case "no_public_waves":
      return renderNoPublicWavesState({
        hasCreatedWaves: state.hasCreatedWaves,
        onCreateProfileCuration,
        locale,
        variant,
      });
  }
}
