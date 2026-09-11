import type { CSSProperties, ReactNode } from "react";
import { getImageProps } from "next/image";

import {
  CmsInspectableArtwork,
  CmsArtGalleryGrid,
  type CmsArtInspectionItem,
} from "@/components/profile-cms/CmsArtLightbox";
import { NftDetailPage } from "./site-renderer/NftDetailPage";
import { CmsStudioWalletContent } from "./CmsStudioWalletContent";
import { CmsBlock } from "@/components/profile-cms/site-renderer/blocks";
import {
  createRendererContext,
  getString,
  getStringArray,
} from "@/components/profile-cms/site-renderer/data";
import {
  createArtInspectionItem,
  getArtInspectorLabels,
  getGalleryMode,
} from "@/components/profile-cms/site-renderer/media";
import type { RendererContext } from "@/components/profile-cms/site-renderer/types";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CmsBlockV1,
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import {
  getCmsNavigationItems,
  getCmsPublicPagePath,
  getCmsPublicPath,
  resolveCmsRoute,
} from "@/lib/profile-cms/runtime/routes";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";
import {
  getCmsStudioBlockPresentation,
  type CmsStudioPresentation,
} from "@/lib/profile-cms/studio/presentation";
import {
  getCmsStudioDemoAssetPath,
  getCmsStudioDemoAssetTitle,
} from "@/lib/profile-cms/studio/demo-assets";
import { CMS_STUDIO_MEME_WORKS } from "@/lib/profile-cms/studio/meme-assets";
import { getCmsStudioMemeDisplayAsset } from "@/lib/profile-cms/studio/meme-display-assets";

export interface CmsStudioEditingContext {
  readonly selectedBlockId?: string | null | undefined;
  readonly onSelectBlock?: ((blockId: string) => void) | undefined;
  readonly onNavigatePage: (pageId: string) => void;
}

const PALETTE_CLASSES = {
  ink: "tw-bg-iron-950 tw-text-iron-100",
  paper: "tw-bg-[#f5f3ed] tw-text-[#242420]",
  stone: "tw-bg-[#e7e5de] tw-text-[#292c29]",
  night: "tw-bg-[#101925] tw-text-[#eeeee8]",
};
const TYPE_CLASSES = {
  sans: "tw-font-sans tw-tracking-[-0.04em]",
  serif: "tw-font-serif tw-font-normal tw-tracking-[-0.04em]",
  mono: "tw-font-mono tw-tracking-[-0.045em]",
};
const SPAN_CLASSES = {
  full: "@[48rem]/cms-studio:tw-col-span-6",
  half: "@[48rem]/cms-studio:tw-col-span-3",
  third: "@[48rem]/cms-studio:tw-col-span-2",
  two_thirds: "@[48rem]/cms-studio:tw-col-span-4",
};
const DENSITY_CLASSES = {
  airy: "tw-gap-x-10 tw-gap-y-8 @[48rem]/cms-studio:tw-gap-y-12",
  balanced: "tw-gap-x-8 tw-gap-y-7 @[48rem]/cms-studio:tw-gap-y-10",
  compact: "tw-gap-x-6 tw-gap-y-6 @[48rem]/cms-studio:tw-gap-y-8",
};
const LINK_CLASS =
  "tw-text-inherit tw-no-underline tw-transition-opacity hover:tw-opacity-70 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-current";

