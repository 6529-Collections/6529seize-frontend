import Link from "next/link";
import { Wave } from "../../../../generated/models/Wave";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";

export default function WaveAuthor({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
      <span className="tw-font-medium tw-text-iron-400">Created by</span>
      <Link
        href={`/${wave.author.handle}`}
        className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-gap-x-2"
      >
        {wave.author.pfp ? (
          <img
            className="tw-h-6 tw-w-6 tw-rounded-md tw-bg-iron-800"
            src={getScaledImageUri(wave.author.pfp, ImageScale.W_AUTO_H_50)}
            alt="Profile Picture"
          />
        ) : (
          <div className="tw-h-6 tw-w-6 tw-rounded-md tw-bg-iron-800" />
        )}
        <span className="tw-font-medium tw-text-md">{wave.author.handle}</span>
      </Link>
    </div>
  );
}
