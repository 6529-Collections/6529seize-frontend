"use client";

import { MouseEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApiWave } from "@/generated/models/ApiWave";
import { numberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

export default function WaveItemDropped({ wave }: { readonly wave: ApiWave }) {
  const contributors = wave.contributors_overview ?? [];
  const router = useRouter();

  const handleContributorClick = useCallback(
    (href: string) =>
      (event: MouseEvent<HTMLButtonElement>) => {
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          event.stopPropagation();
          window.open(href, "_blank", "noopener,noreferrer");
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        router.push(href);
      },
    [router]
  );

  const handleContributorAuxClick = useCallback(
    (href: string) =>
      (event: MouseEvent<HTMLButtonElement>) => {
        if (event.button !== 1) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        window.open(href, "_blank", "noopener,noreferrer");
      },
    []
  );

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
              {c.contributor_pfp ? (
                <img
                  className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-ring-[1.5px] tw-ring-black tw-transition tw-duration-200 tw-ease-out desktop-hover:group-hover/item:tw-brightness-110 desktop-hover:group-hover/item:tw-scale-[1.05]"
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
              ) : (
                <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-700 tw-ring-1 tw-ring-black">
                  <span className="tw-text-[0.625rem] tw-font-semibold tw-text-iron-300">
                    {c.contributor_identity?.slice(0, 2).toUpperCase() ?? "?"}
                  </span>
                </div>
              )}
            </div>
          );

          return (
            <div key={baseKey} className="tw-block tw-group/item">
              {contributorHref ? (
                <button
                  type="button"
                  data-wave-item-interactive="true"
                  onClick={handleContributorClick(contributorHref)}
                  onAuxClick={handleContributorAuxClick(contributorHref)}
                  className="tw-cursor-pointer tw-bg-transparent tw-border-none tw-p-0 tw-m-0 tw-inline-flex"
                  aria-label={
                    c.contributor_identity
                      ? `View @${c.contributor_identity}`
                      : "View contributor profile"
                  }
                >
                  {avatar}
                </button>
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
