"use client";

import { useContext, useMemo } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getTimeAgo, numberWithCommas } from "@/helpers/Helpers";
import WaveHeaderFollow, { WaveFollowBtnSize } from "./WaveHeaderFollow";
import { AuthContext } from "@/components/auth/Auth";
import WaveHeaderOptions from "./options/WaveHeaderOptions";
import WaveHeaderName from "./name/WaveHeaderName";
import WaveHeaderFollowers from "./WaveHeaderFollowers";
import WaveHeaderPinButton from "./WaveHeaderPinButton";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import WavePicture from "../WavePicture";
import { Time } from "@/helpers/time";
import WaveNotificationSettings from "../specs/WaveNotificationSettings";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import WaveHeaderPictureEdit from "./picture/WaveHeaderPictureEdit";
import WaveRepButton from "./rep/WaveRepButton";

interface WaveHeaderProps {
  readonly wave: ApiWave;
  readonly onFollowersClick: () => void;
  readonly useRing?: boolean | undefined;
  readonly useRounded?: boolean | undefined;
}

export default function WaveHeader({
  wave,
  onFollowersClick,
  useRing = true,
  useRounded = true,
}: WaveHeaderProps) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const created = getTimeAgo(wave.created_at);
  const firstXContributors = wave.contributors_overview.slice(0, 10);
  const isDropWave = wave.wave.type !== ApiWaveType.Chat;
  const isDirectMessage = wave.chat.scope.group?.is_direct_message ?? false;
  const isSubwave = Boolean(wave.parent_wave);
  const canEdit = useMemo(
    () =>
      !isDirectMessage &&
      canEditWave({ connectedProfile, activeProfileProxy, wave }),
    [activeProfileProxy, connectedProfile, isDirectMessage, wave]
  );

  let ringClasses = "";
  if (useRing) {
    ringClasses =
      "tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800/60 tw-shadow-sm";
  } else if (useRounded) {
    ringClasses = "tw-rounded-t-xl lg:tw-rounded-t-none";
  }

  const connectedHandle = connectedProfile?.handle;
  const normalizedConnectedHandle = connectedHandle?.toLowerCase() ?? null;
  const waveAuthorHandle = wave.author?.handle ?? null;
  const normalizedWaveAuthorHandle = waveAuthorHandle?.toLowerCase() ?? null;
  const canUseWaveActions =
    normalizedConnectedHandle !== null && !activeProfileProxy;
  const showNotificationSettings =
    canUseWaveActions && !!wave.subscribed_actions.length;
  const showOwnerOptions =
    canUseWaveActions &&
    normalizedConnectedHandle === normalizedWaveAuthorHandle;
  const showCreateSubwaveOption =
    canUseWaveActions &&
    !isDirectMessage &&
    !isSubwave &&
    wave.wave.authenticated_user_eligible_for_admin === true;
  const showWaveRepAction =
    canUseWaveActions &&
    !isDirectMessage &&
    normalizedWaveAuthorHandle !== null &&
    normalizedConnectedHandle !== normalizedWaveAuthorHandle;
  const showOptions = showOwnerOptions || showCreateSubwaveOption;
  const titleActionAlignmentClass = isSubwave ? "tw-mt-[22px]" : "";

  return (
    <div
      className={`tw-relative tw-overflow-hidden tw-bg-iron-950 ${ringClasses}`}
    >
      <div
        className={`${
          useRounded
            ? "tw-rounded-t-xl tw-ring-1 tw-ring-inset tw-ring-iron-800/70"
            : ""
        } tw-overflow-hidden tw-bg-iron-950`}
      >
        <div
          className="tw-relative tw-h-16 tw-w-full tw-object-cover"
          style={{
            background: `linear-gradient(135deg, ${wave.author?.banner1_color ?? "#1f2937"} 0%, ${wave.author?.banner2_color ?? "#0f172a"} 58%, #050505 100%)`,
            boxShadow: "inset 0 -22px 34px rgba(0,0,0,0.42)",
          }}
        >
          <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-px tw-bg-white/10" />
        </div>
      </div>

      <div className="-tw-mt-6 tw-px-4 tw-pb-6">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-4">
          <div className="tw-group tw-relative tw-h-16 tw-w-16 tw-shrink-0">
            <div
              className={`tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-full tw-bg-iron-900 tw-shadow-[0_18px_36px_rgba(0,0,0,0.35)] ${
                isDropWave ? "tw-ring-2 tw-ring-white/15" : ""
              }`}
            >
              <WavePicture
                name={wave.name}
                picture={wave.picture}
                contributors={wave.contributors_overview.map((c) => ({
                  pfp: c.contributor_pfp,
                  identity: c.contributor_identity,
                }))}
                roundedClassName="tw-rounded-full"
              />
            </div>
            {canEdit && (
              <div className="tw-absolute tw-inset-0">
                <WaveHeaderPictureEdit wave={wave} />
              </div>
            )}
            {isDropWave && (
              <div className="tw-absolute -tw-bottom-1 -tw-right-1 tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-800/70 tw-bg-iron-950 tw-shadow-md">
                <svg
                  className="tw-size-3.5 tw-flex-shrink-0 tw-text-[#E8D48A]"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                >
                  <path
                    fill="currentColor"
                    d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                  />
                </svg>
              </div>
            )}
          </div>

          {canUseWaveActions && (
            <div className="tw-mt-8 tw-flex tw-min-w-0 tw-flex-1 tw-flex-nowrap tw-items-center tw-justify-end tw-gap-1.5">
              {showNotificationSettings && (
                <div className="tw-shrink-0">
                  <WaveNotificationSettings wave={wave} compact />
                </div>
              )}
              <div className="tw-shrink-0">
                <WaveHeaderFollow wave={wave} size={WaveFollowBtnSize.SMALL} />
              </div>
            </div>
          )}
        </div>

        <div className="tw-mt-5 tw-flex tw-min-w-0 tw-items-start tw-gap-x-3">
          <div className="tw-min-w-0 tw-flex-1">
            <WaveHeaderName wave={wave} />
          </div>
          {(showOptions || !isSubwave) && (
            <div
              className={`tw-flex tw-shrink-0 tw-items-center tw-justify-end tw-gap-1.5 ${titleActionAlignmentClass}`}
            >
              {showOptions && (
                <WaveHeaderOptions
                  wave={wave}
                  showOwnerActions={showOwnerOptions}
                />
              )}
              {!isSubwave && <WaveHeaderPinButton waveId={wave.id} />}
            </div>
          )}
        </div>

        <div className="tw-mt-1 tw-text-sm">
          <span className="tw-font-normal tw-text-iron-500">
            Created {created} ·{" "}
            {Time.millis(wave.created_at).toDate().toLocaleDateString()}
          </span>
        </div>

        <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-y-3">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-3">
            <div className="tw-flex tw-items-center tw-gap-x-4">
              <WaveHeaderFollowers
                wave={wave}
                onFollowersClick={onFollowersClick}
              />
              {!!firstXContributors.length && (
                <div className="tw-flex tw-items-center">
                  <span className="tw-ml-2.5 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-500">
                    <span className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-50">
                      {numberWithCommas(wave.metrics.drops_count)}
                    </span>{" "}
                    {wave.metrics.drops_count === 1 ? "Post" : "Posts"}
                  </span>
                </div>
              )}
            </div>
            {showWaveRepAction && (
              <div className="tw-shrink-0">
                <WaveRepButton wave={wave} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
