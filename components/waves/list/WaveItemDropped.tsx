import Link from "next/link";
import { ApiWave } from "@/generated/models/ApiWave";
import { numberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

export default function WaveItemDropped({ wave }: { readonly wave: ApiWave }) {
  const contributors = wave.contributors_overview ?? [];

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2 tw-min-w-0">
      <div className="tw-hidden @[320px]/wave:tw-flex tw-items-center -tw-space-x-1 tw-flex-shrink">
        {contributors.map((c, index) => {
          const baseKey = `${c.contributor_identity ?? "anon"}-${c.contributor_pfp ?? "no-pfp"}-${index}`;
          const contributorHref = c.contributor_identity
            ? `/${c.contributor_identity}`
            : undefined;

          const avatar = (
            <div className="tw-h-6 tw-w-6">
              <img
                className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-ring-[1.5px] tw-ring-black"
                src={getScaledImageUri(
                  c.contributor_pfp,
                  ImageScale.W_AUTO_H_50
                )}
                alt={
                  c.contributor_identity
                    ? `${c.contributor_identity} avatar`
                    : "Contributor avatar"
                }
                loading="lazy"
                decoding="async"
              />
            </div>
          );

          return (
            <div key={baseKey} className="tw-block">
              {contributorHref ? (
                <Link href={contributorHref} prefetch={false}>
                  {avatar}
                </Link>
              ) : (
                avatar
              )}
            </div>
          );
        })}
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-1 tw-text-sm tw-min-w-0">
        <span className="tw-text-iron-200 tw-font-medium tw-flex-shrink-0">
          {numberWithCommas(wave.metrics.drops_count)}
        </span>
        <span className="tw-text-iron-400 tw-truncate tw-min-w-0">
          {wave.metrics.drops_count === 1 ? "Drop" : "Drops"}
        </span>
      </div>
    </div>
  );
}