export default function CmsStudioSiteRenderer({
  cmsPackage,
  page,
  locale,
  presentation,
  editing,
}: {
  readonly cmsPackage: CmsPackageV1;
  readonly page: CmsPageV1;
  readonly locale: SupportedLocale;
  readonly presentation: CmsStudioPresentation;
  readonly editing?: CmsStudioEditingContext | undefined;
}) {
  const context: RendererContext = {
    ...createRendererContext(cmsPackage, locale, editing?.onNavigatePage),
    appearance: "studio",
  };
  const homePage = getStudioHomePage(cmsPackage);
  const homeHref = homePage
    ? getCmsPublicPagePath(cmsPackage, homePage.id)
    : null;
  const profileHref = `/${encodeURIComponent(cmsPackage.profile.handle)}`;
  const hasHero = page.blocks.some(
    (block) =>
      block.block_type === "heading" &&
      getCmsStudioBlockPresentation(block).role === "hero"
  );
  const isFund = presentation.studio_layout === "fund";
  const isNftDetail = ["nft_detail", "card_detail"].includes(page.type);
  const accent = /^#[0-9a-f]{6}$/i.test(cmsPackage.site.theme.accent)
    ? cmsPackage.site.theme.accent
    : "#4768b2";

  return (
    <div
      className={`tailwind-scope tw-min-h-full tw-overflow-x-clip tw-@container/cms-studio ${PALETTE_CLASSES[presentation.studio_palette]}`}
      data-cms-studio-layout={presentation.studio_layout}
      style={
        {
          "--cms-accent": accent,
          "--cms-line": ["paper", "stone"].includes(presentation.studio_palette)
            ? "rgba(36,36,32,.2)"
            : "rgba(238,238,232,.2)",
        } as CSSProperties
      }
    >
      <header className="tw-mx-auto tw-max-w-[1440px] tw-px-6 @[40rem]/cms-studio:tw-px-10 @[64rem]/cms-studio:tw-px-16">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-8 tw-gap-y-5 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-[color:var(--cms-line)] tw-py-6 @[48rem]/cms-studio:tw-py-8">
          <a
            href={homeHref ?? profileHref}
            className={`${LINK_CLASS} tw-max-w-full tw-break-words tw-text-xl tw-font-semibold ${isFund ? "tw-uppercase tw-tracking-[0.16em]" : "tw-tracking-tight"}`}
            onClick={
              editing && homePage
                ? (event) => {
                    event.preventDefault();
                    editing.onNavigatePage(homePage.id);
                  }
                : undefined
            }
          >
            <span
              aria-hidden="true"
              className="tw-mr-3 tw-inline-block tw-h-2 tw-w-2 tw-rounded-full tw-bg-[var(--cms-accent)] tw-align-middle"
            />
            {cmsPackage.site.title}
          </a>
          <nav
            aria-label={t(locale, "profileCms.nav.label", {
              siteTitle: cmsPackage.site.title,
            })}
          >
            <StudioNavigation
              items={getCmsNavigationItems(cmsPackage)}
              context={context}
              pageId={page.id}
              editing={editing}
            />
          </nav>
        </div>
        <div className="tw-flex tw-justify-end tw-pt-3">
          <a
            href={profileHref}
            className={`${LINK_CLASS} tw-inline-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium`}
          >
            <span
              aria-hidden="true"
              className="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-[color:var(--cms-line)] tw-text-[10px]"
            >
              {cmsPackage.profile.handle.slice(0, 1).toUpperCase()}
            </span>
            {t(locale, "profileCms.studio.profileLink", {
              handle: cmsPackage.profile.handle,
            })}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <article
        className={`tw-mx-auto tw-max-w-[1440px] tw-px-6 tw-pb-20 tw-pt-10 @[40rem]/cms-studio:tw-px-10 @[48rem]/cms-studio:tw-pt-16 @[64rem]/cms-studio:tw-px-16 ${isFund ? "@[64rem]/cms-studio:tw-max-w-6xl" : ""}`}
      >
        {!hasHero ? (
          <header className="tw-mb-12 tw-max-w-4xl">
            <h1
              className={`tw-m-0 tw-text-balance tw-text-4xl tw-leading-[1.08] tw-text-inherit @[48rem]/cms-studio:tw-text-6xl ${TYPE_CLASSES[presentation.studio_type]}`}
            >
              {page.metadata.title}
            </h1>
            {page.metadata.description ? (
              <p className="tw-mb-0 tw-mt-6 tw-max-w-2xl tw-text-lg tw-leading-8">
                {page.metadata.description}
              </p>
            ) : null}
          </header>
        ) : null}
        {isNftDetail ? (
          <NftDetailPage context={context} page={page} />
        ) : (
          <div
            className={`tw-grid tw-grid-cols-1 @[48rem]/cms-studio:tw-grid-cols-6 ${DENSITY_CLASSES[presentation.studio_density]}`}
          >
            {page.blocks.map((block) => {
              const design = getCmsStudioBlockPresentation(block);
              return (
                <StudioSection
                  key={block.id}
                  block={block}
                  context={context}
                  editing={editing}
                  className={`${SPAN_CLASSES[design.span]} ${design.role === "hero" ? "-tw-mb-2" : ""}`}
                >
                  <StudioBlock
                    block={block}
                    context={context}
                    presentation={presentation}
                    editing={editing}
                  />
                </StudioSection>
              );
            })}
          </div>
        )}
      </article>

      <footer className="tw-mx-auto tw-flex tw-max-w-[1440px] tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-[color:var(--cms-line)] tw-px-6 tw-py-7 tw-text-xs @[40rem]/cms-studio:tw-px-10 @[64rem]/cms-studio:tw-px-16">
        <span>{cmsPackage.site.title}</span>
        <a href={profileHref} className={LINK_CLASS}>
          {t(locale, "profileCms.studio.profileLink", {
            handle: cmsPackage.profile.handle,
          })}{" "}
          ↗
        </a>
      </footer>
    </div>
  );
}

