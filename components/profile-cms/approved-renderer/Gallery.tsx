"use client";

import { useState } from "react";

import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import { CmsInspectableArtwork } from "../CmsArtLightbox";
import { getString, getStringArray } from "../site-renderer/data";
import { getArtInspectorLabels } from "../site-renderer/media";
import type { RendererContext } from "../site-renderer/types";
import {
  getApprovedGalleryEntries,
  record,
  type ApprovedGalleryItem,
} from "./contract";
import { ApprovedLink } from "./links";
import { getApprovedMedia } from "./media";
import ApprovedMediaImage from "./MediaImage";
import styles from "./approved.module.css";

type GalleryCard = ApprovedGalleryItem & {
  readonly media: NonNullable<ReturnType<typeof getApprovedMedia>>;
  readonly key: string;
};

export default function ApprovedGallery({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"grid" | "list">("grid");
  const items = getApprovedGalleryEntries(block);
  const cards: GalleryCard[] = items.flatMap((item, occurrence) => {
    const media = getApprovedMedia(
      context.assetMap.get(item.asset_id),
      context,
      item.title
    );
    return media
      ? [{ ...item, media, key: `${item.asset_id}-${occurrence}` }]
      : [];
  });
  const presentCategories = cards.flatMap((item) =>
    item.category ? [item.category] : []
  );
  const categories = [
    ...new Set([
      ...getStringArray(block, "categories").filter((value) =>
        presentCategories.includes(value)
      ),
      ...presentCategories,
    ]),
  ];
  const modes = getStringArray(block, "display_modes");
  const searchable = record(block)["searchable"] === true;
  const filterable = searchable && categories.length > 1;
  const activeCategory = categories.includes(category) ? category : "";
  const term = query.trim().toLocaleLowerCase(context.locale);
  const visible = cards.filter(
    (item) =>
      (!activeCategory || item.category === activeCategory) &&
      (!term ||
        [item.title, item.subtitle, item.media.item.title, item.category]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase(context.locale)
          .includes(term))
  );
  const title = getString(block, "title");
  const description = getString(block, "description");
  const searchId = `${block.id}-search`;
  const clear = () => {
    setCategory("");
    setQuery("");
  };
  return (
    <div className={styles["gallery"]}>
      <GalleryHeading title={title} description={description} />
      {filterable || searchable || modes.includes("list") ? (
        <div className={styles["galleryTools"]}>
          {filterable ? (
            <div
              className={styles["filters"]}
              role="group"
              aria-label={title ?? t(context.locale, "profileCms.approved.all")}
            >
              <button
                type="button"
                aria-pressed={!activeCategory}
                onClick={() => setCategory("")}
              >
                {t(context.locale, "profileCms.approved.all")}
                <span>{formatNumber(context.locale, cards.length)}</span>
              </button>
              {categories.map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={activeCategory === value}
                  onClick={() => setCategory(value)}
                >
                  {value}
                  <span>
                    {formatNumber(
                      context.locale,
                      cards.filter((item) => item.category === value).length
                    )}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          <div className={styles["searchRow"]}>
            {searchable ? (
              <label htmlFor={searchId} className={styles["search"]}>
                <span>{t(context.locale, "profileCms.approved.search")}</span>
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            ) : null}
            <p className={styles["resultCount"]} role="status">
              {t(
                context.locale,
                visible.length === 1
                  ? "profileCms.approved.resultOne"
                  : "profileCms.approved.results",
                {
                  count: formatNumber(context.locale, visible.length),
                }
              )}
            </p>
            {modes.includes("list") ? (
              <div
                className={styles["viewModes"]}
                role="group"
                aria-label={t(context.locale, "profileCms.studio.preview")}
              >
                {(["grid", "list"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                  >
                    {t(context.locale, `profileCms.approved.${value}`)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {visible.length > 0 ? (
        <GalleryArtworks
          cards={visible}
          total={cards.length}
          mode={mode}
          context={context}
        />
      ) : (
        <div className={styles["empty"]}>
          <p>{t(context.locale, "profileCms.approved.noResults")}</p>
          <button type="button" onClick={clear}>
            {t(context.locale, "profileCms.approved.clear")}
          </button>
        </div>
      )}
    </div>
  );
}

function GalleryHeading({
  title,
  description,
}: {
  readonly title: string | undefined;
  readonly description: string | undefined;
}) {
  if (!title && !description) return null;
  return (
    <header className={styles["sectionHeading"]}>
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{description}</p> : null}
    </header>
  );
}

function GalleryArtworks({
  cards,
  total,
  mode,
  context,
}: {
  readonly cards: readonly GalleryCard[];
  readonly total: number;
  readonly mode: "grid" | "list";
  readonly context: RendererContext;
}) {
  let size: "pair" | "four" | undefined;
  if (total === 2) size = "pair";
  if (total === 4) size = "four";
  return (
    <div className={styles["artGrid"]} data-view={mode} data-size={size}>
      {cards.map((card) => (
        <article
          className={styles["artCard"]}
          data-pixel={card.media.pixelArt || undefined}
          key={card.key}
        >
          <GalleryArtwork card={card} context={context} />
        </article>
      ))}
    </div>
  );
}

function GalleryArtwork({
  card,
  context,
}: {
  readonly card: GalleryCard;
  readonly context: RendererContext;
}) {
  const caption = (
    <div className={styles["artCaption"]}>
      <h3>{card.title ?? card.media.item.title}</h3>
      {card.subtitle ? <p>{card.subtitle}</p> : null}
      {card.category ? <span>{card.category}</span> : null}
    </div>
  );
  if (card.page_id)
    return (
      <ApprovedLink
        context={context}
        pageId={card.page_id}
        className={styles["artLink"]}
      >
        <div className={styles["artFrame"]}>
          <ApprovedMediaImage media={card.media} />
        </div>
        {caption}
      </ApprovedLink>
    );
  return (
    <>
      <CmsInspectableArtwork
        item={{ ...card.media.item, caption: undefined, roleLabel: undefined }}
        previewSrc={card.media.src}
        labels={getArtInspectorLabels(context.locale)}
        className={styles["inspectable"]}
        frameClassName={styles["artFrame"]}
        imageClassName={styles["artImage"]}
      />
      {caption}
    </>
  );
}
