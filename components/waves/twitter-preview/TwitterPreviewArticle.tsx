import Link from "next/link";
import type { MouseEvent } from "react";

import type { TweetPreviewArticle } from "@/lib/twitter";

function stopCardEvent(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
}

export function TwitterPreviewArticle({
  article,
  articleOnXLabel,
  readArticleLabel,
}: {
  readonly article: TweetPreviewArticle;
  readonly articleOnXLabel: string;
  readonly readArticleLabel: string;
}) {
  return (
    <Link
      href={article.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={stopCardEvent}
      aria-label={readArticleLabel}
      className="tw-group tw-block tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-text-inherit tw-no-underline tw-transition hover:tw-border-sky-400/40 hover:tw-bg-iron-900"
      data-testid="twitter-article-preview"
    >
      {article.coverImageUrl && (
        <div className="tw-aspect-video tw-w-full tw-overflow-hidden tw-bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element -- X cover URLs are validated raw embed assets, matching existing tweet media handling. */}
          <img
            src={article.coverImageUrl}
            alt=""
            className="tw-h-full tw-w-full tw-object-cover tw-transition tw-duration-300 group-hover:tw-scale-[1.01]"
            loading="lazy"
          />
        </div>
      )}
      <div className="tw-flex tw-flex-col tw-gap-y-1.5 tw-p-3">
        <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-sky-200">
          {articleOnXLabel}
        </p>
        <p className="tw-m-0 tw-line-clamp-2 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 group-hover:tw-text-white">
          {article.title}
        </p>
        {article.previewText && (
          <p className="tw-m-0 tw-line-clamp-3 tw-text-sm tw-leading-5 tw-text-iron-300">
            {article.previewText}
          </p>
        )}
      </div>
    </Link>
  );
}
