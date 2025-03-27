import React, { useContext } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { getTimeAgo, numberWithCommas } from "../../../helpers/Helpers";
import WaveHeaderFollow from "./WaveHeaderFollow";
import { AuthContext } from "../../auth/Auth";
import { getScaledImageUri, ImageScale } from "../../../helpers/image.helpers";
import WaveHeaderOptions from "./options/WaveHeaderOptions";
import WaveHeaderName from "./name/WaveHeaderName";
import WaveHeaderFollowers from "./WaveHeaderFollowers";
import WaveHeaderPinned from "./WaveHeaderPinned";
import { ApiWaveType } from "../../../generated/models/ObjectSerializer";
import Link from "next/link";
import WavePicture from "../WavePicture";
import { Time } from "../../../helpers/time";

export enum WaveHeaderPinnedSide {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

interface WaveHeaderProps {
  readonly wave: ApiWave;
  readonly onFollowersClick: () => void;
  readonly useRing?: boolean;
  readonly useRounded?: boolean;
  readonly pinnedSide?: WaveHeaderPinnedSide;
}

export default function WaveHeader({
  wave,
  onFollowersClick,
  useRing = true,
  useRounded = true,
  pinnedSide = WaveHeaderPinnedSide.RIGHT,
}: WaveHeaderProps) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const created = getTimeAgo(wave.created_at);
  const firstXContributors = wave.contributors_overview.slice(0, 10);
  const isDropWave = wave.wave.type !== ApiWaveType.Chat;

  const ringClasses = useRing
    ? "tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800"
    : useRounded ? "tw-rounded-t-xl lg:tw-rounded-t-none" : "";

  return (
    <div>
      <div
        className={`tw-h-full tw-bg-iron-950 tw-relative tw-overflow-auto ${ringClasses}`}>
        <div
          className={`${
            useRounded
              ? "tw-rounded-t-xl tw-ring-1 tw-ring-inset tw-ring-iron-800"
              : ""
          } tw-overflow-hidden`}
        >
          <div
            className="tw-h-14 tw-w-full tw-object-cover tw-rounded-t-xl lg:tw-rounded-t-none"
            style={{
              background: `linear-gradient(45deg, ${wave.author.banner1_color} 0%, ${wave.author.banner2_color} 100%)`,
            }}></div>
        </div>

        <div className="-tw-mt-6 tw-px-5 tw-flex tw-space-x-5">
          <div className="tw-flex">
            <div className="tw-relative tw-size-20">
              <div
                className={`tw-absolute tw-inset-0 tw-rounded-full tw-bg-iron-900 tw-overflow-hidden ${
                  isDropWave ? "tw-ring-2 tw-ring-primary-400" : ""
                }`}>
                <WavePicture wave={wave} />
              </div>
              {isDropWave && (
                <div className="tw-absolute tw-bottom-0 tw-right-0 tw-size-6 tw-flex tw-items-center tw-justify-center tw-bg-iron-950 tw-rounded-full tw-shadow-lg">
                  <svg
                    className="tw-size-4 tw-flex-shrink-0 tw-text-[#E8D48A]"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512">
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="tw-mt-10 tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-end tw-space-x-6 tw-pb-1">
            <div className="tw-min-w-0 tw-flex-1">
              <div className="tw-flex tw-flex-col tw-items-end tw-gap-y-2">
                {!!connectedProfile?.profile?.handle && !activeProfileProxy && (
                  <div className="tw-inline-flex tw-space-x-3 tw-items-center">
                    <WaveHeaderFollow wave={wave} />
                    {connectedProfile.profile.handle === wave.author.handle && (
                      <WaveHeaderOptions wave={wave} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="tw-px-5 tw-pb-5 tw-mt-2 tw-min-w-0 tw-flex-1">
          <WaveHeaderName wave={wave} />
          <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-x-2 tw-gap-y-1 tw-mt-1">
            <div className="tw-text-sm">
              <span className="tw-font-normal tw-text-iron-400">
                Created {created} -{" "}
                {Time.millis(wave.created_at).toDate().toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-y-4">
            <div className="tw-flex tw-justify-between">
              <WaveHeaderFollowers
                wave={wave}
                onFollowersClick={onFollowersClick}
              />
              <WaveHeaderPinned wave={wave} side={pinnedSide} />
            </div>
            {!!firstXContributors.length && (
              <div className="tw-flex tw-items-center">
                <div className="tw-flex -tw-space-x-2">
                  {firstXContributors.map((item) => (
                    <img
                      key={item.contributor_identity}
                      className="tw-inline-block tw-size-6 tw-rounded-md tw-ring-2 tw-ring-black tw-bg-iron-900 tw-object-contain"
                      src={getScaledImageUri(
                        item.contributor_pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt={`${item.contributor_identity} avatar`}
                    />
                  ))}
                </div>
                <span className="tw-font-normal tw-ml-2 tw-text-iron-400 tw-text-sm">
                  <span className="tw-text-iron-200 tw-pr-0.5">
                    {numberWithCommas(wave.metrics.drops_count)}
                  </span>
                  {wave.metrics.drops_count === 1 ? "Post" : "Posts"}
                </span>
              </div>
            )}
          </div>
        </div>
        {isDropWave && (
          <div className="tw-flex tw-items-center tw-text-xs tw-text-iron-300 tw-px-4 tw-pb-4">
            <span>
              Rank is in testing mode. Please report bugs in the{" "}
              <Link
                href="/my-stream?wave=dc6e0569-e4a3-4122-bc20-ee66c76981f5"
                className="tw-underline tw-text-iron-50 tw-transition-all tw-duration-300">
                Rank Alpha Debugging
              </Link>{" "}
              wave.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
