"use client";

import SpinnerLoader from "@/components/common/SpinnerLoader";
import HeaderUserConnect from "@/components/header/user/HeaderUserConnect";
import WavePicture from "@/components/waves/WavePicture";
import { formatCount } from "@/helpers/format.helpers";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import WaveScreenMessage from "../WaveScreenMessage";
import LoggedOutSkeleton from "./LoggedOutSkeleton";
import {
  type PublicWaveShellData,
  usePublicWaveShellState,
} from "./usePublicWaveShellState";

interface PublicWaveShellProps {
  readonly waveId: string;
}

function compactDescriptionText(text: string): string {
  const normalized = text
    .replaceAll(/https?:\/\/\S+/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();

  if (normalized.length <= 240) {
    return normalized;
  }

  const shortened = normalized.slice(0, 237);
  const safeBoundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, safeBoundary > 180 ? safeBoundary : 237)}...`;
}

function PublicWaveLoadingState() {
  return (
    <div className="tw-flex tw-min-h-full tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-py-8">
      <SpinnerLoader text="Loading wave..." />
    </div>
  );
}

function PublicWaveUnavailableState() {
  return (
    <WaveScreenMessage
      title="This wave isn't available publicly"
      description="Connect your wallet to check whether you have access."
      action={<HeaderUserConnect label="Connect Wallet" />}
    />
  );
}

function PublicWaveShellContent({
  wave,
}: {
  readonly wave: PublicWaveShellData;
}) {
  const description = compactDescriptionText(wave.descriptionPreview ?? "");
  const hasDescription = description.length > 0;
  const memberCount = formatCount(wave.membersCount) ?? "0";
  const postCount = formatCount(wave.postsCount) ?? "0";

  return (
    <div className="tw-relative tw-flex tw-h-full tw-min-h-0 tw-min-w-0 tw-flex-col tw-overflow-hidden tw-bg-black">
      <div className="tw-relative tw-min-h-0 tw-flex-1 tw-overflow-hidden">
        <LoggedOutSkeleton />
        <div className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-size-96 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-scale-125 tw-rounded-full tw-bg-white/10 tw-blur-3xl" />

        <div className="tw-absolute tw-inset-0 tw-z-10 tw-overflow-y-auto tw-px-4 tw-py-8 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 lg:tw-px-8">
          <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center">
            <section className="tw-group tw-relative tw-z-10 tw-flex tw-w-full tw-max-w-lg tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-shadow-2xl">
              <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/10 tw-to-transparent tw-opacity-80" />
              <div
                className="tw-pointer-events-none tw-absolute tw-inset-0 tw-opacity-5 tw-mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')",
                }}
              />

              <div className="tw-relative tw-z-10 tw-flex tw-flex-col tw-items-center tw-px-6 tw-pb-10 tw-pt-10 tw-text-center md:tw-px-10">
                <div className="tw-mb-1 tw-flex tw-max-w-md tw-flex-col tw-items-center tw-justify-center tw-gap-4">
                  <div className="tw-size-12 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-shadow-2xl tw-ring-1 tw-ring-white/10 tw-ring-offset-4 tw-ring-offset-iron-950 sm:tw-size-14">
                    <WavePicture
                      name={wave.name}
                      picture={wave.picture}
                      contributors={[]}
                    />
                  </div>
                  <h2 className="tw-mb-2 tw-text-xl tw-font-semibold tw-leading-[1.05] tw-tracking-tighter tw-text-transparent tw-text-white sm:tw-text-2xl md:tw-text-3xl">
                    {wave.name}
                  </h2>
                </div>
                {hasDescription && (
                  <p className="tw-mb-10 tw-max-w-md tw-text-pretty tw-pb-0 tw-text-sm tw-font-normal tw-text-iron-400 md:tw-text-md">
                    {description}
                  </p>
                )}

                <div className="tw-mb-8 tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-8 tw-px-4 md:tw-gap-12">
                  <div className="tw-flex tw-w-20 tw-flex-col tw-items-center tw-gap-1.5">
                    <span className="tw-text-lg tw-font-semibold tw-text-white md:tw-text-xl">
                      {memberCount}
                    </span>
                    <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-iron-500">
                      Joined
                    </span>
                  </div>

                  <div className="tw-h-8 tw-w-px tw-bg-iron-800" />

                  <div className="tw-flex tw-w-20 tw-flex-col tw-items-center tw-gap-1.5">
                    <span className="tw-text-lg tw-font-semibold tw-text-white md:tw-text-xl">
                      {postCount}
                    </span>
                    <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-iron-500">
                      Posts
                    </span>
                  </div>
                </div>

                <div className="tw-relative tw-w-full tw-overflow-hidden tw-rounded-xl">
                  <HeaderUserConnect
                    className="tw-h-12 tw-w-full"
                    icon={
                      <LockClosedIcon
                        className="tw-size-5 tw-flex-shrink-0"
                        strokeWidth={2.5}
                      />
                    }
                    label="Connect Wallet"
                  />
                </div>

                <p className="tw-mx-auto tw-mb-0 tw-mt-6 tw-max-w-sm tw-text-xs tw-font-semibold tw-tracking-wide tw-text-iron-600">
                  This content is only available to connected wallets. Connect
                  your wallet to continue.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicWaveShell({ waveId }: PublicWaveShellProps) {
  const shellState = usePublicWaveShellState(waveId);

  switch (shellState.status) {
    case "loading":
      return <PublicWaveLoadingState />;
    case "unavailable":
      return <PublicWaveUnavailableState />;
    case "ready":
      return <PublicWaveShellContent wave={shellState.wave} />;
  }
}
