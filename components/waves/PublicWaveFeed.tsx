import Link from "next/link";

import type { PublicWaveFeedResult } from "@/app/waves/public-wave-feed.server";

export default function PublicWaveFeed({
  feed,
}: {
  readonly feed: Extract<PublicWaveFeedResult, { ok: true }>;
}) {
  if (feed.items.length === 0) {
    return null;
  }

  const headingId = `public-wave-feed-${feed.waveId}`;

  return (
    <section
      aria-labelledby={headingId}
      className="tailwind-scope tw-min-h-full tw-bg-iron-950 tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-px-8"
      data-public-wave-feed={feed.waveId}
    >
      <div className="tw-mx-auto tw-w-full tw-max-w-3xl">
        <h2
          className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-2xl"
          id={headingId}
        >
          {feed.waveName}
        </h2>
        <ol className="tw-m-0 tw-mt-5 tw-list-none tw-space-y-3 tw-p-0">
          {feed.items.map((item) => {
            const linkText = item.title ?? item.excerpt ?? `#${item.serialNo}`;

            return (
              <li key={item.id}>
                <article className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-p-4">
                  <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-400">
                    {item.authorLabel}
                  </p>
                  <h3 className="tw-m-0 tw-mt-1 tw-text-base tw-font-semibold tw-leading-snug">
                    <Link
                      className="tw-break-words tw-text-iron-50 tw-no-underline tw-outline-none tw-transition-colors focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300"
                      href={item.href}
                      prefetch={false}
                    >
                      {linkText}
                    </Link>
                  </h3>
                  {item.title && item.excerpt ? (
                    <p className="tw-m-0 tw-mt-2 tw-break-words tw-text-sm tw-leading-6 tw-text-iron-300">
                      {item.excerpt}
                    </p>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
