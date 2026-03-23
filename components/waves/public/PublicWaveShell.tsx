"use client";

import ConnectWallet from "@/components/common/ConnectWallet";
import SpinnerLoader from "@/components/common/SpinnerLoader";
import HeaderUserConnect from "@/components/header/user/HeaderUserConnect";
import { formatCount } from "@/helpers/format.helpers";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import {
  type PublicWaveShellData,
  usePublicWaveShellState,
} from "./usePublicWaveShellState";

interface PublicWaveShellProps {
  readonly waveId: string;
}

const LOCKED_PREVIEW_ROWS = [
  {
    nameWidth: "tw-w-24",
    timeWidth: "tw-w-12",
    lines: ["tw-w-5/6", "tw-w-2/5"],
    hasAttachment: false,
    reactions: 0,
  },
  {
    nameWidth: "tw-w-32",
    timeWidth: "tw-w-16",
    lines: ["tw-w-11/12", "tw-w-full", "tw-w-4/5", "tw-w-3/5"],
    hasAttachment: true,
    reactions: 2,
  },
  {
    nameWidth: "tw-w-20",
    timeWidth: "tw-w-10",
    lines: ["tw-w-1/3"],
    hasAttachment: false,
    reactions: 1,
  },
  {
    nameWidth: "tw-w-28",
    timeWidth: "tw-w-14",
    lines: ["tw-w-3/4", "tw-w-5/6", "tw-w-2/5"],
    hasAttachment: false,
    reactions: 0,
  },
  {
    nameWidth: "tw-w-36",
    timeWidth: "tw-w-12",
    lines: ["tw-w-3/5"],
    hasAttachment: true,
    reactions: 3,
  },
  {
    nameWidth: "tw-w-24",
    timeWidth: "tw-w-12",
    lines: ["tw-w-full", "tw-w-4/5", "tw-w-11/12", "tw-w-1/5"],
    hasAttachment: false,
    reactions: 0,
  },
  {
    nameWidth: "tw-w-20",
    timeWidth: "tw-w-14",
    lines: ["tw-w-1/2"],
    hasAttachment: false,
    reactions: 0,
  },
] as const;

function compactDescriptionText(text: string): string {
  const normalized = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= 240) {
    return normalized;
  }

  const shortened = normalized.slice(0, 237);
  const safeBoundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, safeBoundary > 180 ? safeBoundary : 237)}...`;
}

function PublicWaveLockedPreview() {
  return (
    <div
      aria-hidden="true"
      className="tw-pointer-events-none tw-absolute tw-inset-0 tw-overflow-hidden"
    >
      <div className="tw-absolute tw-left-1/4 tw-top-1/4 tw-size-96 tw-rounded-full tw-bg-white/5 tw-mix-blend-screen tw-blur-3xl" />
      <div className="tw-absolute tw-bottom-1/4 tw-right-1/4 tw-size-96 tw-scale-125 tw-rounded-full tw-bg-iron-400/5 tw-mix-blend-screen tw-blur-3xl" />

      <div className="tw-absolute tw-inset-0 tw-overflow-hidden tw-p-6 md:tw-p-8">
        <div className="tw-flex tw-h-full tw-select-none tw-flex-col tw-justify-end tw-gap-6 tw-opacity-50 tw-blur-md">
          {LOCKED_PREVIEW_ROWS.map((row, index) => (
            <div
              key={`${row.nameWidth}-${row.timeWidth}-${index}`}
              className={`tw-mx-auto tw-flex tw-w-full tw-max-w-5xl tw-items-start tw-gap-4 ${
                index % 2 === 0 ? "tw-opacity-90" : "tw-opacity-60"
              }`}
            >
              <div className="tw-size-11 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600 tw-shadow-sm" />

              <div className="tw-flex-1 tw-space-y-1.5 tw-pt-0.5">
                <div className="tw-mb-2 tw-flex tw-items-baseline tw-gap-3">
                  <div
                    className={`tw-h-3.5 tw-rounded-md tw-bg-iron-400 ${row.nameWidth}`}
                  />
                  <div
                    className={`tw-h-2.5 tw-rounded-md tw-bg-iron-700 ${row.timeWidth}`}
                  />
                </div>

                <div className="tw-w-full tw-space-y-2.5">
                  {row.lines.map((lineWidth) => (
                    <div
                      key={lineWidth}
                      className={`tw-h-3 tw-rounded-sm tw-bg-iron-300 ${lineWidth}`}
                    />
                  ))}
                </div>

                {row.hasAttachment && (
                  <div className="tw-mt-3 tw-h-48 tw-w-full tw-max-w-80 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-shadow-sm" />
                )}

                {row.reactions > 0 && (
                  <div className="tw-flex tw-gap-2 tw-pt-2">
                    {Array.from({ length: row.reactions }).map(
                      (_, reactionIndex) => (
                        <div
                          key={reactionIndex}
                          className="tw-h-6 tw-w-10 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800"
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-black/60 tw-via-black/30 tw-to-black" />
    </div>
  );
}

function PublicWaveLoadingState() {
  return (
    <div className="tw-flex tw-min-h-full tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-py-8">
      <SpinnerLoader text="Loading wave overview..." />
    </div>
  );
}

function PublicWaveUnavailableState() {
  return <ConnectWallet />;
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
        <PublicWaveLockedPreview />
        <div className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-size-96 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-scale-125 tw-rounded-full tw-bg-white/10 tw-blur-3xl" />

        <div className="tw-absolute tw-inset-0 tw-z-10 tw-overflow-y-auto tw-px-4 tw-py-8 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 lg:tw-px-8">
          <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center">
            <section className="tw-group tw-relative tw-z-10 tw-flex tw-w-full tw-max-w-xl tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl">
              <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/10 tw-to-transparent tw-opacity-80" />
              <div
                className="tw-pointer-events-none tw-absolute tw-inset-0 tw-opacity-5 tw-mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')",
                }}
              />

              <div className="tw-relative tw-z-10 tw-flex tw-flex-col tw-items-center tw-px-6 tw-pb-10 tw-pt-10 tw-text-center md:tw-px-10">
                <div className="tw-mb-8 tw-flex tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-[#151515] tw-px-3 tw-py-1.5 tw-shadow-inner">
                  <LockClosedIcon
                    className="tw-size-3.5 tw-text-iron-300"
                    strokeWidth={2.5}
                  />
                  <div className="tw-h-3 tw-w-[1px] tw-bg-iron-700" />
                  <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-iron-400">
                    Members Only
                  </span>
                </div>
                <h2 className="tw-mb-4 tw-bg-gradient-to-b tw-from-white tw-to-iron-400 tw-bg-clip-text tw-text-xl tw-font-semibold tw-leading-[1.05] tw-tracking-tighter tw-text-transparent sm:tw-text-2xl md:tw-text-3xl">
                  {wave.name}
                </h2>
                {hasDescription && (
                  <p className="tw-mb-10 tw-max-w-md tw-text-pretty tw-text-sm tw-font-normal tw-text-iron-400 md:tw-text-base">
                    {description}
                  </p>
                )}

                <div className="tw-mb-10 tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-8 tw-px-4 md:tw-gap-12">
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
                    icon={<LockClosedIcon strokeWidth={2.5} />}
                    iconClassName="tw-size-5 tw-flex-shrink-0"
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
