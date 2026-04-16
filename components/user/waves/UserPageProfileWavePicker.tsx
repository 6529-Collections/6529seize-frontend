"use client";

import WavesIcon from "@/components/common/icons/WavesIcon";
import { Spinner } from "@/components/dotLoader/DotLoader";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useWaves } from "@/hooks/useWaves";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect } from "react";
import {
  CREATE_WAVE_HREF,
  getWaveHref,
  resolveWavePickerViewState,
} from "./userPageProfileWave.helpers";
import {
  CurationEmptyPanel,
  InfoPanel,
  LoadingPanel,
  RetryButton,
} from "./UserPageProfileWaveShared";

type WavePickerVariant = "panel" | "dropdown" | "mobile-sheet";
type WavePickerState = ReturnType<typeof resolveWavePickerViewState>;
type ReadyWavePickerState = Extract<WavePickerState, { kind: "ready" }>;
type NonReadyWavePickerState = Exclude<WavePickerState, { kind: "ready" }>;

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

function DropdownStatusSection({ children }: { readonly children: ReactNode }) {
  return (
    <section className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/95 tw-backdrop-blur-xl">
      {children}
    </section>
  );
}

function MobileSheetSection({ children }: { readonly children: ReactNode }) {
  return <div className="tw-space-y-3 tw-px-4 sm:tw-px-6">{children}</div>;
}

function CompactCandidateWaveRow({
  wave,
  isSelected,
  isSubmitting,
  onSelect,
  isMobileSheet,
}: {
  readonly wave: ApiWave;
  readonly isSelected: boolean;
  readonly isSubmitting: boolean;
  readonly onSelect: (waveId: string) => void;
  readonly isMobileSheet: boolean;
}) {
  const paddingClassName = isMobileSheet
    ? "tw-px-4 tw-py-3"
    : "tw-px-3 tw-py-2.5 tw-text-sm";
  const titleClassName = isMobileSheet ? "tw-text-base" : "tw-text-sm";
  const metadataClassName = isMobileSheet ? "tw-text-sm" : "tw-text-xs";
  const indicatorSizeClassName = isMobileSheet
    ? "tw-h-6 tw-w-6"
    : "tw-h-5 tw-w-5";
  const selectionClassName = isSelected
    ? "tw-bg-iron-800 tw-text-iron-100"
    : "tw-bg-transparent tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800";

  let trailingContent: ReactNode = null;
  if (isSubmitting) {
    trailingContent = <Spinner dimension={14} />;
  } else if (isSelected) {
    trailingContent = (
      <CheckCircleIcon
        className={`tw-flex-shrink-0 tw-text-emerald-400 ${indicatorSizeClassName}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(wave.id)}
      disabled={isSubmitting || isSelected}
      className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-3 tw-rounded-xl tw-border-0 tw-text-left tw-font-medium tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 disabled:tw-cursor-default ${paddingClassName} ${selectionClassName}`}
    >
      <div className="tw-min-w-0 tw-flex-1 tw-space-y-0.5">
        <h3 className={`tw-mb-0 tw-truncate tw-font-medium ${titleClassName}`}>
          {wave.name}
        </h3>
        <p
          className={`tw-mb-0 tw-truncate tw-text-iron-500 ${metadataClassName}`}
        >
          {wave.metrics.drops_count} posts • {wave.metrics.subscribers_count}{" "}
          joined
        </p>
      </div>

      {trailingContent}
    </button>
  );
}

function PanelCandidateWaveRow({
  wave,
  isSelected,
  isSubmitting,
  onSelect,
}: {
  readonly wave: ApiWave;
  readonly isSelected: boolean;
  readonly isSubmitting: boolean;
  readonly onSelect: (waveId: string) => void;
}) {
  const imageSrc = wave.picture
    ? getScaledImageUri(wave.picture, ImageScale.W_AUTO_H_50)
    : null;
  const cardClassName = isSelected
    ? "tw-bg-emerald-500/6"
    : "tw-bg-iron-950/60 desktop-hover:hover:tw-bg-iron-900/60";
  const imageAlt = wave.name ? `Wave ${wave.name}` : "Wave picture";

  let actionContent: ReactNode;
  if (isSelected) {
    actionContent = (
      <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-emerald-500/25 tw-bg-emerald-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-emerald-300">
        <CheckCircleIcon className="-tw-ml-1.5 tw-h-4 tw-w-4 tw-flex-shrink-0" />
        Active
      </span>
    );
  } else {
    actionContent = (
      <button
        type="button"
        onClick={() => onSelect(wave.id)}
        disabled={isSubmitting}
        className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-100 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 disabled:tw-cursor-not-allowed disabled:tw-border-white/5 disabled:tw-text-iron-500 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-white/10 sm:tw-px-4 sm:tw-py-2 sm:tw-text-sm"
      >
        {isSubmitting ? <Spinner dimension={14} /> : null}
        <span>{isSubmitting ? "Setting active" : "Set active"}</span>
      </button>
    );
  }

  return (
    <div
      className={`tw-relative tw-flex tw-flex-col tw-gap-4 tw-rounded-lg tw-px-3 tw-py-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-4 sm:tw-px-4 sm:tw-py-4 ${cardClassName}`}
    >
      {isSelected && (
        <span className="tw-absolute tw-left-3 tw-top-1/2 tw-h-9 tw-w-1 -tw-translate-y-1/2 tw-rounded-full tw-bg-emerald-400 tw-shadow-sm sm:tw-left-0" />
      )}

      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
        <div className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-white/10 sm:tw-h-10 sm:tw-w-10">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={40}
              height={40}
              className="tw-h-full tw-w-full tw-rounded-full tw-object-cover"
            />
          ) : (
            <WavesIcon className="tw-h-4 tw-w-4 tw-text-iron-300" />
          )}
        </div>

        <div className="tw-min-w-0 tw-space-y-1">
          <h3 className="tw-mb-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
            {wave.name}
          </h3>
          <p className="tw-mb-0 tw-truncate tw-text-xs tw-text-iron-500">
            {wave.metrics.drops_count} posts • {wave.metrics.subscribers_count}{" "}
            joined
          </p>
        </div>
      </div>

      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 sm:tw-justify-end">
        <Link
          href={getWaveHref(wave)}
          prefetch={false}
          className="tw-inline-flex tw-items-center tw-gap-2 tw-bg-transparent tw-text-sm tw-font-medium tw-text-iron-400 tw-no-underline tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-400 desktop-hover:hover:tw-text-iron-200 desktop-hover:hover:tw-no-underline"
        >
          <span>View</span>
          <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
        </Link>

        {actionContent}
      </div>
    </div>
  );
}

