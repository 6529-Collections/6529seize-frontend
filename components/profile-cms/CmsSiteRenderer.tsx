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
import {
  getCmsArtGalleryFrameClassName,
  getCmsArtGalleryGridClassName,
  getCmsArtGalleryImageClassName,
  type CmsArtGridMode,
} from "@/components/profile-cms/cmsArtGalleryClasses";
import {
  CmsArtGalleryGrid,
  CmsInspectableArtwork,
  type CmsArtInspectionItem,
  type CmsArtInspectionMetadata,
  type CmsArtInspectorLabels,
} from "@/components/profile-cms/CmsArtLightbox";

type CmsNftMediaProfileV1 = NonNullable<
  CmsPackageV1["payload"]["nft_media_profiles"]
>[number];
type CmsDeepZoomManifestV1 = NonNullable<
  CmsPackageV1["payload"]["deep_zoom_manifests"]
>[number];
type CmsExhibitionRoomV1 = NonNullable<
  CmsPackageV1["payload"]["exhibition_rooms"]
>[number];
type CmsSourcePacketV1 = NonNullable<
  CmsPackageV1["payload"]["source_packets"]
>[number];
type CmsDisplayVariantV1 = CmsNftMediaProfileV1["display_variants"][number];
type CmsPackageSignatureV1 = CmsPackageV1["signatures"][number];

type NftTrait = {
  readonly label: string;
  readonly value: string;
};

type PagePreviewCard = {
  readonly page: CmsPageV1;
  readonly href: string;
  readonly item?: CmsArtInspectionItem | undefined;
};

type ReferenceMetadataItem = {
  readonly label: string;
  readonly value: string;
};

type LabelValueRow = {
  readonly label: string;
  readonly value: string | undefined;
  readonly href?: string | undefined;
};

type RendererContext = {
  readonly cmsPackage: CmsPackageV1;
  readonly assetMap: Map<string, CmsAssetV1>;
  readonly pageMap: Map<string, CmsPageV1>;
  readonly nftProfileMap: Map<string, CmsNftMediaProfileV1>;
  readonly deepZoomMap: Map<string, CmsDeepZoomManifestV1>;
  readonly roomMap: Map<string, CmsExhibitionRoomV1>;
  readonly sourcePacketMap: Map<string, CmsSourcePacketV1>;
  readonly locale: SupportedLocale;
};

