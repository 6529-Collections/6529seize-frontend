import { CmsInspectableArtwork } from "./CmsArtLightbox";
import {
  formatCmsDate,
  getNumber,
  getRecord,
  getString,
  getStringArray,
} from "./site-renderer/data";
import { CmsLink } from "./site-renderer/links";
import { getArtInspectorLabels } from "./site-renderer/media";
import { createPagePreviewCard } from "./site-renderer/nftHelpers";
import type { PagePreviewCard, RendererContext } from "./site-renderer/types";
import type { CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

const LINK_CLASS =
  "tw-text-inherit tw-underline tw-underline-offset-4 hover:tw-opacity-70 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-current";

/** One linked card for every selected holding, including holdings without a preview. */
export function CmsStudioWalletContent({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const explicitIds = getStringArray(block, "page_ids");
  const pageIds =
    explicitIds.length > 0
      ? explicitIds
      : getStringArray(block, "featured_page_ids");
  const snapshot = getRecord(block, "snapshot");
  const capturedAt = getString(snapshot, "captured_at");
  const blockNumber = getNumber(snapshot, "block_number");
  const wallets = getStringArray(block, "wallets");
  return (
    <div className="tw-space-y-6">
      {block.block_type === "generated_wallet_gallery" ? (
        <div className="tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2 tw-text-xs tw-leading-6">
          <span>
            {t(
              context.locale,
              wallets.length === 1
                ? "profileCms.walletGallery.summary.one"
                : "profileCms.walletGallery.summary.many",
              { count: formatInteger(context.locale, wallets.length) }
            )}
          </span>
          {capturedAt ? (
            <span>
              {t(context.locale, "profileCms.provenance.capturedAt")}:{" "}
              {formatCmsDate(context.locale, capturedAt)}
            </span>
          ) : null}
          {blockNumber === undefined ? null : (
            <span>
              {t(context.locale, "profileCms.provenance.snapshotBlock")}:{" "}
              {formatInteger(context.locale, blockNumber)}
            </span>
          )}
        </div>
      ) : null}
      <CmsStudioPageGrid pageIds={pageIds} context={context} />
    </div>
  );
}

export function CmsStudioPageGrid({
  pageIds,
  context,
}: {
  readonly pageIds: readonly string[];
  readonly context: RendererContext;
}) {
  const cards = [...new Set(pageIds)]
    .map((id) => createPagePreviewCard(context, id))
    .filter((card): card is PagePreviewCard => card !== null);
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-x-7 tw-gap-y-10 @[40rem]/cms-studio:tw-grid-cols-2 @[64rem]/cms-studio:tw-grid-cols-3">
      {cards.map((card) => (
        <article key={card.page.id} className="tw-min-w-0 tw-space-y-3">
          {card.item ? (
            <CmsInspectableArtwork
              item={{ ...card.item, caption: undefined, roleLabel: undefined }}
              className="!tw-m-0 !tw-bg-transparent"
              frameClassName="!tw-aspect-auto !tw-bg-transparent"
              imageClassName="!tw-h-auto tw-max-h-96 tw-object-contain"
              labels={getArtInspectorLabels(context.locale)}
            />
          ) : (
            <div className="tw-flex tw-min-h-48 tw-items-center tw-justify-center tw-border tw-border-dashed tw-border-[color:var(--cms-line)] tw-p-6 tw-text-sm">
              {t(context.locale, "profileCms.block.imageUnavailable")}
            </div>
          )}
          <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-inherit">
            <CmsLink context={context} href={card.href} className={LINK_CLASS}>
              {card.page.metadata.navigation_label ?? card.page.metadata.title}
            </CmsLink>
          </h3>
        </article>
      ))}
    </div>
  );
}