function getStudioHomePage(cmsPackage: CmsPackageV1) {
  const home = resolveCmsRoute(cmsPackage, cmsPackage.site.base_path);
  return home.kind === "page" ? home.page : cmsPackage.payload.pages[0];
}

function StudioNavigation({
  items,
  context,
  pageId,
  editing,
}: {
  readonly items: readonly CmsNavigationItemV1[];
  readonly context: RendererContext;
  readonly pageId: string;
  readonly editing?: CmsStudioEditingContext | undefined;
}) {
  return (
    <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-3 tw-p-0 tw-text-sm">
      {items.map((item, index) => {
        const href = item.page_id
          ? getCmsPublicPagePath(context.cmsPackage, item.page_id)
          : resolveCmsUri(item.url, { allowRelative: true });
        return (
          <li key={`${item.page_id ?? item.url ?? item.label}-${index}`}>
            {href ? (
              <a
                href={href}
                className={`${LINK_CLASS} tw-inline-block tw-py-1 ${item.page_id === pageId ? "tw-underline tw-decoration-1 tw-underline-offset-8" : ""}`}
                aria-current={item.page_id === pageId ? "page" : undefined}
                onClick={
                  editing && item.page_id
                    ? (event) => {
                        event.preventDefault();
                        editing.onNavigatePage(item.page_id!);
                      }
                    : undefined
                }
              >
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
            {(item.children?.length ?? 0) > 0 ? (
              <StudioNavigation
                items={item.children ?? []}
                context={context}
                pageId={pageId}
                editing={editing}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function StudioSection({
  block,
  context,
  editing,
  children,
  className,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
  readonly editing?: CmsStudioEditingContext | undefined;
  readonly children: ReactNode;
  readonly className: string;
}) {
  const selected = editing?.selectedBlockId === block.id;
  return (
    <section
      className={`tw-relative tw-min-w-0 ${className}`}
      data-cms-block-id={block.id}
    >
      <div inert={editing?.onSelectBlock ? true : undefined}>{children}</div>
      {editing?.onSelectBlock ? (
        <button
          type="button"
          onClick={() => editing.onSelectBlock?.(block.id)}
          aria-label={t(context.locale, "profileCms.studio.editSection", {
            name:
              getString(block, "text") ??
              getString(block, "title") ??
              getString(block, "caption") ??
              block.block_type.replaceAll("_", " "),
          })}
          aria-pressed={selected}
          className={`tw-absolute -tw-inset-2 tw-cursor-pointer tw-rounded-sm tw-border-2 tw-border-solid tw-bg-transparent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-500 ${selected ? "tw-border-primary-500" : "tw-border-transparent hover:tw-border-primary-400"}`}
        />
      ) : null}
    </section>
  );
}

function StudioBlock({
  block,
  context,
  presentation,
  editing,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
  readonly presentation: CmsStudioPresentation;
  readonly editing?: CmsStudioEditingContext | undefined;
}) {
  const design = getCmsStudioBlockPresentation(block);
  switch (block.block_type) {
    case "heading": {
      const text = getString(block, "text") ?? "";
      if (design.role === "kicker")
        return (
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-[0.18em]">
            {text}
          </p>
        );
      const type = TYPE_CLASSES[presentation.studio_type];
      if (design.role === "hero")
        return (
          <h1
            className={`tw-m-0 tw-max-w-5xl tw-text-balance tw-text-[clamp(2.5rem,5.8cqw,6.25rem)] tw-leading-[1.03] tw-text-inherit ${type}`}
          >
            {text}
          </h1>
        );
      return (
        <h2
          className={`tw-m-0 tw-text-balance tw-text-3xl tw-leading-[1.12] tw-text-inherit @[48rem]/cms-studio:tw-text-4xl ${type}`}
        >
          {text}
        </h2>
      );
    }
    case "rich_text":
      if (design.role === "kicker")
        return (
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-[0.18em]">
            {getString(block, "content")}
          </p>
        );
      return (
        <div className="tw-max-w-[68ch] tw-space-y-5 tw-text-base tw-leading-8 @[48rem]/cms-studio:tw-text-lg">
          {(getString(block, "content") ?? "")
            .split(/\n{2,}/)
            .map((text, index) => (
              <p className="tw-m-0" key={`${block.id}-paragraph-${index}`}>
                {text}
              </p>
            ))}
        </div>
      );
    case "image":
      return <StudioImage block={block} context={context} />;
    case "gallery":
    case "lightbox_gallery":
      return <StudioGallery block={block} context={context} />;
    case "quote":
      return (
        <blockquote className="tw-m-0 tw-border-y-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-border-[var(--cms-accent)] tw-pl-6">
          <p
            className={`tw-m-0 tw-text-2xl tw-leading-relaxed ${TYPE_CLASSES[presentation.studio_type]}`}
          >
            {getString(block, "quote")}
          </p>
          {getString(block, "citation") ? (
            <footer className="tw-mt-5 tw-text-sm">
              {getString(block, "citation")}
            </footer>
          ) : null}
        </blockquote>
      );
    case "callout":
      return (
        <div className="tw-h-full tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-[color:var(--cms-line)] tw-pt-5">
          <h3 className="tw-m-0 tw-text-xl tw-font-medium tw-text-inherit">
            {getString(block, "title")}
          </h3>
          <p className="tw-mb-0 tw-mt-4 tw-whitespace-pre-line tw-text-sm tw-leading-7">
            {getString(block, "content")}
          </p>
        </div>
      );
    case "button_link":
      return (
        <StudioPageLink block={block} context={context} editing={editing} />
      );
    case "generated_wallet_gallery":
      return <CmsStudioWalletContent block={block} context={context} />;
    case "collection_reference":
      return getStringArray(block, "page_ids").length > 0 ? (
        <CmsStudioWalletContent block={block} context={context} />
      ) : (
        <CmsBlock block={block} context={context} />
      );
    case "video":
    case "audio":
    case "nft_reference":
    case "transaction_reference":
    case "deep_zoom":
    case "html_embed":
    case "object_viewer":
    case "room_viewer":
      return (
        <div className="tw-rounded-lg tw-bg-iron-950 tw-p-4 tw-text-iron-100">
          <CmsBlock block={block} context={context} />
        </div>
      );
  }
}

function StudioPageLink({
  block,
  context,
  editing,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
  readonly editing?: CmsStudioEditingContext | undefined;
}) {
  const pageId = getString(block, "page_id");
  const pageHref = pageId
    ? getCmsPublicPagePath(context.cmsPackage, pageId)
    : null;
  const rawHref =
    pageHref ??
    resolveCmsUri(getString(block, "href"), { allowRelative: true });
  const href = rawHref ? getCmsPublicPath(context.cmsPackage, rawHref) : null;
  return href ? (
    <a
      href={href}
      onClick={
        editing && pageId
          ? (event) => {
              event.preventDefault();
              editing.onNavigatePage(pageId);
            }
          : undefined
      }
      className={`${LINK_CLASS} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-8 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-current tw-py-3 tw-text-sm tw-font-medium`}
    >
      {getString(block, "label")}
      <span aria-hidden="true">↗</span>
    </a>
  ) : (
    <span>{getString(block, "label")}</span>
  );
}

function StudioImage({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const asset = context.assetMap.get(getString(block, "asset_id") ?? "");
  const item = asset
    ? createArtInspectionItem({
        asset,
        context,
        title: getString(block, "title"),
      })
    : null;
  if (!item)
    return (
      <div className="tw-border-current/30 tw-flex tw-min-h-48 tw-items-center tw-justify-center tw-border tw-border-dashed tw-p-6 tw-text-sm">
        {t(context.locale, "profileCms.block.imageUnavailable")}
      </div>
    );
  const imageSrc = studioPreviewSrc(item, asset);
  return (
    <div className="tw-space-y-3">
      <CmsInspectableArtwork
        item={{
          ...item,
          caption: undefined,
          roleLabel: undefined,
        }}
        previewSrc={imageSrc}
        className="!tw-m-0 !tw-bg-transparent"
        frameClassName="!tw-aspect-auto !tw-bg-transparent"
        imageClassName="!tw-h-auto tw-max-h-[80vh] tw-object-contain"
        labels={getArtInspectorLabels(context.locale)}
      />
      {getString(block, "caption") ? (
        <p className="tw-m-0 tw-text-xs tw-leading-6">
          {getString(block, "caption")}
        </p>
      ) : null}
    </div>
  );
}

function studioPreviewSrc(
  item: CmsArtInspectionItem,
  asset: CmsPackageV1["payload"]["assets"][number] | undefined
): string {
  const path = asset
    ? (getCmsStudioDemoAssetPath(asset) ??
      getCmsStudioMemeDisplayAsset(asset)?.localPath)
    : null;
  return path
    ? getImageProps({
        src: path,
        alt: item.alt,
        width: 768,
        height: Math.round((768 * (item.height ?? 1)) / (item.width ?? 1)),
      }).props.src
    : item.src;
}

function StudioGallery({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const previewSources: Record<string, string> = {};
  const items = getStringArray(block, "asset_ids").flatMap((id) => {
    const asset = context.assetMap.get(id);
    if (!asset) return [];
    const item = createArtInspectionItem({
      asset,
      context,
      title:
        getCmsStudioDemoAssetTitle(asset) ??
        CMS_STUDIO_MEME_WORKS.find(
          (work) =>
            work.asset.uri === asset.uri &&
            work.asset.content_hash === asset.content_hash
        )?.title ??
        asset.alt_text ??
        asset.id,
    });
    if (!item) return [];
    previewSources[item.id] = studioPreviewSrc(item, asset);
    return [
      {
        ...item,
        caption: item.caption === item.title ? undefined : item.caption,
      },
    ];
  });
  if (!items.length)
    return (
      <p className="tw-text-sm">
        {t(context.locale, "profileCms.block.galleryUnavailable")}
      </p>
    );
  return (
    <CmsArtGalleryGrid
      items={items}
      previewSources={previewSources}
      heading={getString(block, "title")}
      description={getString(block, "description")}
      appearance="studio"
      mode={getGalleryMode(block, "clean")}
      labels={getArtInspectorLabels(context.locale)}
    />
  );
}