function CandidateWaveRow({
  wave,
  isSelected,
  isSubmitting,
  onSelect,
  variant = "panel",
}: {
  readonly wave: ApiWave;
  readonly isSelected: boolean;
  readonly isSubmitting: boolean;
  readonly onSelect: (waveId: string) => void;
  readonly variant?: WavePickerVariant;
}) {
  if (variant === "panel") {
    return (
      <PanelCandidateWaveRow
        wave={wave}
        isSelected={isSelected}
        isSubmitting={isSubmitting}
        onSelect={onSelect}
      />
    );
  }

  return (
    <CompactCandidateWaveRow
      wave={wave}
      isSelected={isSelected}
      isSubmitting={isSubmitting}
      onSelect={onSelect}
      isMobileSheet={variant === "mobile-sheet"}
    />
  );
}

function renderWavePickerVariantContent({
  isDropdown,
  isMobileSheet,
  dropdownContent,
  mobileSheetContent,
  panelContent,
}: {
  readonly isDropdown: boolean;
  readonly isMobileSheet: boolean;
  readonly dropdownContent: ReactNode;
  readonly mobileSheetContent: ReactNode;
  readonly panelContent: ReactNode;
}) {
  if (isDropdown) {
    return dropdownContent;
  }

  if (isMobileSheet) {
    return mobileSheetContent;
  }

  return panelContent;
}

function getNonReadyWavePickerContent({
  state,
  isDropdown,
  isMobileSheet,
  onRetry,
}: {
  readonly state: NonReadyWavePickerState;
  readonly isDropdown: boolean;
  readonly isMobileSheet: boolean;
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
      return renderWavePickerVariantContent({
        isDropdown,
        isMobileSheet,
        dropdownContent: (
          <DropdownStatusSection>
            <div className="tw-px-4 tw-py-4">
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
                Official wave setup is only available when you are acting as
                yourself.
              </p>
            </div>
          </DropdownStatusSection>
        ),
        mobileSheetContent: (
          <div className="tw-px-4 sm:tw-px-6">
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              Official wave setup is only available when you are acting as
              yourself.
            </p>
          </div>
        ),
        panelContent: (
          <InfoPanel
            title="Switch out of proxy mode"
            message="Official wave setup is only available when you are acting as yourself."
          />
        ),
      });
    case "loading":
      return renderWavePickerVariantContent({
        isDropdown,
        isMobileSheet,
        dropdownContent: (
          <DropdownStatusSection>
            <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-4 tw-text-sm tw-text-iron-400">
              <Spinner dimension={14} />
              <span>Loading waves...</span>
            </div>
          </DropdownStatusSection>
        ),
        mobileSheetContent: (
          <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-text-sm tw-text-iron-400 sm:tw-px-6">
            <Spinner dimension={14} />
            <span>Loading waves...</span>
          </div>
        ),
        panelContent: <LoadingPanel label="Loading your waves..." />,
      });
    case "error":
      return renderWavePickerVariantContent({
        isDropdown,
        isMobileSheet,
        dropdownContent: (
          <DropdownStatusSection>
            <div className="tw-space-y-3 tw-px-4 tw-py-4">
              <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                Unable to load your waves
              </p>
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
                There was a temporary problem loading the waves you can use for
                your profile.
              </p>
              <RetryButton isLoading={false} onClick={onRetry} />
            </div>
          </DropdownStatusSection>
        ),
        mobileSheetContent: (
          <MobileSheetSection>
            <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              Unable to load your waves
            </p>
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              There was a temporary problem loading the waves you can use for
              your profile.
            </p>
            <RetryButton isLoading={false} onClick={onRetry} />
          </MobileSheetSection>
        ),
        panelContent: (
          <InfoPanel
            title="Unable to load your waves"
            message="There was a temporary problem loading the waves you can use for your profile."
            actions={<RetryButton isLoading={false} onClick={onRetry} />}
          />
        ),
      });
    case "no_public_waves": {
      if (!isDropdown && !isMobileSheet && !state.hasCreatedWaves) {
        return (
          <CurationEmptyPanel
            title="No waves yet"
            message="Create your first public wave to start curating on your profile."
            primaryAction={<CreateWaveLink />}
          />
        );
      }

      return renderWavePickerVariantContent({
        isDropdown,
        isMobileSheet,
        dropdownContent: (
          <DropdownStatusSection>
            <div className="tw-space-y-3 tw-px-4 tw-py-4">
              <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                No public waves available yet
              </p>
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
                Create a public wave to feature it on your profile.
              </p>
              <CreateWaveLink />
            </div>
          </DropdownStatusSection>
        ),
        mobileSheetContent: (
          <MobileSheetSection>
            <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              No public waves available yet
            </p>
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              Create a public wave to feature it on your profile.
            </p>
            <CreateWaveLink />
          </MobileSheetSection>
        ),
        panelContent: (
          <InfoPanel
            title="No public waves available yet"
            message="Official wave must be public and non-DM. Create a new public wave if none of your existing waves fit."
            actions={<CreateWaveLink />}
          />
        ),
      });
    }
  }
}

