import Link from "next/link";

import type { PublicWaveFeedResult } from "@/app/waves/public-wave-feed.server";

export default function PublicWaveFeed({
  feed,
}: {
  readonly feed: Extract<PublicWaveFeedResult, { ok: true }>;
}) {
  if (feed.items.length === 0) return null;
  const headingId = `public-wave-feed-${feed.waveId}`;

  return (
    <section
      aria-labelledby={headingId}
      className="tailwind-scope tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-bg-iron-950"
      data-public-wave-feed={feed.waveId}
    >
      <div className="tw-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3">
        <h2
          className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50 lg:tw-text-xl"
          id={headingId}
        >
          {feed.waveName}
        </h2>
      </div>
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col-reverse tw-overflow-y-auto">
        <ol className="tw-m-0 tw-flex tw-min-h-full tw-shrink-0 tw-list-none tw-flex-col tw-justify-end tw-gap-5 tw-px-4 tw-py-5 sm:tw-px-6">
          {[...feed.items].reverse().map((item) => (
            <li key={item.id}>
              <article className="tw-flex tw-gap-3">
                <div
                  aria-hidden="true"
                  className="tw-size-9 tw-shrink-0 tw-rounded-full tw-bg-iron-800"
                />
                <div className="tw-min-w-0 tw-flex-1">
                  <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
                    {item.authorLabel}
                  </p>
                  <h3 className="tw-m-0 tw-mt-1 tw-text-sm tw-font-normal tw-leading-6">
                    <Link
                      className="tw-break-words tw-text-iron-100 tw-no-underline tw-outline-none focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300"
                      href={item.href}
                      prefetch={false}
                    >
                      {item.title ?? item.excerpt ?? `#${item.serialNo}`}
                    </Link>
                  </h3>
                  {item.title && item.excerpt ? (
                    <p className="tw-m-0 tw-mt-1 tw-break-words tw-text-sm tw-leading-6 tw-text-iron-300">
                      {item.excerpt}
                    </p>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
