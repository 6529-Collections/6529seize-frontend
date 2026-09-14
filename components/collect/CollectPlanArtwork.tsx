import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { PhotoIcon } from "@heroicons/react/24/outline";
import CollectAssetMedia from "./CollectAssetMedia";
import { useCollectPlanMetadata } from "./CollectPlanMetadataProvider";
import { matchingCollectAsset } from "./collect-plan-metadata";

export default function CollectPlanArtwork({
  assetKey,
  asset: supplied,
  fallback,
  locale,
}: {
  readonly assetKey: string;
  readonly asset?: ApiCollectAsset | undefined;
  readonly fallback: string;
  readonly locale: SupportedLocale;
}) {
  const metadata = useCollectPlanMetadata();
  const asset =
    matchingCollectAsset(assetKey, supplied) ?? metadata.assets.get(assetKey);
  const title = asset?.name.trim() ? asset.name : fallback;
  const artists = asset?.artist_ids
    .map(
      (id) => metadata.catalog?.artists.find((artist) => artist.id === id)?.name
    )
    .filter(Boolean)
    .join(", ");
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
      <div className="tw-relative tw-size-12 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-950">
        {asset?.image_url ? (
          <CollectAssetMedia
            key={asset.image_url}
            src={asset.image_url}
            name={title}
          />
        ) : (
          <div
            aria-hidden="true"
            className="tw-flex tw-size-full tw-items-center tw-justify-center tw-text-iron-600"
          >
            <PhotoIcon className="tw-size-5" />
          </div>
        )}
      </div>
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100">
          {title}
        </p>
        {artists && (
          <p className="tw-mb-0 tw-mt-1 tw-break-words tw-text-xs tw-text-iron-400">
            {artists}
          </p>
        )}
        {asset && (
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-500">
            {t(locale, `collect.collection.${asset.family}`)} · #
            {asset.token_id}
          </p>
        )}
      </div>
    </div>
  );
}
