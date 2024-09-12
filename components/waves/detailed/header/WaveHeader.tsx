import { useContext } from "react";
import { Wave } from "../../../../generated/models/Wave";
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

export default function WaveHeader({
  wave,
  onFollowersClick,
}: {
  readonly wave: Wave;
  readonly onFollowersClick: () => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const created = getTimeUntil(wave.created_at);
  const ending = wave.wave.period?.max
    ? getTimeUntil(wave.wave.period.max)
    : null;

  const firstXContributors = wave.contributors_overview.slice(0, 10);
  return (
    <div className="tw-bg-iron-950 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl tw-overflow-auto">
      <div className="tw-border tw-border-b-0 tw-border-solid tw-border-iron-900 tw-rounded-t-xl tw-overflow-hidden">
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
              className="tw-h-20 tw-w-20 tw-object-contain tw-rounded-full tw-ring-[3px] tw-ring-iron-950 tw-bg-iron-900"
              src={getScaledImageUri(wave.picture, ImageScale.W_200_H_200)}
              alt="Wave image"
            />
          ) : (
            <div className="tw-h-20 tw-w-20 tw-rounded-full tw-ring-[3px] tw-ring-iron-950 tw-bg-iron-900" />
          )}
        </div>

        <div className="tw-mt-4 md:tw-mt-10 tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-end tw-space-x-6 tw-pb-1">
          <div className="tw-min-w-0 tw-flex-1 tw-hidden md:tw-block">
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
        <div className="tw-flex tw-items-center tw-gap-x-2 tw-mb-2">
          <div className="tw-text-xs">
            <span className="tw-font-normal tw-text-iron-400 tw-pr-1">
              Created
            </span>
            <span className="tw-font-normal tw-text-iron-400">{created}</span>
          </div>
          {ending && (
            <>
              <div className="tw-w-1 tw-h-1 tw-bg-iron-600 tw-rounded-full"></div>
              <div className="tw-text-xs">
                <span className="tw-font-normal tw-text-iron-400 tw-pr-1">
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
          <WaveHeaderFollowers
            wave={wave}
            onFollowersClick={onFollowersClick}
          />
          <div className="tw-flex tw-justify-between">
            {!!firstXContributors.length && (
              <div className="tw-flex tw-items-center">
                <div className="tw-flex -tw-space-x-2">
                  {firstXContributors.map((item) => (
                    <img
                      key={item.contributor_identity}
                      className="tw-inline-block tw-h-6 tw-w-6 tw-rounded-md tw-ring-2 tw-ring-black"
                      src={getScaledImageUri(
                        item.contributor_pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt=""
                    />
                  ))}
                </div>
                <span className="tw-font-normal tw-ml-2 tw-text-iron-400 tw-text-sm">
                  <span className="tw-text-iron-200">
                    {numberWithCommas(wave.metrics.drops_count)}
                  </span>{" "}
                  {wave.metrics.drops_count === 1 ? "Drop" : "Drops"}
                </span>
              </div>
            )}
            <button
              type="button"
              className="tw-h-8 tw-w-8 tw-text-iron-400 hover:tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-rounded-lg tw-bg-iron-800 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-size-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.0004 15L12.0004 22M8.00043 7.30813V9.43875C8.00043 9.64677 8.00043 9.75078 7.98001 9.85026C7.9619 9.93852 7.93194 10.0239 7.89095 10.1042C7.84474 10.1946 7.77977 10.2758 7.64982 10.4383L6.08004 12.4005C5.4143 13.2327 5.08143 13.6487 5.08106 13.9989C5.08073 14.3035 5.21919 14.5916 5.4572 14.7815C5.73088 15 6.26373 15 7.32943 15H16.6714C17.7371 15 18.27 15 18.5437 14.7815C18.7817 14.5916 18.9201 14.3035 18.9198 13.9989C18.9194 13.6487 18.5866 13.2327 17.9208 12.4005L16.351 10.4383C16.2211 10.2758 16.1561 10.1946 16.1099 10.1042C16.0689 10.0239 16.039 9.93852 16.0208 9.85026C16.0004 9.75078 16.0004 9.64677 16.0004 9.43875V7.30813C16.0004 7.19301 16.0004 7.13544 16.0069 7.07868C16.0127 7.02825 16.0223 6.97833 16.0357 6.92937C16.0507 6.87424 16.0721 6.8208 16.1149 6.71391L17.1227 4.19423C17.4168 3.45914 17.5638 3.09159 17.5025 2.79655C17.4489 2.53853 17.2956 2.31211 17.0759 2.1665C16.8247 2 16.4289 2 15.6372 2H8.36368C7.57197 2 7.17611 2 6.92494 2.1665C6.70529 2.31211 6.55199 2.53853 6.49838 2.79655C6.43707 3.09159 6.58408 3.45914 6.87812 4.19423L7.88599 6.71391C7.92875 6.8208 7.95013 6.87424 7.96517 6.92937C7.97853 6.97833 7.98814 7.02825 7.99392 7.07868C8.00043 7.13544 8.00043 7.19301 8.00043 7.30813Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
