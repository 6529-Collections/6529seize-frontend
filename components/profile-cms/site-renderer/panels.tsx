import type { ReactNode } from "react";

import { CmsInspectableArtwork } from "@/components/profile-cms/CmsArtLightbox";
import {
  getCmsArtGalleryFrameClassName,
  getCmsArtGalleryGridClassName,
  getCmsArtGalleryImageClassName,
  type CmsArtGridMode,
} from "@/components/profile-cms/cmsArtGalleryClasses";
import { t } from "@/i18n/messages";
import type { CmsAssetV1 } from "@/lib/profile-cms/protocol/v1";
import { getUniqueLabelValueRows } from "@/components/profile-cms/site-renderer/data";
import { CmsLink } from "@/components/profile-cms/site-renderer/links";
import {
  AssetImage,
  getArtInspectorLabels,
} from "@/components/profile-cms/site-renderer/media";
import { getPageTypeLabel } from "@/components/profile-cms/site-renderer/nftHelpers";
import type {
  PagePreviewCard,
  ReferenceMetadataItem,
  RendererContext,
} from "@/components/profile-cms/site-renderer/types";
import { EMPTY_REFERENCE_METADATA } from "@/components/profile-cms/site-renderer/types";

export function FeaturedPageGrid({
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

export function DefinitionGrid({
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

export function ReferencePanel({
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

export function InteractiveFallback({
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
