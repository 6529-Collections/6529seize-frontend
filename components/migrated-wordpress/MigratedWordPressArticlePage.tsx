import { DEFAULT_LOCALE } from "@/i18n/locales";
import { formatDate } from "@/i18n/format";
import type {
  MigratedWordPressArticleBlock,
  MigratedWordPressArticleContent,
  MigratedWordPressArticleMedia,
  MigratedWordPressArticleVideo,
} from "./types";

const ARTICLE_DATE_FORMAT = {
  day: "numeric",
  month: "long",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

const contentTextClassName =
  "tw-text-base tw-leading-8 tw-text-iron-100 sm:tw-text-lg sm:tw-leading-9";

const linkScopeClassName =
  "[&_a]:tw-text-primary-300 [&_a]:tw-underline [&_a]:tw-decoration-primary-400/50 [&_a]:tw-underline-offset-4 hover:[&_a]:tw-text-primary-200";

function MigratedWordPressArticleImage({
  media,
  priority = false,
}: {
  readonly media: MigratedWordPressArticleMedia;
  readonly priority?: boolean;
}) {
  const priorityProps = priority ? { fetchPriority: "high" as const } : {};
  const sizeProps = {
    ...(media.height !== undefined ? { height: media.height } : {}),
    ...(media.width !== undefined ? { width: media.width } : {}),
  };

  const image = (
    <img
      alt={media.alt}
      className="tw-mx-auto tw-h-auto tw-max-h-[34rem] tw-w-auto tw-max-w-full tw-rounded-xl tw-object-contain"
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      src={media.src}
      {...priorityProps}
      {...sizeProps}
    />
  );

  return (
    <figure className="tw-my-9 tw-flex tw-flex-col tw-items-center tw-gap-3 sm:tw-my-11">
      <div className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-p-3 tw-shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
        {media.href ? (
          <a
            aria-label={media.alt}
            className="tw-block tw-no-underline"
            href={media.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {image}
          </a>
        ) : (
          image
        )}
      </div>
      {media.caption ? (
        <figcaption
          className={`tw-text-center tw-text-sm tw-leading-6 tw-text-iron-400 ${linkScopeClassName}`}
        >
          {media.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function MigratedWordPressArticleVideo({
  video,
}: {
  readonly video: MigratedWordPressArticleVideo;
}) {
  return (
    <figure className="tw-my-9 tw-flex tw-flex-col tw-items-center tw-gap-3 sm:tw-my-11">
      <div className="tw-w-full tw-max-w-[28rem] tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black tw-shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
        <video
          aria-label={video.title}
          autoPlay
          className="tw-aspect-square tw-w-full tw-bg-black tw-object-cover"
          controls
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={video.src} type="video/mp4" />
          Sorry, your browser does not support embedded videos.
        </video>
      </div>
      {video.caption ? (
        <figcaption
          className={`tw-text-center tw-text-sm tw-leading-6 tw-text-iron-400 ${linkScopeClassName}`}
        >
          {video.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function MigratedWordPressArticleBlockView({
  block,
}: {
  readonly block: MigratedWordPressArticleBlock;
}) {
  if (block.type === "heading") {
    return (
      <h2 className="tw-mb-4 tw-mt-10 tw-text-2xl tw-font-semibold tw-leading-8 tw-text-white sm:tw-mt-12 sm:tw-text-3xl sm:tw-leading-10">
        {block.content}
      </h2>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p className={`${contentTextClassName} ${linkScopeClassName}`}>
        {block.content}
      </p>
    );
  }

  if (block.type === "image") {
    return <MigratedWordPressArticleImage media={block.media} />;
  }

  if (block.type === "video") {
    return <MigratedWordPressArticleVideo video={block.video} />;
  }

  return (
    <figure className="tw-my-9 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-500/10 tw-px-5 tw-py-5 sm:tw-my-11 sm:tw-px-7 sm:tw-py-6">
      <blockquote
        className={`tw-m-0 ${contentTextClassName} ${linkScopeClassName}`}
      >
        {block.content}
      </blockquote>
      {block.cite ? (
        <figcaption
          className={`tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400 ${linkScopeClassName}`}
        >
          {block.cite}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function MigratedWordPressArticlePage({
  content,
}: {
  readonly content: MigratedWordPressArticleContent;
}) {
  const publishedLabel = formatDate(
    DEFAULT_LOCALE,
    content.publishedAt,
    ARTICLE_DATE_FORMAT
  );

  return (
    <main
      className="tailwind-scope tw-min-h-screen tw-overflow-x-hidden tw-bg-black tw-text-white"
      data-content-source={content.source}
    >
      <article className="tw-mx-auto tw-flex tw-w-full tw-max-w-5xl tw-flex-col tw-px-4 tw-pb-16 tw-pt-10 sm:tw-px-6 sm:tw-pb-20 lg:tw-px-8 lg:tw-pt-14">
        <header className="tw-mx-auto tw-w-full tw-max-w-3xl">
          <p className="tw-mb-4 tw-text-sm tw-font-semibold tw-uppercase tw-leading-5 tw-text-primary-300">
            {content.section}
          </p>
          <h1 className="tw-text-4xl tw-font-semibold tw-leading-tight tw-text-white sm:tw-text-5xl sm:tw-leading-tight">
            {content.title}
          </h1>
          <p className="tw-mt-5 tw-text-lg tw-leading-8 tw-text-iron-300">
            {content.description}
          </p>
          <div
            className={`tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 tw-text-sm tw-leading-6 tw-text-iron-400 ${linkScopeClassName}`}
          >
            <span>
              By{" "}
              <a
                href={content.author.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {content.author.label}
              </a>
            </span>
            <span aria-hidden="true">/</span>
            <time dateTime={content.publishedAt}>{publishedLabel}</time>
            {content.readingTime ? (
              <>
                <span aria-hidden="true">/</span>
                <span>{content.readingTime}</span>
              </>
            ) : null}
          </div>
        </header>

        {content.heroImage ? (
          <div className="tw-mx-auto tw-mt-10 tw-w-full tw-max-w-3xl">
            <MigratedWordPressArticleImage media={content.heroImage} priority />
          </div>
        ) : null}

        <div className="tw-mx-auto tw-mt-10 tw-w-full tw-max-w-3xl tw-space-y-6">
          {content.blocks.map((block, index) => (
            <MigratedWordPressArticleBlockView
              block={block}
              key={`${block.type}-${index}`}
            />
          ))}
        </div>
      </article>
    </main>
  );
}
