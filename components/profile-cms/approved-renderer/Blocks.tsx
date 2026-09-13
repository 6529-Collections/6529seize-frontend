import { t } from "@/i18n/messages";
import type { CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import { getCmsStudioBlockPresentation } from "@/lib/profile-cms/studio/presentation";
import { CmsInspectableArtwork } from "../CmsArtLightbox";
import { CmsBlock } from "../site-renderer/blocks";
import { getString } from "../site-renderer/data";
import { getArtInspectorLabels } from "../site-renderer/media";
import type { RendererContext } from "../site-renderer/types";
import ApprovedGallery from "./Gallery";
import ApprovedContact from "./Contact";
import ProjectMockup from "./ProjectMockup";
import ApprovedMediaImage from "./MediaImage";
import { getApprovedRows, getApprovedSection } from "./contract";
import { ApprovedLink } from "./links";
import { getApprovedMedia } from "./media";
import styles from "./approved.module.css";

export function ApprovedBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const role = getCmsStudioBlockPresentation(block).role;
  const variant = getApprovedSection(block).variant;
  switch (block.block_type) {
    case "heading": {
      const text = getString(block, "text");
      if (role === "kicker") return <p className={styles["kicker"]}>{text}</p>;
      if (role === "hero")
        return <h1 className={styles["heroTitle"]}>{text}</h1>;
      return <h2 className={styles["heading"]}>{text}</h2>;
    }
    case "rich_text":
      return (
        <div className={role === "kicker" ? styles["kicker"] : styles["prose"]}>
          {(getString(block, "content") ?? "")
            .split(/\n{2,}/)
            .map((paragraph, index) => (
              <p key={`${block.id}-${index}`}>{paragraph}</p>
            ))}
        </div>
      );
    case "image":
      return <ApprovedImage block={block} context={context} />;
    case "gallery":
    case "lightbox_gallery":
      return <ApprovedGallery key={block.id} block={block} context={context} />;
    case "button_link":
      return (
        <ApprovedLink
          context={context}
          pageId={getString(block, "page_id")}
          blockId={getString(block, "block_id")}
          subject={getString(block, "subject")}
          href={getString(block, "href") ?? getString(block, "url")}
          className={styles["textLink"]}
        >
          {getString(block, "label")} <span aria-hidden="true">↗</span>
        </ApprovedLink>
      );
    case "callout":
      if (
        variant === "project" &&
        role === "card" &&
        ["planner", "catalogue"].includes(
          getString(block, "mockup_style") ?? ""
        )
      )
        return <ProjectMockup block={block} context={context} />;
      return variant === "contact" ? (
        <ApprovedContact key={block.id} block={block} context={context} />
      ) : (
        <ApprovedCallout block={block} context={context} />
      );
    case "quote":
      return (
        <blockquote className={styles["quote"]}>
          <p>{getString(block, "quote")}</p>
          {getString(block, "citation") ? (
            <footer>{getString(block, "citation")}</footer>
          ) : null}
        </blockquote>
      );
    case "video":
    case "audio":
    case "nft_reference":
    case "collection_reference":
    case "transaction_reference":
    case "generated_wallet_gallery":
    case "deep_zoom":
    case "html_embed":
    case "object_viewer":
    case "room_viewer":
      return <CmsBlock block={block} context={context} />;
  }
}

function ApprovedImage({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const asset = context.assetMap.get(getString(block, "asset_id") ?? "");
  const media = getApprovedMedia(asset, context, getString(block, "title"));
  if (!media)
    return (
      <p className={styles["empty"]}>
        {t(context.locale, "profileCms.block.imageUnavailable")}
      </p>
    );
  const pageId = getString(block, "page_id");
  const caption = getString(block, "caption");
  return (
    <figure
      className={styles["image"]}
      data-pixel={media.pixelArt || undefined}
    >
      {pageId ? (
        <ApprovedLink context={context} pageId={pageId}>
          <ApprovedMediaImage media={media} />
        </ApprovedLink>
      ) : (
        <CmsInspectableArtwork
          item={{ ...media.item, caption: undefined, roleLabel: undefined }}
          previewSrc={media.src}
          labels={getArtInspectorLabels(context.locale)}
          className={styles["inspectable"]}
          frameClassName={styles["imageFrame"]}
          imageClassName={styles["imageElement"]}
        />
      )}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function ApprovedCallout({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const variant = getApprovedSection(block).variant;
  const rows = getApprovedRows(block);
  const assetId = getString(block, "asset_id");
  const asset = assetId
    ? getApprovedMedia(context.assetMap.get(assetId), context)
    : null;
  const title = getString(block, "title");
  const content = getString(block, "content");
  const rowFallback = rows
    .map((row) => (row.label ? `${row.label}: ${row.value}` : row.value))
    .join("\n");
  const showContent =
    !!content && (rows.length === 0 || content.trim() !== rowFallback);
  const collapsible =
    context.cmsPackage.site.theme.tokens?.["studio_design"] ===
      "organization-v2" &&
    variant === "note" &&
    !!title &&
    !!content &&
    !rows.length &&
    !asset;
  const posterStyle = getString(block, "poster_style");
  const body = (
    <div
      className={styles["callout"]}
      data-poster-style={
        posterStyle === "rings" || posterStyle === "ellipses"
          ? posterStyle
          : undefined
      }
    >
      {asset ? (
        <ApprovedMediaImage media={asset} className={styles["calloutImage"]} />
      ) : null}
      <div className={styles["calloutCopy"]}>
        {title && !collapsible ? <h2>{title}</h2> : null}
        {showContent ? (
          <div className={styles["prose"]}>
            {content.split(/\n{2,}/).map((text, index) => (
              <p key={`${block.id}-${index}`}>{text}</p>
            ))}
          </div>
        ) : null}
        {rows.length ? (
          <dl className={styles["rows"]} data-treatment={variant}>
            {rows.map((row, index) => (
              <div key={`${row.label}-${index}`}>
                <dt>{row.label}</dt>
                <dd>
                  {row.page_id ? (
                    <ApprovedLink context={context} pageId={row.page_id}>
                      {row.value} <span aria-hidden="true">↗</span>
                    </ApprovedLink>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
  return collapsible ? (
    <details className={styles["noteDisclosure"]}>
      <summary>{title}</summary>
      {body}
    </details>
  ) : (
    body
  );
}
