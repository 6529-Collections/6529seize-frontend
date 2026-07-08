import type { ReactNode } from "react";

import { MigratedWordPressArticleBlockView } from "./MigratedWordPressArticlePage";
import type {
  MigratedWordPressArticleBlock,
  MigratedWordPressArticleMedia,
  MigratedWordPressStaticPageContent,
} from "./types";

type MuseumGalleryEntry =
  | {
      readonly type: "section";
      readonly title: string;
    }
  | {
      readonly type: "card";
      readonly title: string;
      readonly media?: MigratedWordPressArticleMedia;
      readonly links: readonly MuseumCollectionLink[];
    };

type MuseumCollectionLink = {
  readonly href: string;
  readonly label: string;
};

type MuseumCollectionItem = {
  readonly href: string;
  readonly title: string;
  readonly subtitle?: string;
};

type MuseumCollectionSection = {
  readonly title: string;
  readonly items: readonly MuseumCollectionItem[];
  readonly notes: readonly MigratedWordPressArticleBlock[];
};

type MuseumDetailGroup = {
  readonly media: MigratedWordPressArticleMedia;
  readonly blocks: readonly MigratedWordPressArticleBlock[];
};

const compactLinkClassName =
  "tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 hover:tw-text-primary-200";

function isMuseumPath(path: string) {
  return path === "/museum" || path.startsWith("/museum/");
}

function textFromContent(content: MigratedWordPressArticleBlock["content"]) {
  return typeof content === "string" ? content : "";
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'");
}

function stripHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|h[1-6]|li|p)>/gi, "\n")
      .replace(/<(div|h[1-6]|li|p)\b[^>]*>/gi, "\n")
      .replace(/<\/?(ol|ul)\b[^>]*>/gi, "\n")
      .replace(/<[^>]*>/g, "")
  );
}

function htmlLines(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|h[1-6]|li|p)>/gi, "\n")
    .split("\n")
    .map((line) => normalizeText(stripHtml(line)))
    .filter(Boolean);
}

function extractLinks(value: string): MuseumCollectionLink[] {
  const links: MuseumCollectionLink[] = [];
  const anchorPattern =
    /<a\b[^>]*\bhref=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(value)) !== null) {
    const href = match[1] ?? match[2];
    const label = normalizeText(stripHtml(match[3] ?? ""));
    if (href && label) {
      links.push({ href, label });
    }
  }
  return links;
}

function getCollectionItem(
  block: MigratedWordPressArticleBlock
): MuseumCollectionItem | null {
  if (block.type !== "html") return null;

  const links = extractLinks(block.html);
  const primaryLink = links[0];
  if (!primaryLink) return null;

  const title = primaryLink.label;
  const subtitle = htmlLines(block.html)
    .filter((line) => line.toLowerCase() !== title.toLowerCase())
    .join(" ");

  return {
    href: primaryLink.href,
    title,
    subtitle: subtitle || undefined,
  };
}

function countImageBlocks(blocks: readonly MigratedWordPressArticleBlock[]) {
  return blocks.filter((block) => block.type === "image").length;
}

function countCollectionItems(blocks: readonly MigratedWordPressArticleBlock[]) {
  return blocks.filter((block) => getCollectionItem(block)).length;
}

function shouldUseCollectionIndexLayout(
  content: MigratedWordPressStaticPageContent
) {
  if (!isMuseumPath(content.path) || content.path === "/museum") return false;
  return (
    countImageBlocks(content.blocks) <= 1 &&
    countCollectionItems(content.blocks) >= 4
  );
}

function shouldUseMuseumDetailLayout(content: MigratedWordPressStaticPageContent) {
  if (!isMuseumPath(content.path) || content.path === "/museum") return false;
  if (shouldUseCollectionIndexLayout(content)) return false;
  return countImageBlocks(content.blocks) > 0;
}

function renderExternalAttrs(href?: string) {
  return href?.startsWith("http")
    ? { rel: "noopener noreferrer", target: "_blank" }
    : {};
}

