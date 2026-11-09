"use client";

import { forwardRef, useEffect } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useEmoji } from "@/contexts/EmojiContext";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import type { ClipboardMessage } from "@/helpers/waves/drop-clipboard.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  formatShareImageDateLine,
  formatShareImagePostTime,
  type ShareImageTimeOption,
} from "@/lib/share-drops-image/shareDropsImageFormat";

export interface ShareImageInclude {
  readonly waveHeader: boolean;
  readonly reactions: boolean;
}

/** Width in CSS pixels; the PNG is rendered at twice this. */
export const SHARE_IMAGE_WIDTH = 540;
const MAX_TEXT_CHARS = 1200;

function firstImage(drop: ExtendedDrop) {
  for (const part of drop.parts) {
    for (const media of part.media) {
      if (media.mime_type.startsWith("image/")) return media;
    }
  }
  return null;
}

function hasOtherMedia(drop: ExtendedDrop): boolean {
  return drop.parts.some((part) =>
    part.media.some((media) => !media.mime_type.startsWith("image/"))
  );
}

function truncate(text: string): string {
  return text.length > MAX_TEXT_CHARS
    ? `${text.slice(0, MAX_TEXT_CHARS).trimEnd()}…`
    : text;
}

/**
 * The picture of the chosen posts. It shows only what every member of the
 * wave sees: authors, levels, text, media and reaction counts. The viewer's
 * own state (unread line, badges, their reaction highlight) is never drawn.
 */
const ShareDropsImageCard = forwardRef<
  HTMLDivElement,
  {
    readonly wave: ApiWave;
    readonly drops: readonly ExtendedDrop[];
    /** Plain text of each post, in the same order as `drops`. */
    readonly messages: readonly ClipboardMessage[];
    readonly time: ShareImageTimeOption;
    readonly include: ShareImageInclude;
    readonly locale: SupportedLocale;
  }
>(function ShareDropsImageCard(
  { wave, drops, messages, time, include, locale },
  ref
) {
  const { findNativeEmoji, loadEmojiData } = useEmoji();
  useEffect(() => {
    void loadEmojiData();
  }, [loadEmojiData]);

  const firstAt = drops[0]?.created_at ?? 0;
  const lastAt = drops.at(-1)?.created_at ?? firstAt;
  const dateLine = formatShareImageDateLine(firstAt, lastAt, time, locale, {
    elapsed: t(locale, "shareImage.time.elapsedLabel"),
    hidden: t(locale, "shareImage.time.hiddenLabel"),
  });

  return (
    <div
      ref={ref}
      style={{ width: SHARE_IMAGE_WIDTH }}
      className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-[#222228] tw-bg-[#0e0e11] tw-text-left tw-font-sans tw-text-iron-50"
    >
      {include.waveHeader && (
        <div className="tw-flex tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-[#1f1f25] tw-px-5 tw-pb-3.5 tw-pt-[18px]">
          {wave.picture ? (
            <img
              src={getScaledImageUri(wave.picture, ImageScale.W_200_H_200)}
              alt=""
              crossOrigin="anonymous"
              className="tw-size-9 tw-flex-shrink-0 tw-rounded-full tw-object-cover"
            />
          ) : (
            <span className="tw-size-9 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800" />
          )}
          <div className="tw-min-w-0">
            <p className="tw-m-0 tw-truncate tw-text-[15px] tw-font-semibold">
              {wave.name}
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">{dateLine}</p>
          </div>
        </div>
      )}
      <ol className="tw-m-0 tw-list-none tw-px-1.5 tw-py-2">
        {drops.map((drop, index) => {
          const message = messages[index];
          const image = firstImage(drop);
          const timeLabel = formatShareImagePostTime(
            drop.created_at,
            firstAt,
            time,
            locale
          );
          const handle = drop.author.handle ?? drop.author.primary_address;
          const text = truncate(message?.plainContent ?? "");
          return (
            <li key={drop.id} className="tw-flex tw-gap-3 tw-px-3.5 tw-py-2">
              {drop.author.pfp ? (
                <img
                  src={getScaledImageUri(
                    drop.author.pfp,
                    ImageScale.W_200_H_200
                  )}
                  alt=""
                  crossOrigin="anonymous"
                  className="tw-size-10 tw-flex-shrink-0 tw-rounded-[10px] tw-object-cover"
                />
              ) : (
                <span className="tw-size-10 tw-flex-shrink-0 tw-rounded-[10px] tw-bg-iron-800" />
              )}
              <div className="tw-min-w-0 tw-flex-1">
                <p className="tw-m-0 tw-flex tw-items-center tw-gap-1.5 tw-text-sm">
                  <span className="tw-truncate tw-font-semibold">{handle}</span>
                  <span className="tw-flex tw-size-[19px] tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-[1.5px] tw-border-solid tw-border-[#3CCB7F] tw-text-[9px] tw-font-bold tw-text-[#3CCB7F]">
                    {drop.author.level}
                  </span>
                  {timeLabel && (
                    <span className="tw-whitespace-nowrap tw-text-xs tw-text-white/40">
                      · {timeLabel}
                    </span>
                  )}
                </p>
                {text && (
                  <p className="tw-m-0 tw-mt-1 tw-whitespace-pre-line tw-break-words tw-text-sm tw-leading-5 tw-text-[#dcdce1]">
                    {text}
                  </p>
                )}
                {image && (
                  <img
                    src={getScaledImageUri(image.url, ImageScale.AUTOx800)}
                    alt=""
                    crossOrigin="anonymous"
                    className="tw-mt-2 tw-block tw-max-h-72 tw-max-w-full tw-rounded-[10px] tw-object-contain"
                  />
                )}
                {hasOtherMedia(drop) && (
                  <p className="tw-m-0 tw-mt-2 tw-rounded-[10px] tw-border tw-border-dashed tw-border-iron-700 tw-px-3 tw-py-2 tw-text-xs tw-text-iron-400">
                    {t(locale, "shareImage.card.mediaNotShown")}
                  </p>
                )}
                {include.reactions && drop.reactions.length > 0 && (
                  <p className="tw-m-0 tw-mt-2 tw-flex tw-flex-wrap tw-gap-1.5">
                    {drop.reactions.map((reaction) => {
                      const id = reaction.reaction.replaceAll(":", "");
                      const native = findNativeEmoji(id)?.skins[0]?.native;
                      return (
                        <span
                          key={reaction.reaction}
                          className="tw-inline-flex tw-h-6 tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-2 tw-text-xs tw-text-iron-300"
                        >
                          <span>{native ?? reaction.reaction}</span>
                          <span>
                            {formatInteger(locale, reaction.profiles.length)}
                          </span>
                        </span>
                      );
                    })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="tw-flex tw-items-center tw-justify-between tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-[#1f1f25] tw-px-5 tw-py-3 tw-text-[11px] tw-text-iron-500">
        <span className="tw-text-xs tw-font-semibold tw-text-iron-300">
          6529.io
        </span>
        <span>
          {drops.length === 1
            ? t(locale, "shareImage.card.countOne")
            : t(locale, "shareImage.card.countOther", { count: drops.length })}
        </span>
      </div>
    </div>
  );
});

export default ShareDropsImageCard;
