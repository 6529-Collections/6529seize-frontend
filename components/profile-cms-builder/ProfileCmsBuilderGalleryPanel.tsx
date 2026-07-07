"use client";

import Image from "next/image";

import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  WALLET_GALLERY_FIXTURE_WARNING_CODES,
  type WalletGalleryBuilderState,
  type WalletGallerySnapshotAsset,
  type WalletGallerySnapshotCollection,
} from "@/lib/profile-cms/builder/gallery";
import type { CmsBuilderState } from "@/lib/profile-cms/builder/package";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";

import {
  BuilderActionButton,
  Fieldset,
  TextArea,
  TextInput,
} from "@/components/profile-cms-builder/ProfileCmsBuilderControls";
import type { GallerySnapshotStatus } from "@/components/profile-cms-builder/ProfileCmsBuilderEditorPanel";

export function WalletGalleryPanel({
  gallery,
  locale,
  onRequestSnapshot,
  snapshotError,
  snapshotStatus,
  state,
  updateGallery,
  updateState,
}: {
  readonly gallery: WalletGalleryBuilderState;
  readonly locale: SupportedLocale;
  readonly onRequestSnapshot: () => void;
  readonly snapshotError: string;
  readonly snapshotStatus: GallerySnapshotStatus;
  readonly state: CmsBuilderState;
  readonly updateGallery: (patch: Partial<WalletGalleryBuilderState>) => void;
  readonly updateState: (patch: Partial<CmsBuilderState>) => void;
}) {
  const snapshot = gallery.snapshot;
  const orderedAssets = snapshot
    ? orderGalleryAssets(snapshot.assets, gallery.orderedAssetIds)
    : [];
  const hiddenAssetIds = new Set(gallery.hiddenAssetIds);
  const visibleAssets = orderedAssets.filter(
    (asset) => !hiddenAssetIds.has(asset.id)
  );
  const partialMediaCount = orderedAssets.filter(
    (asset) => asset.mediaState !== "ready" || !asset.imageUri
  ).length;

  const toggleHiddenAsset = (assetId: string) => {
    updateGallery({
      hiddenAssetIds: toggleString(gallery.hiddenAssetIds, assetId),
    });
  };
  const toggleFeaturedAsset = (assetId: string) => {
    updateGallery({
      featuredAssetIds: toggleString(gallery.featuredAssetIds, assetId),
    });
  };
  const toggleFeaturedCollection = (collectionId: string) => {
    updateGallery({
      featuredCollectionIds: toggleString(
        gallery.featuredCollectionIds,
        collectionId
      ),
    });
  };
  const moveAsset = (assetId: string, direction: -1 | 1) => {
    const currentOrder =
      gallery.orderedAssetIds.length > 0
        ? gallery.orderedAssetIds
        : orderedAssets.map((asset) => asset.id);
    updateGallery({
      orderedAssetIds: moveString(currentOrder, assetId, direction),
    });
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-6 tw-p-4">
      <Fieldset title={t(locale, "profileCms.builder.gallery.settings")}>
        <TextInput
          id="cms-builder-gallery-site-title"
          label={t(locale, "profileCms.builder.field.siteTitle")}
          onChange={(siteTitle) => updateState({ siteTitle })}
          value={state.siteTitle}
        />
        <TextInput
          id="cms-builder-gallery-theme-accent"
          label={t(locale, "profileCms.builder.field.themeAccent")}
          onChange={(themeAccent) => updateState({ themeAccent })}
          type="color"
          value={state.themeAccent}
        />
        <TextArea
          id="cms-builder-gallery-site-description"
          label={t(locale, "profileCms.builder.field.siteDescription")}
          onChange={(siteDescription) => updateState({ siteDescription })}
          rows={3}
          value={state.siteDescription}
        />
      </Fieldset>

      <Fieldset title={t(locale, "profileCms.builder.gallery.wallets.title")}>
        <TextArea
          id="cms-builder-gallery-wallets"
          label={t(locale, "profileCms.builder.gallery.wallets.label")}
          onChange={(walletInput) => updateGallery({ walletInput })}
          rows={5}
          value={gallery.walletInput}
        />
        <div className="tw-flex tw-flex-col tw-gap-2 md:tw-col-span-2">
          <div>
            <BuilderActionButton
              disabled={snapshotStatus === "loading"}
              label={
                snapshotStatus === "loading"
                  ? t(locale, "profileCms.builder.gallery.snapshot.loading")
                  : t(locale, "profileCms.builder.gallery.snapshot.request")
              }
              onClick={onRequestSnapshot}
              variant="primary"
            />
          </div>
          <p className="tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "profileCms.builder.gallery.wallets.help")}
          </p>
          {snapshotStatus === "loading" ? (
            <p className="tw-text-primary-200 tw-text-sm" role="status">
              {t(locale, "profileCms.builder.gallery.snapshot.loadingDetail")}
            </p>
          ) : null}
          {snapshotError ? (
            <p
              className="tw-border tw-border-solid tw-border-red tw-bg-red/10 tw-p-3 tw-text-sm tw-text-red"
              role="alert"
            >
              {snapshotError}
            </p>
          ) : null}
        </div>
      </Fieldset>

      <section
        aria-labelledby="cms-builder-gallery-review-title"
        className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4"
      >
        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
          <div>
            <h2
              className="tw-text-base tw-font-semibold tw-text-white"
              id="cms-builder-gallery-review-title"
            >
              {t(locale, "profileCms.builder.gallery.review.title")}
            </h2>
            <p className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(locale, "profileCms.builder.gallery.review.description")}
            </p>
          </div>
          {snapshot ? (
            <p className="tw-text-primary-200 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold">
              {snapshot.source === "fixture"
                ? t(locale, "profileCms.builder.gallery.snapshot.fixture")
                : t(locale, "profileCms.builder.gallery.snapshot.api")}
            </p>
          ) : null}
        </div>

        {!snapshot ? (
          <EmptyGalleryReview locale={locale} />
        ) : (
          <div className="tw-mt-5 tw-flex tw-flex-col tw-gap-5">
            <GallerySnapshotSummary
              hiddenCount={gallery.hiddenAssetIds.length}
              locale={locale}
              partialMediaCount={partialMediaCount}
              snapshot={snapshot}
              visibleCount={visibleAssets.length}
            />
            <GalleryCollectionReviewList
              collections={snapshot.collections}
              featuredCollectionIds={gallery.featuredCollectionIds}
              locale={locale}
              onToggleFeatured={toggleFeaturedCollection}
              visibleAssets={visibleAssets}
            />
            <GalleryAssetReviewList
              assets={orderedAssets}
              featuredAssetIds={gallery.featuredAssetIds}
              hiddenAssetIds={gallery.hiddenAssetIds}
              locale={locale}
              onMoveAsset={moveAsset}
              onToggleFeatured={toggleFeaturedAsset}
              onToggleHidden={toggleHiddenAsset}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyGalleryReview({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-mt-5 tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-300">
      {t(locale, "profileCms.builder.gallery.review.empty")}
    </div>
  );
}

function GallerySnapshotSummary({
  hiddenCount,
  locale,
  partialMediaCount,
  snapshot,
  visibleCount,
}: {
  readonly hiddenCount: number;
  readonly locale: SupportedLocale;
  readonly partialMediaCount: number;
  readonly snapshot: NonNullable<WalletGalleryBuilderState["snapshot"]>;
  readonly visibleCount: number;
}) {
  return (
    <div className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4">
      <dl className="tw-grid tw-grid-cols-1 tw-gap-3 tw-text-sm sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        <SummaryItem
          label={t(locale, "profileCms.builder.gallery.summary.wallets")}
          value={formatInteger(locale, snapshot.wallets.length)}
        />
        <SummaryItem
          label={t(locale, "profileCms.builder.gallery.summary.visible")}
          value={formatInteger(locale, visibleCount)}
        />
        <SummaryItem
          label={t(locale, "profileCms.builder.gallery.summary.hidden")}
          value={formatInteger(locale, hiddenCount)}
        />
        <SummaryItem
          label={t(locale, "profileCms.builder.gallery.summary.partial")}
          value={formatInteger(locale, partialMediaCount)}
        />
      </dl>
      {snapshot.warnings.length ? (
        <ul className="tw-mt-4 tw-flex tw-flex-col tw-gap-2">
          {snapshot.warnings.map((warning) => (
            <li
              className="tw-text-primary-100 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-p-3 tw-text-sm tw-leading-6"
              key={warning}
            >
              {formatGallerySnapshotWarning(locale, warning)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function formatGallerySnapshotWarning(
  locale: SupportedLocale,
  warning: string
): string {
  switch (warning) {
    case WALLET_GALLERY_FIXTURE_WARNING_CODES.backendDisabled:
      return t(
        locale,
        "profileCms.builder.gallery.snapshot.warning.fixtureBackendDisabled"
      );
    case WALLET_GALLERY_FIXTURE_WARNING_CODES.partialMedia:
      return t(
        locale,
        "profileCms.builder.gallery.snapshot.warning.partialMedia"
      );
    default:
      return warning;
  }
}

function SummaryItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <dt className="tw-text-iron-500">{label}</dt>
      <dd className="tw-mt-1 tw-text-lg tw-font-semibold tw-text-white">
        {value}
      </dd>
    </div>
  );
}

function GalleryCollectionReviewList({
  collections,
  featuredCollectionIds,
  locale,
  onToggleFeatured,
  visibleAssets,
}: {
  readonly collections: readonly WalletGallerySnapshotCollection[];
  readonly featuredCollectionIds: readonly string[];
  readonly locale: SupportedLocale;
  readonly onToggleFeatured: (collectionId: string) => void;
  readonly visibleAssets: readonly WalletGallerySnapshotAsset[];
}) {
  return (
    <section aria-labelledby="cms-builder-gallery-collections-title">
      <h3
        className="tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300"
        id="cms-builder-gallery-collections-title"
      >
        {t(locale, "profileCms.builder.gallery.collections.title")}
      </h3>
      <ul className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
        {collections.map((collection) => {
          const visibleCount = visibleAssets.filter(
            (asset) => asset.collectionId === collection.id
          ).length;
          const featured = featuredCollectionIds.includes(collection.id);
          return (
            <li
              className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
              key={collection.id}
            >
              <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
                <div>
                  <p className="tw-text-sm tw-font-semibold tw-text-white">
                    {collection.name}
                  </p>
                  <p className="tw-mt-1 tw-text-xs tw-text-iron-500">
                    {t(locale, "profileCms.builder.gallery.collections.count", {
                      count: formatInteger(locale, visibleCount),
                    })}
                  </p>
                </div>
                <button
                  aria-pressed={featured}
                  className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400"
                  onClick={() => onToggleFeatured(collection.id)}
                  type="button"
                >
                  {featured
                    ? t(
                        locale,
                        "profileCms.builder.gallery.collections.unfeature"
                      )
                    : t(
                        locale,
                        "profileCms.builder.gallery.collections.feature"
                      )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function GalleryAssetReviewList({
  assets,
  featuredAssetIds,
  hiddenAssetIds,
  locale,
  onMoveAsset,
  onToggleFeatured,
  onToggleHidden,
}: {
  readonly assets: readonly WalletGallerySnapshotAsset[];
  readonly featuredAssetIds: readonly string[];
  readonly hiddenAssetIds: readonly string[];
  readonly locale: SupportedLocale;
  readonly onMoveAsset: (assetId: string, direction: -1 | 1) => void;
  readonly onToggleFeatured: (assetId: string) => void;
  readonly onToggleHidden: (assetId: string) => void;
}) {
  if (!assets.length) {
    return (
      <div className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-300">
        {t(locale, "profileCms.builder.gallery.assets.empty")}
      </div>
    );
  }

  return (
    <section aria-labelledby="cms-builder-gallery-assets-title">
      <h3
        className="tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300"
        id="cms-builder-gallery-assets-title"
      >
        {t(locale, "profileCms.builder.gallery.assets.title")}
      </h3>
      <ul className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-3">
        {assets.map((asset, index) => (
          <GalleryAssetReviewCard
            asset={asset}
            canMoveDown={index < assets.length - 1}
            canMoveUp={index > 0}
            featured={featuredAssetIds.includes(asset.id)}
            hidden={hiddenAssetIds.includes(asset.id)}
            key={asset.id}
            locale={locale}
            onMoveAsset={onMoveAsset}
            onToggleFeatured={onToggleFeatured}
            onToggleHidden={onToggleHidden}
          />
        ))}
      </ul>
    </section>
  );
}

function GalleryAssetReviewCard({
  asset,
  canMoveDown,
  canMoveUp,
  featured,
  hidden,
  locale,
  onMoveAsset,
  onToggleFeatured,
  onToggleHidden,
}: {
  readonly asset: WalletGallerySnapshotAsset;
  readonly canMoveDown: boolean;
  readonly canMoveUp: boolean;
  readonly featured: boolean;
  readonly hidden: boolean;
  readonly locale: SupportedLocale;
  readonly onMoveAsset: (assetId: string, direction: -1 | 1) => void;
  readonly onToggleFeatured: (assetId: string) => void;
  readonly onToggleHidden: (assetId: string) => void;
}) {
  const imageUrl = resolveCmsUri(asset.imageUri);
  return (
    <li
      className={`tw-grid tw-grid-cols-1 tw-gap-4 tw-border tw-border-solid tw-p-4 md:tw-grid-cols-[7rem_minmax(0,1fr)] ${
        hidden
          ? "tw-border-iron-800 tw-bg-iron-950 tw-opacity-70"
          : "tw-border-iron-700 tw-bg-black"
      }`}
    >
      <div className="tw-flex tw-min-h-28 tw-items-center tw-justify-center tw-bg-iron-950">
        {imageUrl ? (
          <Image
            alt={asset.altText}
            className="tw-h-28 tw-w-full tw-object-contain"
            height={112}
            src={imageUrl}
            unoptimized
            width={112}
          />
        ) : (
          <div className="tw-p-3 tw-text-center tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "profileCms.builder.gallery.assets.mediaPartial")}
          </div>
        )}
      </div>
      <div className="tw-min-w-0">
        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
          <div>
            <h4 className="tw-text-base tw-font-semibold tw-text-white">
              {asset.title}
            </h4>
            <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
              {asset.collectionName}
            </p>
            <p className="tw-mt-1 tw-break-all tw-text-xs tw-text-iron-500">
              {t(locale, "profileCms.builder.gallery.assets.owner", {
                owner: asset.owner,
              })}
            </p>
          </div>
          <p
            className={`tw-border tw-border-solid tw-px-2 tw-py-1 tw-text-xs tw-font-semibold ${
              asset.mediaState === "ready" && imageUrl
                ? "tw-border-green tw-bg-green/10 tw-text-green"
                : "tw-text-primary-200 tw-border-primary-400 tw-bg-primary-500/10"
            }`}
          >
            {asset.mediaState === "ready" && imageUrl
              ? t(locale, "profileCms.builder.gallery.assets.mediaReady")
              : t(locale, "profileCms.builder.gallery.assets.mediaPartial")}
          </p>
        </div>
        <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2">
          <button
            aria-pressed={hidden}
            className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400"
            onClick={() => onToggleHidden(asset.id)}
            type="button"
          >
            {hidden
              ? t(locale, "profileCms.builder.gallery.assets.unhide")
              : t(locale, "profileCms.builder.gallery.assets.hide")}
          </button>
          <button
            aria-pressed={featured}
            className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400"
            onClick={() => onToggleFeatured(asset.id)}
            type="button"
          >
            {featured
              ? t(locale, "profileCms.builder.gallery.assets.unfeature")
              : t(locale, "profileCms.builder.gallery.assets.feature")}
          </button>
          <button
            className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            disabled={!canMoveUp}
            onClick={() => onMoveAsset(asset.id, -1)}
            type="button"
          >
            {t(locale, "profileCms.builder.gallery.assets.moveUp")}
          </button>
          <button
            className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            disabled={!canMoveDown}
            onClick={() => onMoveAsset(asset.id, 1)}
            type="button"
          >
            {t(locale, "profileCms.builder.gallery.assets.moveDown")}
          </button>
        </div>
      </div>
    </li>
  );
}

function orderGalleryAssets(
  assets: readonly WalletGallerySnapshotAsset[],
  orderedAssetIds: readonly string[]
): readonly WalletGallerySnapshotAsset[] {
  if (!orderedAssetIds.length) {
    return assets;
  }

  const position = new Map(orderedAssetIds.map((id, index) => [id, index]));
  return [...assets].sort((left, right) => {
    const leftPosition = position.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightPosition = position.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition;
    }
    return assets.indexOf(left) - assets.indexOf(right);
  });
}

function toggleString(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function moveString(
  values: readonly string[],
  value: string,
  direction: -1 | 1
): string[] {
  const next = [...values];
  const currentIndex = next.indexOf(value);
  if (currentIndex < 0) {
    return next;
  }

  const targetIndex = currentIndex + direction;
  if (targetIndex < 0 || targetIndex >= next.length) {
    return next;
  }

  const [item] = next.splice(currentIndex, 1);
  if (!item) {
    return next;
  }
  next.splice(targetIndex, 0, item);
  return next;
}