const SANDBOX_PERMISSION_ALLOWLIST = new Set([
  "allow-forms",
  "allow-pointer-lock",
  "allow-presentation",
  "allow-scripts",
]);
const EMPTY_ART_METADATA: readonly CmsArtInspectionMetadata[] = [];
const EMPTY_REFERENCE_METADATA: readonly ReferenceMetadataItem[] = [];

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

      <article className="tw-mx-auto tw-flex tw-max-w-6xl tw-flex-col tw-gap-8 tw-px-4 tw-py-8 sm:tw-px-6 md:tw-py-10 lg:tw-px-8">
        <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6">
          <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
            {getPageTypeLabel(locale, page.type)}
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

        {page.type === "nft_detail" || page.type === "card_detail" ? (
          <NftDetailPage context={context} page={page} />
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-7">
            {page.blocks.map((block) => (
              <CmsBlock key={block.id} block={block} context={context} />
            ))}
          </div>
        )}
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
      context={context}
      loading="eager"
      title={getString(block, "title")}
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
  const poster = getAsset(context, getString(block, "poster_asset_id"));
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
      {poster ? (
        <div className="tw-mb-4">
          <AssetImage asset={poster} context={context} />
        </div>
      ) : null}
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
  const items = assetIds
    .map((assetId) => getAsset(context, assetId))
    .filter((asset): asset is CmsAssetV1 => !!asset)
    .map((asset) =>
      createArtInspectionItem({
        asset,
        context,
        title: asset.alt_text ?? asset.id,
      })
    )
    .filter((item): item is CmsArtInspectionItem => !!item);

  if (!items.length) {
    return (
      <UnsupportedBlock
        label={t(context.locale, "profileCms.block.galleryUnavailable")}
      />
    );
  }

  return (
    <CmsArtGalleryGrid
      description={getString(block, "description")}
      heading={getString(block, "title")}
      items={items}
      labels={getArtInspectorLabels(context.locale)}
      mode={getGalleryMode(
        block,
        block.block_type === "gallery" ? "clean" : "editorial"
      )}
    />
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
  const detailPage = findNftDetailPage(context, nftProfile.id);
  const detailHref = detailPage
    ? getCmsPagePath(context.cmsPackage, detailPage.id)
    : null;

  return (
    <ReferencePanel
      detail={nftProfile.contract}
      href={detailHref}
      media={<AssetImage asset={displayAsset} context={context} />}
      metadata={[
        {
          label: t(context.locale, "profileCms.provenance.tokenId"),
          value: nftProfile.token_id,
        },
        {
          label: t(context.locale, "profileCms.provenance.ownerSnapshot"),
          value:
            nftProfile.snapshot?.owner ??
            t(context.locale, "profileCms.provenance.unknown"),
        },
      ]}
      subtitle={t(context.locale, "profileCms.reference.chain", {
        chainId: nftProfile.chain_id,
      })}
      title={t(context.locale, "profileCms.reference.tokenTitle", {
        tokenId: nftProfile.token_id,
      })}
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
  const featuredPages = featuredPageIds
    .map((pageId) => createPagePreviewCard(context, pageId))
    .filter((card): card is PagePreviewCard => !!card);
  const gridMode = getGalleryMode(block, "editorial");

  return (
    <section className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div>
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
        </div>
        <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
          {getGalleryModeLabel(context.locale, gridMode)}
        </p>
      </div>
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
      {featuredPages.length ? (
        <div className="tw-mt-5">
          <FeaturedPageGrid
            cards={featuredPages}
            context={context}
            mode={gridMode}
          />
        </div>
      ) : null}
    </section>
  );
}

function NftDetailPage({
  context,
  page,
}: {
  readonly context: RendererContext;
  readonly page: CmsPageV1;
}) {
  const nftProfile = getPrimaryNftProfileForPage(page, context);
  if (!nftProfile) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-7">
        {page.blocks.map((block) => (
          <CmsBlock key={block.id} block={block} context={context} />
        ))}
      </div>
    );
  }

  const nftBlock = getNftReferenceBlock(page, nftProfile.id);
  const displayVariant = getPreferredNftDisplayVariant(nftProfile, [
    "detail",
    "fullscreen",
    "grid",
    "poster",
  ]);
  const displayAsset =
    getAsset(context, displayVariant?.asset_id) ??
    getAsset(context, nftProfile.poster_asset_id) ??
    getOriginalNftAsset(context, nftProfile);
  const originalAsset = getOriginalNftAsset(context, nftProfile);
  const sourcePacket = getPageSourcePacket(context, page);
  const displayItem = displayAsset
    ? createArtInspectionItem({
        asset: displayAsset,
        caption: page.metadata.description,
        context,
        extraMetadata: getNftAssetMetadataEntries(
          context,
          nftProfile,
          originalAsset,
          sourcePacket
        ),
        originalAsset,
        title: page.metadata.title,
        variant: displayVariant,
      })
    : null;
  const traits = getNftTraits(nftBlock, sourcePacket);
  const traitRows = getUniqueLabelValueRows(traits);
  const collectionContext = getNftCollectionContext(context, page, nftBlock);
  const supplementalBlocks = page.blocks.filter(
    (block) =>
      block.block_type !== "nft_reference" &&
      !(
        block.block_type === "image" &&
        getString(block, "asset_id") === displayAsset?.id
      )
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-8">
      <section className="tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
        <div className="tw-min-w-0">
          {displayItem ? (
            <CmsInspectableArtwork
              className="tw-border tw-border-solid tw-border-iron-800"
              frameClassName="tw-min-h-[min(72dvh,48rem)] tw-bg-black"
              imageClassName="tw-object-contain"
              item={displayItem}
              labels={getArtInspectorLabels(context.locale)}
              loading="eager"
            />
          ) : (
            <UnsupportedBlock
              label={t(context.locale, "profileCms.block.imageUnavailable")}
            />
          )}
        </div>

        <aside className="tw-flex tw-min-w-0 tw-flex-col tw-gap-5 tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
          <div>
            {collectionContext ? (
              <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300">
                {collectionContext.href ? (
                  <CmsLink
                    className="hover:tw-text-primary-200"
                    href={collectionContext.href}
                  >
                    {collectionContext.title}
                  </CmsLink>
                ) : (
                  collectionContext.title
                )}
              </p>
            ) : null}
            <h3 className="tw-text-2xl tw-font-semibold tw-leading-tight tw-text-white">
              {page.metadata.title}
            </h3>
            {page.metadata.description ? (
              <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
                {page.metadata.description}
              </p>
            ) : null}
          </div>

          <DefinitionGrid
            items={[
              {
                label: t(context.locale, "profileCms.provenance.chain"),
                value: formatInteger(context.locale, nftProfile.chain_id),
              },
              {
                label: t(context.locale, "profileCms.provenance.contract"),
                value: nftProfile.contract,
              },
              {
                label: t(context.locale, "profileCms.provenance.tokenId"),
                value: nftProfile.token_id,
              },
              {
                label: t(context.locale, "profileCms.provenance.ownerSnapshot"),
                value: nftProfile.snapshot?.owner,
              },
              {
                label: t(context.locale, "profileCms.provenance.snapshotBlock"),
                value:
                  nftProfile.snapshot?.block_number === undefined
                    ? undefined
                    : formatInteger(
                        context.locale,
                        nftProfile.snapshot.block_number
                      ),
              },
              {
                label: t(context.locale, "profileCms.provenance.capturedAt"),
                value: nftProfile.snapshot?.captured_at
                  ? formatCmsDate(
                      context.locale,
                      nftProfile.snapshot.captured_at
                    )
                  : undefined,
              },
            ]}
          />

          {traits.length ? (
            <section aria-labelledby="cms-nft-traits-title">
              <h4
                className="tw-text-sm tw-font-semibold tw-uppercase tw-text-iron-300"
                id="cms-nft-traits-title"
              >
                {t(context.locale, "profileCms.nft.traits")}
              </h4>
              <dl className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2 lg:tw-grid-cols-1 xl:tw-grid-cols-2">
                {traitRows.map((trait) => (
                  <div
                    className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3"
                    key={trait.key}
                  >
                    <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
                      {trait.label}
                    </dt>
                    <dd className="tw-mt-1 tw-break-words tw-text-sm tw-text-iron-100">
                      {trait.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </aside>
      </section>

      <NftProvenancePanel
        context={context}
        nftProfile={nftProfile}
        originalAsset={originalAsset}
        page={page}
        sourcePacket={sourcePacket}
      />

      <RelatedWorks
        context={context}
        currentPage={page}
        nftProfile={nftProfile}
      />

      {supplementalBlocks.length ? (
        <div className="tw-flex tw-flex-col tw-gap-7">
          {supplementalBlocks.map((block) => (
            <CmsBlock key={block.id} block={block} context={context} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NftProvenancePanel({
  context,
  nftProfile,
  originalAsset,
  page,
  sourcePacket,
}: {
  readonly context: RendererContext;
  readonly nftProfile: CmsNftMediaProfileV1;
  readonly originalAsset: CmsAssetV1 | undefined;
  readonly page: CmsPageV1;
  readonly sourcePacket: CmsSourcePacketV1 | undefined;
}) {
  const originalUrl = resolveAssetUrl(originalAsset);
  const metadataHref = resolveCmsUri(nftProfile.metadata_uri);
  const storage =
    context.cmsPackage.storage.find((receipt) => receipt.canonical) ??
    context.cmsPackage.storage[0];

  return (
    <section
      aria-labelledby="cms-nft-provenance-title"
      className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
    >
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div>
          <h3
            className="tw-text-xl tw-font-semibold tw-text-white"
            id="cms-nft-provenance-title"
          >
            {t(context.locale, "profileCms.provenance.title")}
          </h3>
          <p className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(context.locale, "profileCms.provenance.description")}
          </p>
        </div>
        <p className="tw-break-all tw-font-mono tw-text-xs tw-text-primary-300">
          {context.cmsPackage.integrity.package_hash}
        </p>
      </div>

      <DefinitionGrid
        className="tw-mt-5"
        items={[
          {
            label: t(context.locale, "profileCms.provenance.contract"),
            value: nftProfile.contract,
          },
          {
            label: t(context.locale, "profileCms.provenance.tokenId"),
            value: nftProfile.token_id,
          },
          {
            href: metadataHref ?? undefined,
            label: t(context.locale, "profileCms.provenance.metadataUri"),
            value: nftProfile.metadata_uri,
          },
          {
            label: t(context.locale, "profileCms.provenance.metadataHash"),
            value: nftProfile.metadata_hash,
          },
          {
            href: originalUrl ?? undefined,
            label: t(context.locale, "profileCms.provenance.originalMedia"),
            value: originalAsset?.uri,
          },
          {
            label: t(context.locale, "profileCms.provenance.storage"),
            value: storage
              ? formatProviderUri(context.locale, storage.provider, storage.uri)
              : t(context.locale, "profileCms.provenance.unknown"),
          },
          {
            label: t(context.locale, "profileCms.provenance.sourceSnapshot"),
            value:
              formatSourceSnapshot(context.locale, sourcePacket) ??
              page.source?.source_packet_id,
          },
          {
            label: t(context.locale, "profileCms.provenance.payloadHash"),
            value: context.cmsPackage.integrity.payload_hash,
          },
        ]}
      />

      <details className="tw-mt-5 tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4">
        <summary className="tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-100">
          {t(context.locale, "profileCms.provenance.packageDetails")}
        </summary>
        <DefinitionGrid
          className="tw-mt-4"
          items={[
            {
              label: t(context.locale, "profileCms.provenance.packageId"),
              value: context.cmsPackage.package_id,
            },
            {
              label: t(context.locale, "profileCms.provenance.builder"),
              value: context.cmsPackage.provenance.builder,
            },
            {
              label: t(context.locale, "profileCms.provenance.builderVersion"),
              value: context.cmsPackage.provenance.builder_version,
            },
            {
              label: t(context.locale, "profileCms.provenance.createdAt"),
              value: formatCmsDate(
                context.locale,
                context.cmsPackage.provenance.created_at
              ),
            },
            {
              label: t(context.locale, "profileCms.provenance.signature"),
              value: context.cmsPackage.signatures
                .map((signature) => formatSignature(context.locale, signature))
                .join(", "),
            },
            {
              label: t(context.locale, "profileCms.provenance.storage"),
              value: context.cmsPackage.storage
                .map((receipt) =>
                  formatProviderUri(
                    context.locale,
                    receipt.provider,
                    receipt.uri
                  )
                )
                .join(", "),
            },
          ]}
        />
      </details>
    </section>
  );
}

function RelatedWorks({
  context,
  currentPage,
  nftProfile,
}: {
  readonly context: RendererContext;
  readonly currentPage: CmsPageV1;
  readonly nftProfile: CmsNftMediaProfileV1;
}) {
  const cards = context.cmsPackage.payload.pages
    .filter(
      (page) =>
        page.id !== currentPage.id &&
        (page.type === "collection" ||
          page.type === "gallery" ||
          page.type === "nft_detail" ||
          page.type === "card_detail")
    )
    .map((page) => createPagePreviewCard(context, page.id))
    .filter((card): card is PagePreviewCard => !!card)
    .slice(0, 6);

  if (!cards.length) {
    return null;
  }

  return (
    <section aria-labelledby="cms-related-works-title">
      <div className="tw-mb-4 tw-flex tw-flex-col tw-gap-1 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div>
          <h3
            className="tw-text-xl tw-font-semibold tw-text-white"
            id="cms-related-works-title"
          >
            {t(context.locale, "profileCms.related.title")}
          </h3>
          <p className="tw-text-sm tw-text-iron-400">
            {t(context.locale, "profileCms.related.description", {
              tokenId: nftProfile.token_id,
            })}
          </p>
        </div>
      </div>
      <FeaturedPageGrid cards={cards} context={context} mode="clean" />
    </section>
  );
}

function FeaturedPageGrid({
  cards,
  context,
  mode,
}: {
  readonly cards: readonly PagePreviewCard[];
  readonly context: RendererContext;
  readonly mode: CmsArtGridMode;
}) {
  if (!cards.length) {
    return null;
  }

  return (
    <div className={getCmsArtGalleryGridClassName(mode)}>
      {cards.map((card) => (
        <article
          className="tw-min-w-0 tw-border tw-border-solid tw-border-iron-800 tw-bg-black"
          key={card.page.id}
        >
          {card.item ? (
            <CmsInspectableArtwork
              frameClassName={getCmsArtGalleryFrameClassName(mode)}
              imageClassName={getCmsArtGalleryImageClassName(mode)}
              item={card.item}
              labels={getArtInspectorLabels(context.locale)}
            />
          ) : (
            <div className="tw-flex tw-aspect-square tw-items-center tw-justify-center tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-500">
              {getPageTypeLabel(context.locale, card.page.type)}
            </div>
          )}
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-3">
            <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
              {getPageTypeLabel(context.locale, card.page.type)}
            </p>
            <h4 className="tw-mt-1 tw-text-base tw-font-semibold tw-text-white">
              <CmsLink className="hover:tw-text-primary-200" href={card.href}>
                {card.page.metadata.navigation_label ??
                  card.page.metadata.title}
              </CmsLink>
            </h4>
            {card.page.metadata.description ? (
              <p className="tw-mt-2 tw-line-clamp-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {card.page.metadata.description}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function DefinitionGrid({
  className = "",
  items,
}: {
  readonly className?: string | undefined;
  readonly items: readonly {
    readonly label: string;
    readonly value: string | undefined;
    readonly href?: string | undefined;
  }[];
}) {
  const visibleItems = getUniqueLabelValueRows(
    items.filter((item) => item.value)
  );
  if (!visibleItems.length) {
    return null;
  }

  return (
    <dl
      className={`tw-grid tw-grid-cols-1 tw-gap-3 tw-text-sm sm:tw-grid-cols-2 ${className}`}
    >
      {visibleItems.map((item) => (
        <div
          className="tw-min-w-0 tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3"
          key={item.key}
        >
          <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
            {item.label}
          </dt>
          <dd className="tw-mt-1 tw-break-all tw-text-iron-100">
            {item.href ? (
              <a
                className="hover:tw-text-primary-200 tw-text-primary-300"
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                {item.value}
              </a>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function getUniqueLabelValueRows<T extends LabelValueRow>(
  items: readonly T[]
): ReadonlyArray<T & { readonly key: string }> {
  const seen = new Map<string, number>();

  return items.map((item) => {
    const baseKey = `${item.label}-${item.value ?? ""}-${item.href ?? ""}`;
    const occurrence = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, occurrence);

    return {
      ...item,
      key: `${baseKey}-${occurrence}`,
    };
  });
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
      context={context}
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
      context={context}
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
      context={context}
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
      context={context}
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
  context,
  extraMetadata = EMPTY_ART_METADATA,
  imageClassName = "tw-object-contain",
  loading = "lazy",
  title,
}: {
  readonly asset: CmsAssetV1 | null | undefined;
  readonly caption?: string | undefined;
  readonly context: RendererContext;
  readonly extraMetadata?: readonly CmsArtInspectionMetadata[] | undefined;
  readonly imageClassName?: string | undefined;
  readonly loading?: "eager" | "lazy" | undefined;
  readonly title?: string | undefined;
}) {
  const item = asset
    ? createArtInspectionItem({
        asset,
        caption,
        context,
        extraMetadata,
        title,
      })
    : null;

  if (!item) {
    return (
      <UnsupportedBlock
        label={t(context.locale, "profileCms.block.imageUnavailable")}
      />
    );
  }

  return (
    <CmsInspectableArtwork
      caption={caption}
      imageClassName={imageClassName}
      item={item}
      labels={getArtInspectorLabels(context.locale)}
      loading={loading}
    />
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
  detail,
  href,
  media,
  metadata = EMPTY_REFERENCE_METADATA,
  subtitle,
  title,
}: {
  readonly detail?: string | undefined;
  readonly href?: string | null | undefined;
  readonly media?: ReactNode | undefined;
  readonly metadata?: readonly ReferenceMetadataItem[];
  readonly subtitle?: string | undefined;
  readonly title: string;
}) {
  const metadataRows = getUniqueLabelValueRows(metadata);

  return (
    <section className="tw-grid tw-gap-4 tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 md:tw-grid-cols-[minmax(0,1fr)_14rem]">
      <div>
        {subtitle ? (
          <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-primary-300">
            {subtitle}
          </p>
        ) : null}
        <h3 className="tw-text-xl tw-font-semibold tw-text-white">
          {href ? (
            <CmsLink className="hover:tw-text-primary-200" href={href}>
              {title}
            </CmsLink>
          ) : (
            title
          )}
        </h3>
        {detail ? (
          <p className="tw-mt-3 tw-break-all tw-text-sm tw-leading-6 tw-text-iron-300">
            {detail}
          </p>
        ) : null}
        {metadata.length ? (
          <dl className="tw-mt-4 tw-grid tw-gap-2 tw-text-sm sm:tw-grid-cols-2">
            {metadataRows.map((item) => (
              <div key={item.key}>
                <dt className="tw-text-iron-500">{item.label}</dt>
                <dd className="tw-break-all tw-text-iron-100">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {media ? <div>{media}</div> : null}
    </section>
  );
}

function InteractiveFallback({
  context,
  title,
  description,
  asset,
  href,
}: {
  readonly context: RendererContext;
  readonly title: string;
  readonly description: string;
  readonly asset?: CmsAssetV1 | null | undefined;
  readonly href?: string | null | undefined;
}) {
  return (
    <section className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
      <div className="tw-grid tw-gap-4 md:tw-grid-cols-[16rem_minmax(0,1fr)]">
        <AssetImage asset={asset} context={context} loading="lazy" />
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
              {t(context.locale, "profileCms.interactive.openSourceMedia")}
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

function createArtInspectionItem({
  asset,
  caption,
  context,
  extraMetadata = [],
  originalAsset,
  title,
  variant,
}: {
  readonly asset: CmsAssetV1;
  readonly caption?: string | undefined;
  readonly context: RendererContext;
  readonly extraMetadata?: readonly CmsArtInspectionMetadata[] | undefined;
  readonly originalAsset?: CmsAssetV1 | undefined;
  readonly title?: string | undefined;
  readonly variant?: CmsDisplayVariantV1 | undefined;
}): CmsArtInspectionItem | null {
  if (asset.kind !== "image" && asset.kind !== "social_image") {
    return null;
  }

  const src = resolveAssetUrl(asset);
  if (!src) {
    return null;
  }

  const originalUrl = resolveAssetUrl(originalAsset);
  const roleLabel = getAssetRoleLabel(context.locale, asset, variant);
  const metadata = compactMetadataEntries([
    {
      label: t(context.locale, "profileCms.art.metadata.role"),
      value: roleLabel,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.assetId"),
      value: asset.id,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.kind"),
      value: asset.kind,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.mimeType"),
      value: asset.mime_type,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.dimensions"),
      value: formatAssetDimensions(context.locale, asset),
    },
    {
      href: src,
      label: t(context.locale, "profileCms.art.metadata.displayMedia"),
      value: asset.uri,
    },
    {
      href:
        originalAsset && originalAsset.id !== asset.id
          ? (originalUrl ?? undefined)
          : undefined,
      label: t(context.locale, "profileCms.art.metadata.originalMedia"),
      value:
        originalAsset && originalAsset.id !== asset.id ? originalAsset.uri : "",
    },
    {
      label: t(context.locale, "profileCms.art.metadata.sourceAsset"),
      value:
        variant?.source_asset_id && variant.source_asset_id !== asset.id
          ? variant.source_asset_id
          : "",
    },
    {
      label: t(context.locale, "profileCms.art.metadata.contentHash"),
      value: asset.content_hash,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.rights"),
      value: asset.rights ?? "",
    },
    ...extraMetadata,
  ]);

  return {
    id: asset.id,
    title: title ?? asset.alt_text ?? asset.id,
    src,
    alt: asset.decorative ? "" : (asset.alt_text ?? title ?? ""),
    metadata,
    ...(caption || asset.alt_text
      ? { caption: caption ?? asset.alt_text }
      : {}),
    ...(roleLabel ? { roleLabel } : {}),
    ...(asset.width ? { width: asset.width } : {}),
    ...(asset.height ? { height: asset.height } : {}),
    ...(variant?.background ? { background: variant.background } : {}),
  };
}

function compactMetadataEntries(
  entries: readonly CmsArtInspectionMetadata[]
): CmsArtInspectionMetadata[] {
  return entries.filter(
    (entry) => typeof entry.value === "string" && entry.value.trim().length > 0
  );
}

function formatAssetDimensions(
  locale: SupportedLocale,
  asset: CmsAssetV1
): string {
  if (!asset.width || !asset.height) {
    return "";
  }

  return t(locale, "profileCms.art.metadata.dimensionsValue", {
    height: formatInteger(locale, asset.height),
    width: formatInteger(locale, asset.width),
  });
}

function formatProviderUri(
  locale: SupportedLocale,
  provider: string,
  uri: string
): string {
  return t(locale, "profileCms.provenance.providerUri", {
    provider,
    uri,
  });
}

function formatSignature(
  locale: SupportedLocale,
  signature: CmsPackageSignatureV1
): string {
  return t(locale, "profileCms.provenance.signatureValue", {
    signer: signature.signer,
    type: signature.type,
  });
}

function formatSourceSnapshot(
  locale: SupportedLocale,
  sourcePacket: CmsSourcePacketV1 | undefined
): string | undefined {
  if (!sourcePacket) {
    return undefined;
  }

  return t(locale, "profileCms.provenance.sourceSnapshotValue", {
    date: formatCmsDate(locale, sourcePacket.captured_at),
    type: sourcePacket.source_type,
  });
}

function getArtInspectorLabels(locale: SupportedLocale): CmsArtInspectorLabels {
  return {
    inspect: t(locale, "profileCms.art.inspect"),
    close: t(locale, "profileCms.art.close"),
    previous: t(locale, "profileCms.art.previous"),
    next: t(locale, "profileCms.art.next"),
    zoomIn: t(locale, "profileCms.art.zoomIn"),
    zoomOut: t(locale, "profileCms.art.zoomOut"),
    resetZoom: t(locale, "profileCms.art.resetZoom"),
    fullscreen: t(locale, "profileCms.art.fullscreen"),
    showMetadata: t(locale, "profileCms.art.showMetadata"),
    hideMetadata: t(locale, "profileCms.art.hideMetadata"),
    metadataTitle: t(locale, "profileCms.art.metadata.title"),
  };
}

function getAssetRoleLabel(
  locale: SupportedLocale,
  asset: CmsAssetV1,
  variant: CmsDisplayVariantV1 | undefined
): string {
  if (asset.roles?.includes("original")) {
    return t(locale, "profileCms.art.role.original");
  }

  if (asset.roles?.some((role) => role === "poster" || role === "fallback")) {
    return t(locale, "profileCms.art.role.poster");
  }

  if (variant?.source_asset_id && variant.source_asset_id !== asset.id) {
    return t(locale, "profileCms.art.role.derivative");
  }

  if (
    asset.roles?.some((role) =>
      ["thumbnail", "grid", "detail", "fullscreen", "social"].includes(role)
    )
  ) {
    return t(locale, "profileCms.art.role.derivative");
  }

  return t(locale, "profileCms.art.role.display");
}

function getGalleryMode(
  block: CmsBlockV1,
  fallback: CmsArtGridMode
): CmsArtGridMode {
  const value =
    getString(block, "display_mode") ??
    getString(block, "grid_mode") ??
    getString(block, "mode");

  if (
    value === "editorial" ||
    value === "dense" ||
    value === "contact_sheet" ||
    value === "clean"
  ) {
    return value;
  }

  return fallback;
}

function getGalleryModeLabel(
  locale: SupportedLocale,
  mode: CmsArtGridMode
): string {
  switch (mode) {
    case "editorial":
      return t(locale, "profileCms.gallery.mode.editorial");
    case "dense":
      return t(locale, "profileCms.gallery.mode.dense");
    case "contact_sheet":
      return t(locale, "profileCms.gallery.mode.contactSheet");
    case "clean":
      return t(locale, "profileCms.gallery.mode.clean");
  }
}

function getPrimaryNftProfileForPage(
  page: CmsPageV1,
  context: RendererContext
): CmsNftMediaProfileV1 | undefined {
  const blockProfile = page.blocks
    .map((block) =>
      context.nftProfileMap.get(getString(block, "nft_media_profile_id") ?? "")
    )
    .find((profile): profile is CmsNftMediaProfileV1 => !!profile);

  if (blockProfile) {
    return blockProfile;
  }

  if (page.type === "nft_detail" || page.type === "card_detail") {
    const profiles = Array.from(context.nftProfileMap.values());
    return (
      getNftProfileForPageRoute(page, profiles) ??
      (profiles.length === 1 ? profiles[0] : undefined)
    );
  }

  return undefined;
}

function getNftProfileForPageRoute(
  page: CmsPageV1,
  profiles: readonly CmsNftMediaProfileV1[]
): CmsNftMediaProfileV1 | undefined {
  const routeCandidates = [page.path, page.metadata.canonical_url].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );

  return profiles.find((profile) =>
    routeCandidates.some((route) => routeMatchesNftProfile(route, profile))
  );
}

function routeMatchesNftProfile(
  route: string,
  profile: CmsNftMediaProfileV1
): boolean {
  const normalizedRoute = route.toLowerCase();
  if (!normalizedRoute.includes(profile.contract.toLowerCase())) {
    return false;
  }

  const routeParts = normalizedRoute.split(/[/?#&=]+/).filter(Boolean);
  return getNftRouteTokenCandidates(profile.token_id).some((candidate) =>
    routeParts.includes(candidate)
  );
}

function getNftRouteTokenCandidates(tokenId: string): readonly string[] {
  const normalizedTokenId = tokenId.trim().toLowerCase();
  if (!normalizedTokenId) {
    return [];
  }

  const encodedTokenId = encodeURIComponent(normalizedTokenId).toLowerCase();
  return encodedTokenId === normalizedTokenId
    ? [normalizedTokenId]
    : [normalizedTokenId, encodedTokenId];
}

function getNftReferenceBlock(
  page: CmsPageV1,
  profileId: string
): CmsBlockV1 | undefined {
  return page.blocks.find(
    (block) => getString(block, "nft_media_profile_id") === profileId
  );
}

function getPreferredNftDisplayVariant(
  profile: CmsNftMediaProfileV1,
  roles: readonly CmsDisplayVariantV1["role"][]
): CmsDisplayVariantV1 | undefined {
  for (const role of roles) {
    const variant = profile.display_variants.find((item) => item.role === role);
    if (variant) {
      return variant;
    }
  }

  return profile.display_variants[0];
}

function getOriginalNftAsset(
  context: RendererContext,
  profile: CmsNftMediaProfileV1
): CmsAssetV1 | undefined {
  const originalAsset = profile.original_asset_ids
    ?.map((assetId) => getAsset(context, assetId))
    .find((asset): asset is CmsAssetV1 => !!asset);

  if (originalAsset) {
    return originalAsset;
  }

  return profile.display_variants
    .map((variant) =>
      getAsset(context, variant.source_asset_id ?? variant.asset_id)
    )
    .find((asset): asset is CmsAssetV1 => !!asset);
}

function getNftAssetMetadataEntries(
  context: RendererContext,
  profile: CmsNftMediaProfileV1,
  originalAsset: CmsAssetV1 | undefined,
  sourcePacket: CmsSourcePacketV1 | undefined
): readonly CmsArtInspectionMetadata[] {
  return compactMetadataEntries([
    {
      label: t(context.locale, "profileCms.provenance.chain"),
      value: formatInteger(context.locale, profile.chain_id),
    },
    {
      label: t(context.locale, "profileCms.provenance.contract"),
      value: profile.contract,
    },
    {
      label: t(context.locale, "profileCms.provenance.tokenId"),
      value: profile.token_id,
    },
    {
      href: resolveCmsUri(profile.metadata_uri) ?? undefined,
      label: t(context.locale, "profileCms.provenance.metadataUri"),
      value: profile.metadata_uri ?? "",
    },
    {
      label: t(context.locale, "profileCms.provenance.ownerSnapshot"),
      value: profile.snapshot?.owner ?? "",
    },
    {
      label: t(context.locale, "profileCms.provenance.sourceSnapshot"),
      value: formatSourceSnapshot(context.locale, sourcePacket) ?? "",
    },
    {
      href: resolveAssetUrl(originalAsset) ?? undefined,
      label: t(context.locale, "profileCms.provenance.originalMedia"),
      value: originalAsset?.uri ?? "",
    },
  ]);
}

function getNftTraits(
  nftBlock: CmsBlockV1 | undefined,
  sourcePacket: CmsSourcePacketV1 | undefined
): NftTrait[] {
  return [
    ...parseNftTraits(getExtensionField(nftBlock, "traits")),
    ...parseNftTraits(getExtensionField(nftBlock, "attributes")),
    ...parseNftTraits(getExtensionField(sourcePacket, "traits")),
    ...parseNftTraits(getExtensionField(sourcePacket, "attributes")),
  ];
}

function getExtensionField(record: unknown, key: string): unknown {
  return isRecord(record) ? record[key] : undefined;
}

function parseNftTraits(value: unknown): NftTrait[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const label =
        getString(item, "trait_type") ??
        getString(item, "trait") ??
        getString(item, "name");
      const rawValue = item["value"];
      if (!label || rawValue === undefined || rawValue === null) {
        return null;
      }

      return {
        label,
        value:
          typeof rawValue === "string" || typeof rawValue === "number"
            ? String(rawValue)
            : JSON.stringify(rawValue),
      };
    })
    .filter((trait): trait is NftTrait => !!trait);
}

function getNftCollectionContext(
  context: RendererContext,
  page: CmsPageV1,
  nftBlock: CmsBlockV1 | undefined
): { readonly title: string; readonly href?: string | undefined } | null {
  const collectionPage =
    context.pageMap.get(getString(nftBlock, "collection_page_id") ?? "") ??
    context.cmsPackage.payload.pages.find(
      (candidate) => candidate.type === "collection" && candidate.id !== page.id
    );
  const title =
    getString(nftBlock, "collection_title") ??
    getString(nftBlock, "collection_name") ??
    collectionPage?.metadata.title;

  if (!title) {
    return null;
  }

  const href = collectionPage
    ? getCmsPagePath(context.cmsPackage, collectionPage.id)
    : null;

  return {
    title,
    ...(href ? { href } : {}),
  };
}

function getPageSourcePacket(
  context: RendererContext,
  page: CmsPageV1
): CmsSourcePacketV1 | undefined {
  return context.sourcePacketMap.get(page.source?.source_packet_id ?? "");
}

function findNftDetailPage(
  context: RendererContext,
  profileId: string
): CmsPageV1 | undefined {
  return context.cmsPackage.payload.pages.find((page) =>
    page.blocks.some(
      (block) => getString(block, "nft_media_profile_id") === profileId
    )
  );
}

function createPagePreviewCard(
  context: RendererContext,
  pageId: string
): PagePreviewCard | null {
  const page = context.pageMap.get(pageId);
  const href = getCmsPagePath(context.cmsPackage, pageId);
  if (!page || !href) {
    return null;
  }

  const asset = getPagePreviewAsset(context, page);
  const nftProfile = getPrimaryNftProfileForPage(page, context);
  const item = asset
    ? createArtInspectionItem({
        asset,
        caption: page.metadata.description,
        context,
        originalAsset: nftProfile
          ? getOriginalNftAsset(context, nftProfile)
          : undefined,
        title: page.metadata.title,
      })
    : null;

  return {
    page,
    href,
    ...(item ? { item } : {}),
  };
}

function getPagePreviewAsset(
  context: RendererContext,
  page: CmsPageV1
): CmsAssetV1 | undefined {
  const nftProfile = getPrimaryNftProfileForPage(page, context);
  if (nftProfile) {
    const gridVariant = getPreferredNftDisplayVariant(nftProfile, [
      "grid",
      "poster",
      "detail",
    ]);
    const asset =
      getAsset(context, gridVariant?.asset_id) ??
      getAsset(context, nftProfile.poster_asset_id) ??
      getOriginalNftAsset(context, nftProfile);
    if (asset) {
      return asset;
    }
  }

  const imageBlockAssetId = page.blocks
    .map(
      (block) =>
        getString(block, "asset_id") ??
        getStringArray(block, "asset_ids")[0] ??
        getStringArray(block, "featured_asset_ids")[0]
    )
    .find((assetId): assetId is string => !!assetId);

  return (
    getAsset(context, imageBlockAssetId) ??
    getAsset(context, page.metadata.social_image_asset_id)
  );
}

function getPageTypeLabel(
  locale: SupportedLocale,
  pageType: CmsPageV1["type"]
): string {
  switch (pageType) {
    case "gallery":
      return t(locale, "profileCms.pageType.gallery");
    case "collection":
      return t(locale, "profileCms.pageType.collection");
    case "nft_detail":
      return t(locale, "profileCms.pageType.nftDetail");
    case "card_detail":
      return t(locale, "profileCms.pageType.cardDetail");
    case "room":
      return t(locale, "profileCms.pageType.room");
    case "transaction":
      return t(locale, "profileCms.pageType.transaction");
    case "post":
      return t(locale, "profileCms.pageType.post");
    case "page":
      return t(locale, "profileCms.pageType.page");
    default:
      return (pageType as string).replaceAll("_", " ");
  }
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
    sourcePacketMap: new Map(
      (cmsPackage.payload.source_packets ?? []).map((sourcePacket) => [
        sourcePacket.id,
        sourcePacket,
      ])
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
  return isRecord(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
