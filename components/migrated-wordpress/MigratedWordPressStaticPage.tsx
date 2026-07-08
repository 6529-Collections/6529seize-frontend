import { MigratedWordPressArticleBlockView } from "./MigratedWordPressArticlePage";
import type { MigratedWordPressStaticPageContent } from "./types";

export default function MigratedWordPressStaticPage({
  content,
}: {
  readonly content: MigratedWordPressStaticPageContent;
}) {
  return (
    <main
      className="tailwind-scope tw-min-h-screen tw-overflow-x-hidden tw-bg-black tw-text-white"
      data-content-source={content.source}
    >
      <article className="tw-flex tw-w-full tw-flex-col tw-px-4 tw-pb-16 tw-pt-10 sm:tw-px-6 sm:tw-pb-20 lg:tw-px-10 lg:tw-pt-14 xl:tw-px-14">
        <header className="tw-w-full">
          <p className="tw-mb-4 tw-text-sm tw-font-semibold tw-uppercase tw-leading-5 tw-text-primary-300">
            {content.section}
          </p>
          <h1 className="tw-text-4xl tw-font-semibold tw-leading-tight tw-text-white sm:tw-text-5xl sm:tw-leading-tight">
            {content.title}
          </h1>
          <p className="tw-mt-5 tw-text-lg tw-leading-8 tw-text-iron-300">
            {content.description}
          </p>
        </header>

        {content.heroImage ? (
          <div className="tw-mt-10 tw-w-full">
            <MigratedWordPressArticleBlockView
              block={{ type: "image", media: content.heroImage }}
            />
          </div>
        ) : null}

        <div className="tw-mt-10 tw-w-full tw-space-y-6">
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
