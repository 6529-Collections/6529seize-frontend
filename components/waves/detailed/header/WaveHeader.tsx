import React, { useContext } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { getTimeUntil, numberWithCommas } from "../../../../helpers/Helpers";
import WaveHeaderFollow from "./WaveHeaderFollow";
import { AuthContext } from "../../../auth/Auth";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import WaveHeaderOptions from "./options/WaveHeaderOptions";
import WaveHeaderName from "./name/WaveHeaderName";
import WaveHeaderFollowers from "./WaveHeaderFollowers";
import WaveHeaderPinned from "./WaveHeaderPinned";

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
  const created = getTimeUntil(wave.created_at);
  const ending = wave.wave.period?.max
    ? getTimeUntil(wave.wave.period.max)
    : null;

  const firstXContributors = wave.contributors_overview.slice(0, 10);

  const ringClasses = useRing
    ? "tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800"
    : "";

  return (
    <div>
      <div
        className={`tw-h-full tw-bg-iron-950 tw-relative tw-overflow-auto ${ringClasses}`}
      >
        <div
          className={`${
            useRounded ? "tw-rounded-t-xl" : ""
          } tw-overflow-hidden`}
        >
          <div
            className="tw-h-14 tw-w-full tw-object-cover"
            style={{
              background: `linear-gradient(45deg, ${wave.author.banner1_color} 0%, ${wave.author.banner2_color} 100%)`,
            }}
          ></div>
        </div>

        <div className="-tw-mt-6 tw-px-5 tw-flex tw-space-x-5">
          <div className="tw-flex">
            {wave.picture ? (
              <img
                className="tw-h-20 tw-w-20 tw-object-contain tw-rounded-full tw-ring-[3px] tw-shadow-lg tw-ring-white/5 tw-bg-iron-900"
                src={getScaledImageUri(wave.picture, ImageScale.W_200_H_200)}
                alt="Wave image"
              />
            ) : (
              <div className="tw-h-20 tw-w-20 tw-rounded-full tw-ring-[3px] tw-ring-iron-950 tw-bg-iron-900" />
            )}
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
              <span className="tw-font-normal tw-text-iron-400 tw-pr-0.5">
                Created
              </span>
              <span className="tw-font-normal tw-text-iron-400">{created}</span>
            </div>
            {ending && (
              <>
                <div className="tw-w-1 tw-h-1 tw-bg-iron-600 tw-rounded-full"></div>
                <div className="tw-text-sm">
                  <span className="tw-font-normal tw-text-iron-400 tw-pr-0.5">
                    Ending
                  </span>
                  <span className="tw-font-normal tw-text-iron-400">
                    {ending}
                  </span>
                </div>
              </>
            )}
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
                      className="tw-inline-block tw-size-6 tw-rounded-md tw-ring-2 tw-ring-black tw-bg-iron-900"
                      src={getScaledImageUri(
                        item.contributor_pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt="Profile image"
                    />
                  ))}
                </div>
                <span className="tw-font-normal tw-ml-2 tw-text-iron-400 tw-text-sm">
                  <span className="tw-text-iron-200 tw-pr-0.5">
                    {numberWithCommas(wave.metrics.drops_count)}
                  </span>
                  {wave.metrics.drops_count === 1 ? "Drop" : "Drops"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
