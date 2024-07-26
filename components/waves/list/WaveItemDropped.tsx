import Link from "next/link";
import { Wave } from "../../../generated/models/Wave";
import { numberWithCommas } from "../../../helpers/Helpers";
import { getScaledImageUri, ImageScale } from "../../../helpers/image.helpers";

export default function WaveItemDropped({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <div className="tw-flex -tw-space-x-1">
        {wave.contributors_overview.map((c) => (
          <Link href={`${c.contributor_identity}`} key={c.contributor_identity}>
            <div className="tw-h-6 tw-w-6">
              <img
                className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-ring-[1.5px] tw-ring-black"
                src={getScaledImageUri(
                  c.contributor_pfp,
                  ImageScale.W_AUTO_H_50
                )}
                alt="#"
              />
            </div>
          </Link>
        ))}
      </div>
      <span className="tw-text-sm">
        <span className="tw-text-iron-50 tw-font-medium">
          {numberWithCommas(wave.metrics.drops_count)}
        </span>{" "}
        <span className="tw-text-iron-400">
          {wave.metrics.drops_count === 1 ? "Drop" : "Drops"}
        </span>
      </span>
    </div>
  );
}