function renderWaveRows({
  waves,
  selectedWaveId,
  submittingWaveId,
  onSelectWave,
  variant,
}: {
  readonly waves: ReadyWavePickerState["waves"];
  readonly selectedWaveId: string | null;
  readonly submittingWaveId: string | null;
  readonly onSelectWave: (waveId: string) => void;
  readonly variant: WavePickerVariant;
}) {
  return waves.map((candidateWave) => (
    <CandidateWaveRow
      key={candidateWave.id}
      wave={candidateWave}
      isSelected={selectedWaveId === candidateWave.id}
      isSubmitting={submittingWaveId === candidateWave.id}
      onSelect={onSelectWave}
      variant={variant}
    />
  ));
}

function getReadyWavePickerContent({
  state,
  title,
  selectedWaveId,
  submittingWaveId,
  onSelectWave,
  variant,
  isDropdown,
  isMobileSheet,
}: {
  readonly state: ReadyWavePickerState;
  readonly title: string | undefined;
  readonly selectedWaveId: string | null;
  readonly submittingWaveId: string | null;
  readonly onSelectWave: (waveId: string) => void;
  readonly variant: WavePickerVariant;
  readonly isDropdown: boolean;
  readonly isMobileSheet: boolean;
}) {
  const waveRows = renderWaveRows({
    waves: state.waves,
    selectedWaveId,
    submittingWaveId,
    onSelectWave,
    variant,
  });

  if (isDropdown) {
    return (
      <section className="tw-w-full tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10">
        <div className="tw-max-h-80 tw-overflow-y-auto tw-overflow-x-hidden">
          <div className="tw-flex tw-flex-col tw-gap-0.5 tw-px-2 tw-py-0.5">
            {waveRows}
          </div>
        </div>
      </section>
    );
  }

  if (isMobileSheet) {
    return (
      <div className="tw-px-4 sm:tw-px-6">
        <div className="tw-flex tw-flex-col tw-gap-2">{waveRows}</div>
      </div>
    );
  }

  return (
    <section className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-black sm:tw-rounded-3xl">
      <div className="tw-space-y-4 tw-p-3.5 sm:tw-space-y-6 sm:tw-p-5 md:tw-p-6">
        <div className="tw-max-w-2xl">
          <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-100">
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500">
            Choose the wave you want to feature on your profile.
          </p>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-gap-3">
          {waveRows}
        </div>
      </div>
    </section>
  );
}

export default function UserPageProfileWavePicker({
  title,
  identity,
  isOwnProfile,
  hasActiveProfileProxy,
  selectedWaveId,
  submittingWaveId,
  onSelectWave,
  variant = "panel",
}: {
  readonly title?: string;
  readonly identity: string;
  readonly isOwnProfile: boolean;
  readonly hasActiveProfileProxy: boolean;
  readonly selectedWaveId: string | null;
  readonly submittingWaveId: string | null;
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
    enabled: isOwnProfile && !hasActiveProfileProxy && identity.length > 0,
  });
  const state = resolveWavePickerViewState({
    createdWaves,
    hasActiveProfileProxy,
    isOwnProfile,
    status,
  });
  const isDropdown = variant === "dropdown";
  const isMobileSheet = variant === "mobile-sheet";
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
    return getNonReadyWavePickerContent({
      state,
      isDropdown,
      isMobileSheet,
      onRetry: retryWavePickerLoad,
    });
  }

  return getReadyWavePickerContent({
    state,
    title,
    selectedWaveId,
    submittingWaveId,
    onSelectWave,
    variant,
    isDropdown,
    isMobileSheet,
  });
}
