import { getCmsDetailClasses } from "./detailPresentation";
import { CmsInspectableArtwork } from "@/components/profile-cms/CmsArtLightbox";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { CmsAssetV1, CmsPageV1 } from "@/lib/profile-cms/protocol/v1";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";
import { CmsBlock } from "@/components/profile-cms/site-renderer/blocks";
import {
  formatCmsDate,
  formatProviderUri,
  formatSignature,
  formatSourceSnapshot,
  getAsset,
  getString,
  getUniqueLabelValueRows,
  resolveAssetUrl,
} from "@/components/profile-cms/site-renderer/data";
import {
  CmsLink,
  UnsupportedBlock,
} from "@/components/profile-cms/site-renderer/links";
import {
  createArtInspectionItem,
  getArtInspectorLabels,
} from "@/components/profile-cms/site-renderer/media";
import {
  createPagePreviewCard,
  getNftAssetMetadataEntries,
  getNftCollectionContext,
  getNftReferenceBlock,
  getNftTraits,
  getOriginalNftAsset,
  getPageSourcePacket,
  getPreferredNftDisplayVariant,
  getPrimaryNftProfileForPage,
} from "@/components/profile-cms/site-renderer/nftHelpers";
import {
  DefinitionGrid,
  FeaturedPageGrid,
} from "@/components/profile-cms/site-renderer/panels";
import type {
  CmsNftMediaProfileV1,
  CmsSourcePacketV1,
  PagePreviewCard,
  RendererContext,
} from "@/components/profile-cms/site-renderer/types";

export function NftDetailPage({
  context,
  page,
}: {
  readonly context: RendererContext;
  readonly page: CmsPageV1;
}) {
  const theme = getCmsDetailClasses(context);
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
      <section
        className={
          context.appearance === "studio"
            ? "tw-grid tw-gap-8 @[56rem]/cms-studio:tw-grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.55fr)]"
            : "tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]"
        }
      >
        <div className="tw-min-w-0">
          {displayItem ? (
            <CmsInspectableArtwork
              className={theme.figure}
              frameClassName={theme.frame}
              imageClassName={theme.image}
              item={
                context.appearance === "studio"
                  ? { ...displayItem, caption: undefined, roleLabel: undefined }
                  : displayItem
              }
              labels={getArtInspectorLabels(context.locale)}
              loading="eager"
            />
          ) : (
            <UnsupportedBlock
              className={theme.unavailable}
              label={t(context.locale, "profileCms.block.imageUnavailable")}
            />
          )}
        </div>

        <aside
          className={`tw-flex tw-min-w-0 tw-flex-col tw-gap-5 ${theme.panel}`}
        >
          <div>
            {collectionContext ? (
              <p
                className={`tw-mb-2 tw-text-sm tw-font-semibold tw-uppercase ${theme.accent}`}
              >
                {collectionContext.href ? (
                  <CmsLink
                    context={context}
                    className={`${theme.link}`}
                    href={collectionContext.href}
                  >
                    {collectionContext.title}
                  </CmsLink>
                ) : (
                  collectionContext.title
                )}
              </p>
            ) : null}
            <h3
              className={`tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight ${theme.title}`}
            >
              {page.metadata.title}
            </h3>
            {page.metadata.description ? (
              <p className={`tw-mt-3 tw-text-sm tw-leading-6 ${theme.text}`}>
                {page.metadata.description}
              </p>
            ) : null}
          </div>

          <DefinitionGrid
            studio={context.appearance === "studio"}
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
                className={`tw-text-sm tw-font-semibold tw-uppercase ${theme.text}`}
                id="cms-nft-traits-title"
              >
                {t(context.locale, "profileCms.nft.traits")}
              </h4>
              <dl className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2 lg:tw-grid-cols-1 xl:tw-grid-cols-2">
                {traitRows.map((trait) => (
                  <div className={`${theme.tile}`} key={trait.key}>
                    <dt
                      className={`tw-text-xs tw-font-semibold tw-uppercase ${theme.label}`}
                    >
                      {trait.label}
                    </dt>
                    <dd
                      className={`tw-mt-1 tw-break-words tw-text-sm ${theme.value}`}
                    >
                      {trait.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </aside>
      </section>

      <NftProvenanceDetails
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

type NftProvenanceProps = {
  readonly context: RendererContext;
  readonly nftProfile: CmsNftMediaProfileV1;
  readonly originalAsset: CmsAssetV1 | undefined;
  readonly page: CmsPageV1;
  readonly sourcePacket: CmsSourcePacketV1 | undefined;
};

function NftProvenanceDetails(props: NftProvenanceProps) {
  if (props.context.appearance !== "studio")
    return <NftProvenancePanel {...props} />;
  return (
    <details className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-[color:var(--cms-line)] tw-pt-5">
      <summary className="tw-cursor-pointer tw-text-sm tw-font-medium">
        {t(props.context.locale, "profileCms.provenance.title")}
      </summary>
      <div className="tw-mt-5">
        <NftProvenancePanel {...props} />
      </div>
    </details>
  );
}

function NftProvenancePanel({
  context,
  nftProfile,
  originalAsset,
  page,
  sourcePacket,
}: NftProvenanceProps) {
  const theme = getCmsDetailClasses(context);
  const originalUrl = resolveAssetUrl(originalAsset);
  const metadataHref = resolveCmsUri(nftProfile.metadata_uri);
  const storage =
    context.cmsPackage.storage.find((receipt) => receipt.canonical) ??
    context.cmsPackage.storage[0];

  return (
    <section
      aria-labelledby="cms-nft-provenance-title"
      className={`${theme.panel}`}
    >
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div>
          <h3
            className={`tw-m-0 tw-text-xl tw-font-semibold ${theme.title}`}
            id="cms-nft-provenance-title"
          >
            {t(context.locale, "profileCms.provenance.title")}
          </h3>
          <p className={`tw-mt-1 tw-text-sm tw-leading-6 ${theme.muted}`}>
            {t(context.locale, "profileCms.provenance.description")}
          </p>
        </div>
        <p className={`tw-break-all tw-font-mono tw-text-xs ${theme.accent}`}>
          {context.cmsPackage.integrity.package_hash}
        </p>
      </div>

      <DefinitionGrid
        studio={context.appearance === "studio"}
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

      <details className={`tw-mt-5 ${theme.panel}`}>
        <summary
          className={`tw-cursor-pointer tw-text-sm tw-font-semibold ${theme.value}`}
        >
          {t(context.locale, "profileCms.provenance.packageDetails")}
        </summary>
        <DefinitionGrid
          studio={context.appearance === "studio"}
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
  const theme = getCmsDetailClasses(context);
  const relatedTypes =
    context.appearance === "studio"
      ? ["nft_detail", "card_detail"]
      : ["collection", "gallery", "nft_detail", "card_detail"];
  const cards = context.cmsPackage.payload.pages
    .filter(
      (page) => page.id !== currentPage.id && relatedTypes.includes(page.type)
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
            className={`tw-m-0 tw-text-xl tw-font-semibold ${theme.title}`}
            id="cms-related-works-title"
          >
            {t(context.locale, "profileCms.related.title")}
          </h3>
          <p className={`tw-text-sm ${theme.muted}`}>
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
