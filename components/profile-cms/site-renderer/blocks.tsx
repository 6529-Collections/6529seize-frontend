import {
  CmsArtGalleryGrid,
  type CmsArtInspectionItem,
} from "@/components/profile-cms/CmsArtLightbox";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { CmsAssetV1, CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import { getCmsPagePath } from "@/lib/profile-cms/runtime/routes";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";
import {
  formatCmsDate,
  getAsset,
  getNumber,
  getRecord,
  getString,
  getStringArray,
  resolveAssetUrl,
} from "@/components/profile-cms/site-renderer/data";
import {
  DeepZoomBlock,
  HtmlEmbedBlock,
  ObjectViewerBlock,
  RoomViewerBlock,
} from "@/components/profile-cms/site-renderer/interactiveBlocks";
import {
  CmsLink,
  UnsupportedBlock,
} from "@/components/profile-cms/site-renderer/links";
import {
  AssetImage,
  createArtInspectionItem,
  getArtInspectorLabels,
  getGalleryMode,
  getGalleryModeLabel,
  getMediaCaptionTrackSrc,
  MediaCaption,
} from "@/components/profile-cms/site-renderer/media";
import {
  FeaturedPageGrid,
  ReferencePanel,
} from "@/components/profile-cms/site-renderer/panels";
import {
  createPagePreviewCard,
  findNftDetailPage,
} from "@/components/profile-cms/site-renderer/nftHelpers";
import type {
  PagePreviewCard,
  RendererContext,
} from "@/components/profile-cms/site-renderer/types";

export function CmsBlock({
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
