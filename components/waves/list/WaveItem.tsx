import Link from "next/link";
import { Wave } from "../../../generated/models/Wave";
import {
  getRandomColorWithSeed,
  numberWithCommas,
} from "../../../helpers/Helpers";
import WaveItemEnding from "./WaveItemEnding";
import WaveItemDropped from "./WaveItemDropped";
import WaveItemFollow from "./WaveItemFollow";
import { getScaledImageUri, ImageScale } from "../../../helpers/image.helpers";

export default function WaveItem({ wave }: { readonly wave: Wave }) {
  const banner1 =
    wave.author.banner1_color ?? getRandomColorWithSeed(wave.author.handle);
  const banner2 =
    wave.author.banner2_color ?? getRandomColorWithSeed(wave.author.handle);

  const LEVEL_CLASSES: { minLevel: number; classes: string }[] = [
    { minLevel: 0, classes: "tw-text-[#DA8C60] tw-ring-[#DA8C60]" },
    { minLevel: 20, classes: "tw-text-[#DAAC60] tw-ring-[#DAAC60]" },
    { minLevel: 40, classes: "tw-text-[#DAC660] tw-ring-[#DAC660]" },
    { minLevel: 60, classes: "tw-text-[#AABE68] tw-ring-[#AABE68]" },
    { minLevel: 80, classes: "tw-text-[#55B075] tw-ring-[#55B075]" },
  ].reverse();

  const getColorClasses = () =>
    LEVEL_CLASSES.find((levelClass) => levelClass.minLevel <= wave.author.level)
      ?.classes ?? LEVEL_CLASSES[0].classes;

  return (
    <div
      style={{
        background:
          "linear-gradient(77deg, rgba(63, 47, 58, 0.40) -23.26%, rgba(46, 53, 66, 0.40) 48.19%, rgba(26, 34, 49, 0.40) 106.85%)",
      }}
      className="tw-pb-4 tw-relative tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800"
    >
      <div
        className="tw-relative tw-w-full tw-h-8 tw-rounded-t-xl"
        style={{
          background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
        }}
      ></div>
      <div className="tw-flex tw-gap-x-2 tw-px-4">
        {wave.picture && (
          <div className="-tw-mt-5 tw-relative tw-flex-shrink-0">
            <div className="tw-h-16 tw-w-16">
              <img
                className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-full tw-bg-iron-700 tw-border-[3px] tw-border-solid tw-border-iron-900"
                src={getScaledImageUri(wave.picture, ImageScale.W_AUTO_H_50)}
                alt="#"
              />
            </div>
          </div>
        )}
        <div className="tw-mt-2">
          <Link
            href={`/waves/${wave.id}`}
            className="tw-no-underline tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-white hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
          >
            {wave.name}
          </Link>
        </div>
      </div>
      <div className="tw-mt-4 tw-px-4">
        <div>
          <Link
            href={`${wave.author.handle}`}
            className="tw-group tw-no-underline tw-inline-flex tw-items-center tw-gap-x-2"
          >
            <div className="tw-h-6 tw-w-6">
              {wave.author.pfp ? (
                <img
                  className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
                  src={getScaledImageUri(
                    wave.author.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt="#"
                />
              ) : (
                <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
              )}
            </div>
            <span className="tw-text-sm tw-font-semibold tw-text-white group-hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
              {wave.author.handle}
            </span>
            <div
              className={`${getColorClasses()} tw-border-none tw-inline-flex tw-items-center tw-rounded-xl tw-bg-transparent tw-px-2 tw-py-1 tw-font-semibold tw-ring-2 tw-ring-inset tw-text-[0.625rem] tw-leading-3`}
            >
              Level {wave.author.level}
            </div>
          </Link>
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-mt-6">
          <div className="tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-text-iron-50">
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
            <span className="tw-font-medium">Chat</span>
          </div>
          <div className="tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-text-iron-50">
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
            <span>
              <span className="tw-font-medium">
                {numberWithCommas(wave.metrics.subscribers_count)}
              </span>{" "}
              <span className="tw-text-iron-400">Followers</span>
            </span>
          </div>
          <WaveItemEnding wave={wave} />
        </div>
        <div className="tw-flex tw-items-center tw-mt-4">
          <WaveItemDropped wave={wave} />
          <div className="tw-flex tw-items-center tw-gap-x-3 tw-ml-auto">
            <Link
              title="View Wave"
              href={`/waves/${wave.id}`}
              className="tw-no-underline tw-border-0 tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-iron-700 tw-px-3 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 hover:tw-text-white tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-size-5 tw-flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                ara-hidden="true"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </Link>
            <WaveItemFollow wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
}
