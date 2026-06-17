import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { publicEnv } from "@/config/env";
import {
  getCmsNavigationItems,
  getCmsPagePath,
} from "@/lib/profile-cms/runtime/routes";
import {
  isExternalCmsHref,
  resolveCmsUri,
} from "@/lib/profile-cms/runtime/uri";
import {
  formatDate as formatLocalizedDate,
  formatInteger,
} from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CmsAssetV1,
  CmsBlockV1,
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";

type CmsNftMediaProfileV1 = NonNullable<
  CmsPackageV1["payload"]["nft_media_profiles"]
>[number];
type CmsDeepZoomManifestV1 = NonNullable<
  CmsPackageV1["payload"]["deep_zoom_manifests"]
>[number];
type CmsExhibitionRoomV1 = NonNullable<
  CmsPackageV1["payload"]["exhibition_rooms"]
>[number];

type RendererContext = {
  readonly cmsPackage: CmsPackageV1;
  readonly assetMap: Map<string, CmsAssetV1>;
  readonly pageMap: Map<string, CmsPageV1>;
  readonly nftProfileMap: Map<string, CmsNftMediaProfileV1>;
  readonly deepZoomMap: Map<string, CmsDeepZoomManifestV1>;
  readonly roomMap: Map<string, CmsExhibitionRoomV1>;
  readonly locale: SupportedLocale;
};

const SANDBOX_PERMISSION_ALLOWLIST = new Set([
  "allow-forms",
  "allow-pointer-lock",
  "allow-presentation",
  "allow-scripts",
]);

