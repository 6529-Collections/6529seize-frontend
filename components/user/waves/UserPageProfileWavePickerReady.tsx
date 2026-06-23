"use client";

import WavesIcon from "@/components/common/icons/WavesIcon";
import { Spinner } from "@/components/dotLoader/DotLoader";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getWaveHref } from "./userPageProfileWave.helpers";
import type { resolveWavePickerViewState } from "./userPageProfileWave.helpers";

type WavePickerVariant = "panel" | "dropdown" | "mobile-sheet";
type WavePickerState = ReturnType<typeof resolveWavePickerViewState>;
type ReadyWavePickerState = Extract<WavePickerState, { kind: "ready" }>;

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
  let trailingIndicator: ReactNode = null;

  if (isSubmitting) {
    trailingIndicator = <Spinner dimension={14} />;
  } else if (isSelected) {
    trailingIndicator = (
      <CheckCircleIcon
        className={`tw-flex-shrink-0 tw-text-emerald-400 ${
          isMobileSheet ? "tw-h-6 tw-w-6" : "tw-h-5 tw-w-5"
        }`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(wave.id)}
      disabled={isSubmitting || isSelected}
      className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-3 tw-rounded-xl tw-border-0 tw-text-left tw-font-medium tw-text-white tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 disabled:tw-cursor-default ${
        isMobileSheet ? "tw-px-4 tw-py-3" : "tw-px-3 tw-py-2.5"
      } ${
        isSelected
          ? "tw-bg-white/10"
          : "tw-bg-transparent desktop-hover:hover:tw-bg-white/5"
      }`}
    >
      <div className="tw-min-w-0 tw-flex-1 tw-space-y-0.5">
        <h3
          className={`tw-mb-0 tw-truncate tw-font-semibold tw-tracking-tight ${
            isMobileSheet ? "tw-text-base" : "tw-text-sm"
          }`}
        >
          {wave.name}
        </h3>
        <p
          className={`tw-mb-0 tw-truncate tw-text-iron-500 ${
            isMobileSheet ? "tw-text-sm" : "tw-text-xs"
          }`}
        >
          {wave.metrics.drops_count} posts • {wave.metrics.subscribers_count}{" "}
          joined
        </p>
      </div>

      {trailingIndicator}
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

  return (
    <div
      className={`tw-transition tw-duration-300 tw-ease-out tw-relative tw-flex tw-flex-col tw-gap-4 tw-rounded-lg tw-px-3 tw-py-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-4 sm:tw-px-4 sm:tw-py-4 ${
        isSelected
          ? "tw-bg-emerald-500/5"
          : "tw-bg-iron-950 desktop-hover:hover:tw-bg-iron-900"
      }`}
    >
      {isSelected && (
        <span className="tw-absolute tw-left-3 tw-top-1/2 tw-h-9 tw-w-1 -tw-translate-y-1/2 tw-rounded-full tw-bg-emerald-400 tw-shadow-sm sm:tw-left-0" />
      )}

      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
        <div className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-white/10 sm:tw-h-10 sm:tw-w-10">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={wave.name ? `Wave ${wave.name}` : "Wave picture"}
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

        {isSelected ? (
          <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-emerald-500/25 tw-bg-emerald-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-emerald-300">
            <CheckCircleIcon className="-tw-ml-1.5 tw-h-4 tw-w-4 tw-flex-shrink-0" />
            Active
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSelect(wave.id)}
            disabled={isSubmitting}
            className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-100 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 disabled:tw-cursor-not-allowed disabled:tw-border-white/5 disabled:tw-text-iron-500 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-white/10 sm:tw-px-4 sm:tw-py-2 sm:tw-text-sm"
          >
            {isSubmitting ? <Spinner dimension={14} /> : null}
            <span>{isSubmitting ? "Setting active" : "Set active"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function CandidateWaveRow({
  wave,
  isSelected,
  isSubmitting,
  onSelect,
  variant,
}: {
  readonly wave: ApiWave;
  readonly isSelected: boolean;
  readonly isSubmitting: boolean;
  readonly onSelect: (waveId: string) => void;
  readonly variant: WavePickerVariant;
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

export default function UserPageProfileWavePickerReady({
  state,
  title,
  selectedWaveId,
  submittingWaveId,
  onSelectWave,
  variant,
}: {
  readonly state: ReadyWavePickerState;
  readonly title: string | undefined;
  readonly selectedWaveId: string | null;
  readonly submittingWaveId: string | null;
  readonly onSelectWave: (waveId: string) => void;
  readonly variant: WavePickerVariant;
}) {
  const renderCandidateWaveRow = (candidateWave: ApiWave) => (
    <CandidateWaveRow
      key={candidateWave.id}
      wave={candidateWave}
      isSelected={selectedWaveId === candidateWave.id}
      isSubmitting={submittingWaveId === candidateWave.id}
      onSelect={onSelectWave}
      variant={variant}
    />
  );

  if (variant === "dropdown") {
    return (
      <section className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-2 tw-shadow-2xl">
        <div className="tw-no-scrollbar tw-flex tw-max-h-96 tw-flex-col tw-gap-1 tw-overflow-y-auto tw-overflow-x-hidden tw-px-1.5">
          <p className="tw-mb-0 tw-px-3 tw-pb-1 tw-pt-2 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
            Profile wave
          </p>
          <div className="tw-flex tw-flex-col tw-gap-1">
            {state.waves.map(renderCandidateWaveRow)}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "mobile-sheet") {
    return (
      <div className="tw-px-4 sm:tw-px-6">
        <div className="tw-flex tw-flex-col tw-gap-2">
          {state.waves.map(renderCandidateWaveRow)}
        </div>
      </div>
    );
  }

  return (
    <section className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-black sm:tw-rounded-3xl">
      <div className="tw-space-y-4 tw-p-3.5 sm:tw-space-y-6 sm:tw-p-5 md:tw-p-6">
        <div className="tw-max-w-2xl">
          <h2 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100 md:tw-text-xl">
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500 md:tw-mt-2">
            Choose the wave you want to use as your featured wave.
          </p>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-gap-3">
          {state.waves.map(renderCandidateWaveRow)}
        </div>
      </div>
    </section>
  );
}