function MuseumImageTile({
  media,
  compact = false,
}: {
  readonly media: MigratedWordPressArticleMedia;
  readonly compact?: boolean;
}) {
  const sizeProps = {
    ...(media.height !== undefined ? { height: media.height } : {}),
    ...(media.width !== undefined ? { width: media.width } : {}),
  };
  const image = (
    <img
      alt={media.href ? "" : media.alt}
      className={[
        "tw-mx-auto tw-block tw-h-auto tw-w-auto tw-max-w-full tw-object-contain",
        compact ? "tw-max-h-28" : "tw-max-h-80",
      ].join(" ")}
      decoding="async"
      loading="lazy"
      src={media.src}
      {...sizeProps}
    />
  );

  return (
    <div
      className={[
        "tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white",
        compact ? "tw-min-h-36 tw-p-4" : "tw-min-h-80 tw-p-4",
      ].join(" ")}
    >
      {media.href ? (
        <a
          aria-label={media.alt}
          className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-no-underline"
          href={media.href}
          {...renderExternalAttrs(media.href)}
        >
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}

function StaticPageShell({
  children,
  content,
  showDescription,
}: {
  readonly children: ReactNode;
  readonly content: MigratedWordPressStaticPageContent;
  readonly showDescription: boolean;
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
          {showDescription ? (
            <p className="tw-mt-5 tw-text-lg tw-leading-8 tw-text-iron-300">
              {content.description}
            </p>
          ) : null}
        </header>

        {content.heroImage ? (
          <div className="tw-mt-10 tw-w-full">
            <MigratedWordPressArticleBlockView
              block={{ type: "image", media: content.heroImage }}
            />
          </div>
        ) : null}

        {children}
      </article>
    </main>
  );
}

function parseMuseumGalleryEntries(
  blocks: readonly MigratedWordPressArticleBlock[]
) {
  const entries: MuseumGalleryEntry[] = [];
  let pendingImage: MigratedWordPressArticleMedia | undefined;
  let pendingTitle = "";
  let pendingLinks: MuseumCollectionLink[] = [];

  const flushCard = () => {
    if (!pendingImage && !pendingTitle) return;
    entries.push({
      type: "card",
      title: pendingTitle,
      media: pendingImage,
      links: pendingLinks,
    });
    pendingImage = undefined;
    pendingTitle = "";
    pendingLinks = [];
  };

  blocks.forEach((block, index) => {
    if (block.type === "image") {
      flushCard();
      pendingImage = block.media;
      return;
    }

    if (block.type === "heading") {
      const title = normalizeText(textFromContent(block.content));
      const nextBlock = blocks[index + 1];
      if (!pendingImage && nextBlock?.type === "image") {
        flushCard();
        entries.push({ type: "section", title });
        return;
      }
      pendingTitle = title;
      return;
    }

    if (block.type === "html") {
      const links = extractLinks(block.html);
      if (links.length > 0) {
        pendingLinks = links;
        flushCard();
      }
    }
  });

  flushCard();
  return entries;
}

function MuseumDirectoryPage({
  content,
}: {
  readonly content: MigratedWordPressStaticPageContent;
}) {
  const galleriesIndex = content.blocks.findIndex(
    (block) =>
      block.type === "heading" &&
      textFromContent(block.content).includes("GALLERIES")
  );
  const mapIndex = content.blocks.findIndex(
    (block) =>
      block.type === "heading" && textFromContent(block.content).includes("MAP")
  );
  const introBlocks =
    galleriesIndex === -1 ? content.blocks : content.blocks.slice(0, galleriesIndex);
  const galleryBlocks =
    galleriesIndex === -1
      ? []
      : content.blocks.slice(
          galleriesIndex + 1,
          mapIndex === -1 ? undefined : mapIndex
        );
  const mapBlocks = mapIndex === -1 ? [] : content.blocks.slice(mapIndex);
  const galleryEntries = parseMuseumGalleryEntries(galleryBlocks);

  return (
    <StaticPageShell content={content} showDescription={false}>
      <div className="tw-mt-10 tw-w-full tw-space-y-6">
        {introBlocks.map((block, index) => (
          <MigratedWordPressArticleBlockView
            block={block}
            key={`museum-intro-${block.type}-${index}`}
          />
        ))}
      </div>

      <section className="tw-mt-14 tw-w-full" data-museum-directory-grid>
        <h2 className="tw-text-2xl tw-font-semibold tw-leading-8 tw-text-white sm:tw-text-3xl sm:tw-leading-10">
          6529 Museum of Art Galleries
        </h2>
        <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-5 md:tw-grid-cols-2 xl:tw-grid-cols-3">
          {galleryEntries.map((entry, index) =>
            entry.type === "section" ? (
              <h3
                className="tw-mt-4 tw-text-xl tw-font-semibold tw-leading-7 tw-text-white md:tw-col-span-2 xl:tw-col-span-3"
                key={`section-${entry.title}-${index}`}
              >
                {entry.title}
              </h3>
            ) : (
              <article
                className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-4"
                key={`gallery-${entry.title}-${index}`}
              >
                {entry.media ? (
                  <MuseumImageTile compact media={entry.media} />
                ) : null}
                <h3 className="tw-mt-4 tw-text-lg tw-font-semibold tw-leading-7 tw-text-white">
                  {entry.title}
                </h3>
                {entry.links.length > 0 ? (
                  <ul className="tw-mt-3 tw-space-y-2 tw-pl-0">
                    {entry.links.map((link) => (
                      <li className="tw-list-none" key={link.href}>
                        <a className={compactLinkClassName} href={link.href}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            )
          )}
        </div>
      </section>

      {mapBlocks.length > 0 ? (
        <div className="tw-mt-14 tw-w-full tw-space-y-6">
          {mapBlocks.map((block, index) => (
            <MigratedWordPressArticleBlockView
              block={block}
              key={`museum-map-${block.type}-${index}`}
            />
          ))}
        </div>
      ) : null}
    </StaticPageShell>
  );
}

function parseMuseumCollectionSections(
  blocks: readonly MigratedWordPressArticleBlock[]
) {
  const sections: MuseumCollectionSection[] = [];
  const introBlocks: MigratedWordPressArticleBlock[] = [];
  let currentSection: {
    title: string;
    items: MuseumCollectionItem[];
    notes: MigratedWordPressArticleBlock[];
  } | null = null;

  const flushSection = () => {
    if (
      currentSection &&
      (currentSection.items.length > 0 || currentSection.notes.length > 0)
    ) {
      sections.push(currentSection);
    }
    currentSection = null;
  };

  for (const block of blocks) {
    if (block.type === "heading") {
      flushSection();
      currentSection = {
        title: normalizeText(textFromContent(block.content)),
        items: [],
        notes: [],
      };
      continue;
    }

    if (!currentSection) {
      introBlocks.push(block);
      continue;
    }

    const item = getCollectionItem(block);
    if (item) {
      currentSection.items.push(item);
    } else {
      currentSection.notes.push(block);
    }
  }

  flushSection();
  return { introBlocks, sections };
}

function MuseumCollectionIndexPage({
  content,
}: {
  readonly content: MigratedWordPressStaticPageContent;
}) {
  const { introBlocks, sections } = parseMuseumCollectionSections(content.blocks);

  return (
    <StaticPageShell content={content} showDescription={false}>
      <div className="tw-mt-10 tw-w-full tw-space-y-6">
        {introBlocks.map((block, index) => (
          <MigratedWordPressArticleBlockView
            block={block}
            key={`collection-intro-${block.type}-${index}`}
          />
        ))}
      </div>

      <div className="tw-mt-12 tw-space-y-12" data-museum-collection-index>
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="tw-text-2xl tw-font-semibold tw-leading-8 tw-text-white sm:tw-text-3xl sm:tw-leading-10">
              {section.title}
            </h2>
            {section.items.length > 0 ? (
              <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
                {section.items.map((item) => (
                  <a
                    className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-4 tw-py-4 tw-no-underline tw-transition hover:tw-border-primary-300/60 hover:tw-bg-primary-500/10"
                    href={item.href}
                    key={item.href}
                  >
                    <span className="tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-primary-300">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="tw-mt-1 tw-block tw-text-sm tw-leading-6 tw-text-iron-300">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            ) : null}
            {section.notes.length > 0 ? (
              <div className="tw-mt-5 tw-space-y-4">
                {section.notes.map((block, index) => (
                  <MigratedWordPressArticleBlockView
                    block={block}
                    key={`collection-note-${section.title}-${block.type}-${index}`}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </StaticPageShell>
  );
}

function splitMuseumDetailBlocks(
  blocks: readonly MigratedWordPressArticleBlock[]
) {
  const introBlocks: MigratedWordPressArticleBlock[] = [];
  const groups: MuseumDetailGroup[] = [];
  const tailBlocks: MigratedWordPressArticleBlock[] = [];
  let currentGroup: {
    media: MigratedWordPressArticleMedia;
    blocks: MigratedWordPressArticleBlock[];
  } | null = null;
  let inTail = false;

  const flushGroup = () => {
    if (currentGroup) {
      groups.push(currentGroup);
    }
    currentGroup = null;
  };

  for (const block of blocks) {
    if (block.type === "image") {
      flushGroup();
      currentGroup = { media: block.media, blocks: [] };
      inTail = false;
      continue;
    }

    if (currentGroup && block.type !== "heading") {
      currentGroup.blocks.push(block);
      continue;
    }

    if (currentGroup && block.type === "heading") {
      flushGroup();
      inTail = true;
    }

    if (groups.length > 0 || inTail) {
      tailBlocks.push(block);
    } else {
      introBlocks.push(block);
    }
  }

  flushGroup();
  return { groups, introBlocks, tailBlocks };
}

function MuseumDetailPage({
  content,
}: {
  readonly content: MigratedWordPressStaticPageContent;
}) {
  const { groups, introBlocks, tailBlocks } = splitMuseumDetailBlocks(
    content.blocks
  );

  return (
    <StaticPageShell content={content} showDescription={false}>
      {introBlocks.length > 0 ? (
        <div
          className="tw-mt-10 tw-w-full tw-space-y-5"
          data-museum-detail-intro
        >
          {introBlocks.map((block, index) => (
            <MigratedWordPressArticleBlockView
              block={block}
              key={`detail-intro-${block.type}-${index}`}
            />
          ))}
        </div>
      ) : null}

      {groups.length > 0 ? (
        <div
          className="tw-mt-10 tw-grid tw-grid-cols-1 tw-gap-6 xl:tw-grid-cols-2"
          data-museum-detail-grid
        >
          {groups.map((group, index) => (
            <article
              className="tw-grid tw-gap-5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-4 lg:tw-grid-cols-[minmax(12rem,18rem)_1fr]"
              data-museum-detail-card
              key={`${group.media.src}-${index}`}
            >
              <MuseumImageTile media={group.media} />
              <div className="tw-space-y-3">
                {group.blocks.map((block, blockIndex) => (
                  <MigratedWordPressArticleBlockView
                    block={block}
                    key={`detail-card-${block.type}-${blockIndex}`}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tailBlocks.length > 0 ? (
        <div className="tw-mt-10 tw-w-full tw-space-y-6">
          {tailBlocks.map((block, index) => (
            <MigratedWordPressArticleBlockView
              block={block}
              key={`detail-tail-${block.type}-${index}`}
            />
          ))}
        </div>
      ) : null}
    </StaticPageShell>
  );
}

export default function MigratedWordPressStaticPage({
  content,
}: {
  readonly content: MigratedWordPressStaticPageContent;
}) {
  if (content.path === "/museum") {
    return <MuseumDirectoryPage content={content} />;
  }

  if (shouldUseCollectionIndexLayout(content)) {
    return <MuseumCollectionIndexPage content={content} />;
  }

  if (shouldUseMuseumDetailLayout(content)) {
    return <MuseumDetailPage content={content} />;
  }

  return (
    <StaticPageShell content={content} showDescription>
      <div className="tw-mt-10 tw-w-full tw-space-y-6">
        {content.blocks.map((block, index) => (
          <MigratedWordPressArticleBlockView
            block={block}
            key={`${block.type}-${index}`}
          />
        ))}
      </div>
    </StaticPageShell>
  );
}