export default function CmsSiteRenderer({
  cmsPackage,
  locale = DEFAULT_LOCALE,
  page,
}: {
  readonly cmsPackage: CmsPackageV1;
  readonly locale?: SupportedLocale | undefined;
  readonly page: CmsPageV1;
}) {
  const context = createRendererContext(cmsPackage, locale);
  const navigationItems = getCmsNavigationItems(cmsPackage);
  const accentStyle = {
    "--profile-cms-accent": cmsPackage.site.theme.accent,
  } as CSSProperties;

  return (
    <div
      className="tailwind-scope tw-min-h-[100dvh] tw-bg-black tw-text-iron-100"
      style={accentStyle}
    >
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950/70">
        <div className="tw-mx-auto tw-flex tw-max-w-6xl tw-flex-col tw-gap-4 tw-px-4 tw-py-5 sm:tw-px-6 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between lg:tw-px-8">
          <div>
            <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
              {cmsPackage.profile.handle}
            </p>
            <h1 className="tw-text-2xl tw-font-semibold tw-text-white">
              {cmsPackage.site.title}
            </h1>
          </div>
          {navigationItems.length ? (
            <nav
              aria-label={t(locale, "profileCms.nav.label", {
                siteTitle: cmsPackage.site.title,
              })}
            >
              <ul className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                {navigationItems.map((item) => (
                  <NavigationItem
                    key={`${item.label}-${item.page_id ?? item.url ?? "group"}`}
                    item={item}
                    context={context}
                  />
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </div>

      <article className="tw-mx-auto tw-flex tw-max-w-5xl tw-flex-col tw-gap-8 tw-px-4 tw-py-8 sm:tw-px-6 md:tw-py-10 lg:tw-px-8">
        <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6">
          <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
            {page.type.replaceAll("_", " ")}
          </p>
          <h2 className="tw-text-3xl tw-font-semibold tw-leading-tight tw-text-white sm:tw-text-4xl">
            {page.metadata.title}
          </h2>
          {page.metadata.description ? (
            <p className="tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
              {page.metadata.description}
            </p>
          ) : null}
        </header>

        <div className="tw-flex tw-flex-col tw-gap-7">
          {page.blocks.map((block) => (
            <CmsBlock key={block.id} block={block} context={context} />
          ))}
        </div>
      </article>
    </div>
  );
}

function NavigationItem({
  item,
  context,
}: {
  readonly item: CmsNavigationItemV1;
  readonly context: RendererContext;
}) {
  const href = getNavigationHref(item, context);
  const label = (
    <span className="tw-inline-flex tw-min-h-10 tw-items-center tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition hover:tw-border-primary-400 hover:tw-text-white">
      {item.label}
    </span>
  );

  return (
    <li>
      {href ? (
        <CmsLink href={href}>{label}</CmsLink>
      ) : (
        <span aria-disabled="true">{label}</span>
      )}
      {item.children?.length ? (
        <ul className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
          {item.children.map((child) => (
            <NavigationItem
              key={`${child.label}-${child.page_id ?? child.url ?? "group"}`}
              item={child}
              context={context}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CmsBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  switch (block.block_type) {
    case "heading":
      return <HeadingBlock block={block} />;
    case "rich_text":
      return <RichTextBlock block={block} />;
    case "image":
      return <ImageBlock block={block} context={context} />;
    case "video":
      return <VideoBlock block={block} context={context} />;
    case "audio":
      return <AudioBlock block={block} context={context} />;
    case "gallery":
    case "lightbox_gallery":
      return <GalleryBlock block={block} context={context} />;
    case "quote":
      return <QuoteBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    case "button_link":
      return <ButtonLinkBlock block={block} context={context} />;
    case "nft_reference":
      return <NftReferenceBlock block={block} context={context} />;
    case "collection_reference":
      return <CollectionReferenceBlock block={block} context={context} />;
    case "transaction_reference":
      return <TransactionReferenceBlock block={block} context={context} />;
    case "generated_wallet_gallery":
      return <GeneratedWalletGalleryBlock block={block} context={context} />;
    case "deep_zoom":
      return <DeepZoomBlock block={block} context={context} />;
    case "html_embed":
      return <HtmlEmbedBlock block={block} context={context} />;
    case "object_viewer":
      return <ObjectViewerBlock block={block} context={context} />;
    case "room_viewer":
      return <RoomViewerBlock block={block} context={context} />;
    default:
      return (
        <UnsupportedBlock
          label={t(context.locale, "profileCms.block.unsupported")}
        />
      );
  }
}

function HeadingBlock({ block }: { readonly block: CmsBlockV1 }) {
  const text = getString(block, "text") ?? "";
  const level = Math.min(Math.max(getNumber(block, "level") ?? 2, 1), 6);
  const className =
    "tw-text-balance tw-font-semibold tw-leading-tight tw-text-white";

  if (level === 1) {
    return (
      <h1 className={`${className} tw-text-4xl sm:tw-text-5xl`}>{text}</h1>
    );
  }
  if (level === 2) {
    return <h2 className={`${className} tw-text-3xl`}>{text}</h2>;
  }
  if (level === 3) {
    return <h3 className={`${className} tw-text-2xl`}>{text}</h3>;
  }
  if (level === 4) {
    return <h4 className={`${className} tw-text-xl`}>{text}</h4>;
  }
  if (level === 5) {
    return <h5 className={`${className} tw-text-lg`}>{text}</h5>;
  }
  return <h6 className={`${className} tw-text-base`}>{text}</h6>;
}

function RichTextBlock({ block }: { readonly block: CmsBlockV1 }) {
  const content = getString(block, "content") ?? "";
  const paragraphs = getParagraphItems(content);

  return (
    <div className="tw-space-y-4 tw-text-base tw-leading-8 tw-text-iron-200">
      {paragraphs.length ? (
        paragraphs.map((paragraph) => (
          <p key={paragraph.key}>{paragraph.text}</p>
        ))
      ) : (
        <p>{content}</p>
      )}
    </div>
  );
}

function getParagraphItems(
  content: string
): ReadonlyArray<{ readonly key: string; readonly text: string }> {
  const seen = new Map<string, number>();
  const paragraphs: Array<{ readonly key: string; readonly text: string }> = [];

  for (const paragraph of content.split(/\n{2,}/)) {
    const text = paragraph.trim();
    if (!text) {
      continue;
    }

    const hash = hashTextForKey(text);
    const occurrence = (seen.get(hash) ?? 0) + 1;
    seen.set(hash, occurrence);
    paragraphs.push({
      key: `paragraph-${hash}-${occurrence}`,
      text,
    });
  }

  return paragraphs;
}

function hashTextForKey(value: string): string {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash.toString(36);
}

function ImageBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const asset = getAsset(context, getString(block, "asset_id"));
  return (
    <AssetImage
      asset={asset}
      caption={getString(block, "caption")}
      locale={context.locale}
    />
  );
}

function VideoBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const asset = getAsset(context, getString(block, "asset_id"));
  const poster = getAsset(context, getString(block, "poster_asset_id"));
  const assetUrl = resolveAssetUrl(asset);
  const posterUrl = resolveAssetUrl(poster);
  const captionTrackSrc = getMediaCaptionTrackSrc(asset, context.locale);

  if (!assetUrl) {
    return (
      <UnsupportedBlock
        label={t(context.locale, "profileCms.block.videoUnavailable")}
      />
    );
  }

  return (
    <figure className="tw-space-y-3">
      <video
        className="tw-aspect-video tw-w-full tw-bg-iron-950"
        controls
        preload="metadata"
        poster={posterUrl ?? undefined}
      >
        <source src={assetUrl} type={asset?.mime_type} />
        <track
          default
          kind="captions"
          label={t(context.locale, "profileCms.media.captionTrackLabel")}
          src={captionTrackSrc}
          srcLang="en"
        />
      </video>
      <MediaCaption asset={asset} />
    </figure>
  );
}

function AudioBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const asset = getAsset(context, getString(block, "asset_id"));
  const assetUrl = resolveAssetUrl(asset);
  const captionTrackSrc = getMediaCaptionTrackSrc(asset, context.locale);

  if (!assetUrl) {
    return (
      <UnsupportedBlock
        label={t(context.locale, "profileCms.block.audioUnavailable")}
      />
    );
  }

  return (
    <figure className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4">
      <audio className="tw-w-full" controls preload="metadata">
        <source src={assetUrl} type={asset?.mime_type} />
        <track
          default
          kind="captions"
          label={t(context.locale, "profileCms.media.captionTrackLabel")}
          src={captionTrackSrc}
          srcLang="en"
        />
      </audio>
      <MediaCaption asset={asset} />
    </figure>
  );
}

function GalleryBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const assetIds = [
    ...getStringArray(block, "asset_ids"),
    ...getStringArray(block, "featured_asset_ids"),
  ];
  const assets = assetIds
    .map((assetId) => getAsset(context, assetId))
    .filter((asset): asset is CmsAssetV1 => !!asset);

  if (!assets.length) {
    return (
      <UnsupportedBlock
        label={t(context.locale, "profileCms.block.galleryUnavailable")}
      />
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
      {assets.map((asset) => (
        <AssetImage key={asset.id} asset={asset} locale={context.locale} />
      ))}
    </div>
  );
}

function QuoteBlock({ block }: { readonly block: CmsBlockV1 }) {
  const quote = getString(block, "quote") ?? getString(block, "content") ?? "";
  const citation =
    getString(block, "citation") ?? getString(block, "attribution");

  return (
    <blockquote className="tw-border-x-0 tw-border-b-0 tw-border-l-4 tw-border-t-0 tw-border-solid tw-border-primary-400 tw-bg-iron-950 tw-px-5 tw-py-4">
      <p className="tw-text-xl tw-leading-8 tw-text-white">{quote}</p>
      {citation ? (
        <footer className="tw-mt-3 tw-text-sm tw-text-iron-400">
          {citation}
        </footer>
      ) : null}
    </blockquote>
  );
}

function CalloutBlock({ block }: { readonly block: CmsBlockV1 }) {
  const title = getString(block, "title");
  const content = getString(block, "content") ?? "";
  const tone = getString(block, "tone");

  return (
    <aside className="tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-5">
      {tone ? (
        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
          {tone}
        </p>
      ) : null}
      {title ? (
        <h3 className="tw-mb-2 tw-text-lg tw-font-semibold tw-text-white">
          {title}
        </h3>
      ) : null}
      <p className="tw-text-base tw-leading-7 tw-text-iron-200">{content}</p>
    </aside>
  );
}

function ButtonLinkBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const label =
    getString(block, "label") ??
    getString(block, "text") ??
    t(context.locale, "profileCms.block.openLink");
  const pageId = getString(block, "page_id");
  const directHref =
    getString(block, "url") ?? getString(block, "href") ?? undefined;
  const href = pageId
    ? getCmsPagePath(context.cmsPackage, pageId)
    : resolveCmsUri(directHref, { allowRelative: true });

  if (!href) {
    return (
      <UnsupportedBlock
        label={t(context.locale, "profileCms.block.linkUnavailable")}
      />
    );
  }

  return (
    <p>
      <CmsLink
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition hover:tw-bg-primary-500/20"
        href={href}
      >
        {label}
      </CmsLink>
    </p>
  );
}

function NftReferenceBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const nftProfile = context.nftProfileMap.get(
    getString(block, "nft_media_profile_id") ?? ""
  );
  if (!nftProfile) {
    return (
      <UnsupportedBlock
        label={t(context.locale, "profileCms.block.nftReferenceUnavailable")}
      />
    );
  }

  const displayAsset =
    getAsset(context, nftProfile.poster_asset_id) ??
    getAsset(context, nftProfile.display_variants[0]?.asset_id);

  return (
    <ReferencePanel
      title={t(context.locale, "profileCms.reference.tokenTitle", {
        tokenId: nftProfile.token_id,
      })}
      subtitle={t(context.locale, "profileCms.reference.chain", {
        chainId: nftProfile.chain_id,
      })}
      detail={nftProfile.contract}
      media={<AssetImage asset={displayAsset} locale={context.locale} />}
    />
  );
}

function CollectionReferenceBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const title =
    getString(block, "title") ??
    getString(block, "name") ??
    t(context.locale, "profileCms.block.collectionFallback");
  const chainId = getNumber(block, "chain_id");
  const contract = getString(block, "contract");
  return (
    <ReferencePanel
      title={title}
      subtitle={
        chainId
          ? t(context.locale, "profileCms.reference.chain", { chainId })
          : undefined
      }
      detail={contract}
    />
  );
}

function TransactionReferenceBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const title =
    getString(block, "title") ??
    t(context.locale, "profileCms.block.transactionFallback");
  const chainId = getNumber(block, "chain_id");
  const txHash = getString(block, "tx_hash") ?? getString(block, "hash");
  return (
    <ReferencePanel
      title={title}
      subtitle={
        chainId
          ? t(context.locale, "profileCms.reference.chain", { chainId })
          : undefined
      }
      detail={txHash}
    />
  );
}

function GeneratedWalletGalleryBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const wallets = getStringArray(block, "wallets");
  const featuredPageIds = getStringArray(block, "featured_page_ids");
  const snapshot = getRecord(block, "snapshot");
  const capturedAt = getString(snapshot, "captured_at");
  const blockNumber = getNumber(snapshot, "block_number");

  return (
    <section className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
      <h3 className="tw-text-xl tw-font-semibold tw-text-white">
        {t(context.locale, "profileCms.walletGallery.title")}
      </h3>
      <p className="tw-mt-2 tw-text-sm tw-text-iron-300">
        {t(
          context.locale,
          wallets.length === 1
            ? "profileCms.walletGallery.summary.one"
            : "profileCms.walletGallery.summary.many",
          { count: formatInteger(context.locale, wallets.length) }
        )}
      </p>
      {blockNumber || capturedAt ? (
        <dl className="tw-mt-3 tw-grid tw-gap-2 tw-text-sm tw-text-iron-300 sm:tw-grid-cols-2">
          {blockNumber ? (
            <div>
              <dt className="tw-font-semibold tw-text-iron-100">
                {t(context.locale, "profileCms.walletGallery.blockNumber")}
              </dt>
              <dd>{formatInteger(context.locale, blockNumber)}</dd>
            </div>
          ) : null}
          {capturedAt ? (
            <div>
              <dt className="tw-font-semibold tw-text-iron-100">
                {t(context.locale, "profileCms.walletGallery.capturedAt")}
              </dt>
              <dd>{formatCmsDate(context.locale, capturedAt)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {featuredPageIds.length ? (
        <ul className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2">
          {featuredPageIds.map((pageId) => {
            const page = context.pageMap.get(pageId);
            const href = getCmsPagePath(context.cmsPackage, pageId);
            return href ? (
              <li key={pageId}>
                <CmsLink
                  className="tw-inline-flex tw-min-h-10 tw-items-center tw-border tw-border-solid tw-border-iron-700 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400 hover:tw-text-white"
                  href={href}
                >
                  {page?.metadata.navigation_label ??
                    page?.metadata.title ??
                    pageId}
                </CmsLink>
              </li>
            ) : null;
          })}
        </ul>
      ) : null}
    </section>
  );
}

function DeepZoomBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const manifest = context.deepZoomMap.get(
    getString(block, "deep_zoom_id") ??
      getString(block, "deep_zoom_manifest_id") ??
      ""
  );
  const asset = getAsset(context, manifest?.source_asset_id);
  return (
    <InteractiveFallback
      locale={context.locale}
      title={t(context.locale, "profileCms.interactive.deepZoom.title")}
      description={t(
        context.locale,
        "profileCms.interactive.deepZoom.description"
      )}
      asset={asset}
    />
  );
}

function HtmlEmbedBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const policy = block.interactive_policy;
  const asset = getAsset(context, getString(block, "asset_id"));
  const assetUrl = resolveTrustedEmbedAssetUrl(asset);
  const fallbackAsset = getAsset(context, policy?.fallback_asset_id);

  if (policy?.hydration === "sandboxed_embed" && assetUrl) {
    return (
      <iframe
        className="tw-aspect-video tw-w-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
        src={assetUrl}
        title={
          asset?.alt_text ??
          t(context.locale, "profileCms.interactive.embed.iframeTitle")
        }
        sandbox={sanitizeSandboxPermissions(policy.sandbox_permissions)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <InteractiveFallback
      locale={context.locale}
      title={t(context.locale, "profileCms.interactive.embed.title")}
      description={t(
        context.locale,
        "profileCms.interactive.embed.description"
      )}
      asset={fallbackAsset ?? asset}
    />
  );
}

function ObjectViewerBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const asset = getAsset(context, getString(block, "asset_id"));
  const fallbackAsset = getAsset(
    context,
    block.interactive_policy?.fallback_asset_id
  );
  return (
    <InteractiveFallback
      locale={context.locale}
      title={t(context.locale, "profileCms.interactive.object.title")}
      description={t(
        context.locale,
        "profileCms.interactive.object.description"
      )}
      asset={fallbackAsset ?? asset}
      href={resolveAssetUrl(asset)}
    />
  );
}

function RoomViewerBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const room = context.roomMap.get(getString(block, "room_id") ?? "");
  const poster = getAsset(context, room?.poster_asset_id);
  const fallbackHref = room?.fallback_page_id
    ? getCmsPagePath(context.cmsPackage, room.fallback_page_id)
    : null;
  return (
    <InteractiveFallback
      locale={context.locale}
      title={
        room?.title ?? t(context.locale, "profileCms.interactive.room.title")
      }
      description={t(context.locale, "profileCms.interactive.room.description")}
      asset={poster}
      href={fallbackHref}
    />
  );
}

function AssetImage({
  asset,
  caption,
  locale = DEFAULT_LOCALE,
}: {
  readonly asset: CmsAssetV1 | null | undefined;
  readonly caption?: string | undefined;
  readonly locale?: SupportedLocale | undefined;
}) {
  const assetUrl = resolveAssetUrl(asset);
  if (!assetUrl || !asset) {
    return (
      <UnsupportedBlock
        label={t(locale, "profileCms.block.imageUnavailable")}
      />
    );
  }

  const altText = asset.decorative ? "" : (asset.alt_text ?? "");
  return (
    <figure className="tw-overflow-hidden tw-bg-iron-950">
      <img
        className="tw-h-full tw-w-full tw-object-contain"
        src={assetUrl}
        alt={altText}
        width={asset.width}
        height={asset.height}
        loading="lazy"
      />
      {caption || asset.alt_text ? (
        <figcaption className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-400">
          {caption ?? asset.alt_text}
        </figcaption>
      ) : null}
    </figure>
  );
}

function MediaCaption({ asset }: { readonly asset: CmsAssetV1 | undefined }) {
  if (!asset?.alt_text) {
    return null;
  }

  return (
    <figcaption className="tw-text-sm tw-leading-6 tw-text-iron-400">
      {asset.alt_text}
    </figcaption>
  );
}

function getMediaCaptionTrackSrc(
  asset: CmsAssetV1 | undefined,
  locale: SupportedLocale
): string {
  const caption = asset?.alt_text?.trim();
  if (!caption) {
    return getWebVttDataUri(t(locale, "profileCms.media.noCaptions"));
  }

  return getWebVttDataUri(caption);
}

function getWebVttDataUri(caption: string): string {
  const vtt = `WEBVTT\n\n00:00:00.000 --> 99:59:59.000\n${escapeWebVttText(caption)}\n`;
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
}

function escapeWebVttText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function ReferencePanel({
  title,
  subtitle,
  detail,
  media,
}: {
  readonly title: string;
  readonly subtitle?: string | undefined;
  readonly detail?: string | undefined;
  readonly media?: ReactNode | undefined;
}) {
  return (
    <section className="tw-grid tw-gap-4 tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 md:tw-grid-cols-[minmax(0,1fr)_14rem]">
      <div>
        {subtitle ? (
          <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-primary-300">
            {subtitle}
          </p>
        ) : null}
        <h3 className="tw-text-xl tw-font-semibold tw-text-white">{title}</h3>
        {detail ? (
          <p className="tw-mt-3 tw-break-all tw-text-sm tw-leading-6 tw-text-iron-300">
            {detail}
          </p>
        ) : null}
      </div>
      {media ? <div>{media}</div> : null}
    </section>
  );
}

function InteractiveFallback({
  locale = DEFAULT_LOCALE,
  title,
  description,
  asset,
  href,
}: {
  readonly locale?: SupportedLocale | undefined;
  readonly title: string;
  readonly description: string;
  readonly asset?: CmsAssetV1 | null | undefined;
  readonly href?: string | null | undefined;
}) {
  return (
    <section className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
      <div className="tw-grid tw-gap-4 md:tw-grid-cols-[16rem_minmax(0,1fr)]">
        <AssetImage asset={asset} locale={locale} />
        <div>
          <h3 className="tw-text-xl tw-font-semibold tw-text-white">{title}</h3>
          <p className="tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-300">
            {description}
          </p>
          {href ? (
            <CmsLink
              className="tw-mt-4 tw-inline-flex tw-min-h-10 tw-items-center tw-border tw-border-solid tw-border-iron-700 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400 hover:tw-text-white"
              href={href}
            >
              {t(locale, "profileCms.interactive.openSourceMedia")}
            </CmsLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function UnsupportedBlock({ label }: { readonly label: string }) {
  return (
    <div className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-400">
      {label}
    </div>
  );
}

function CmsLink({
  href,
  className,
  children,
}: {
  readonly href: string;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}) {
  if (isExternalCmsHref(href)) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

function createRendererContext(
  cmsPackage: CmsPackageV1,
  locale: SupportedLocale
): RendererContext {
  return {
    cmsPackage,
    locale,
    assetMap: new Map(
      cmsPackage.payload.assets.map((asset) => [asset.id, asset])
    ),
    pageMap: new Map(cmsPackage.payload.pages.map((page) => [page.id, page])),
    nftProfileMap: new Map(
      (cmsPackage.payload.nft_media_profiles ?? []).map((profile) => [
        profile.id,
        profile,
      ])
    ),
    deepZoomMap: new Map(
      (cmsPackage.payload.deep_zoom_manifests ?? []).map((manifest) => [
        manifest.id,
        manifest,
      ])
    ),
    roomMap: new Map(
      (cmsPackage.payload.exhibition_rooms ?? []).map((room) => [room.id, room])
    ),
  };
}

function getNavigationHref(
  item: CmsNavigationItemV1,
  context: RendererContext
): string | null {
  if (item.page_id) {
    return getCmsPagePath(context.cmsPackage, item.page_id);
  }

  return resolveCmsUri(item.url, { allowRelative: true });
}

function getAsset(
  context: RendererContext,
  assetId: string | null | undefined
): CmsAssetV1 | undefined {
  return assetId ? context.assetMap.get(assetId) : undefined;
}

function resolveAssetUrl(asset: CmsAssetV1 | null | undefined): string | null {
  return resolveCmsUri(asset?.uri);
}

function resolveTrustedEmbedAssetUrl(
  asset: CmsAssetV1 | null | undefined
): string | null {
  const url = resolveAssetUrl(asset);
  if (!url) {
    return null;
  }

  return hasTrustedMediaResolverOrigin(url) ? url : null;
}

function hasTrustedMediaResolverOrigin(value: string): boolean {
  try {
    return (
      new URL(value).origin ===
      new URL(publicEnv.MEDIA_RESOLVER_ENDPOINT).origin
    );
  } catch {
    return false;
  }
}

function sanitizeSandboxPermissions(
  permissions: readonly string[] | undefined
): string {
  return (
    permissions
      ?.filter((permission) => SANDBOX_PERMISSION_ALLOWLIST.has(permission))
      .join(" ") ?? ""
  );
}

function getString(
  record: Record<string, unknown> | null | undefined,
  key: string
): string | undefined {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getNumber(
  record: Record<string, unknown> | null | undefined,
  key: string
): number | undefined {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function getRecord(
  record: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const value = record[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function getStringArray(
  record: Record<string, unknown>,
  key: string
): string[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function formatCmsDate(locale: SupportedLocale, value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatLocalizedDate(locale, date, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}
