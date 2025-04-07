import Link from "next/link";
import { ApiWave } from "../../../generated/models/ApiWave";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../helpers/image.helpers";

export default function WaveAuthor({ wave }: { readonly wave: ApiWave }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <Link
        href={`/${wave.author.handle}`}
        className="tw-no-underline hover:tw-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-gap-x-1.5"
      >
        {wave.author.pfp ? (
          <img
            className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800"
            src={getScaledImageUri(wave.author.pfp, ImageScale.W_AUTO_H_50)}
            alt={`${wave.author.handle}`}
          />
        ) : (
          <div className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800" />
        )}
        <span className="tw-font-medium tw-text-sm">{wave.author.handle}</span>
      </Link>
    </div>
  );
}
