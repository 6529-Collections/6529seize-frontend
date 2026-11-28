"use client";

import { darkInputClassName } from "@/components/utils/input/dark-input-styles";
import { useState } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { MAX_MEDIA_BYTES, prepareMedia } from "@/lib/stream/content";
import { parseCap, parseRoyalty, type Draft } from "@/lib/stream/createDraft";

import { FIELD_LABEL, HINT } from "./createShared";
import { formatCount } from "./format";

export const EMPTY_DRAFT: Draft = {
  media: null,
  title: "",
  description: "",
  artistName: "",
  royalty: "6.529",
  editions: false,
  cap: "",
};

function mediaHint(busy: boolean, media: Draft["media"], locale: SupportedLocale): string {
  if (busy) return t(locale, "streamSepolia.create.artPreparing");
  if (!media) {
    return t(locale, "streamSepolia.create.artHelp", { max: formatCount(Math.floor(MAX_MEDIA_BYTES / 1024), locale) });
  }
  return t(locale, "streamSepolia.create.artSize", { size: formatCount(Math.ceil(media.bytes.length / 1024), locale) });
}

function MediaPicker({
  media,
  onChange,
}: {
  readonly media: Draft["media"];
  readonly onChange: (media: Draft["media"]) => void;
}) {
  const locale = useBrowserLocale();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <label htmlFor="stream-create-media" className={FIELD_LABEL}>
        {t(locale, "streamSepolia.create.art")}
      </label>
      <input
        id="stream-create-media"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="tw-block tw-w-full tw-text-sm tw-text-iron-300 file:tw-mr-3 file:tw-h-10 file:tw-cursor-pointer file:tw-rounded-lg file:tw-border-0 file:tw-bg-white/[0.07] file:tw-px-4 file:tw-text-sm file:tw-font-semibold file:tw-text-iron-100"
        aria-describedby="stream-create-media-hint"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const prepared = await prepareMedia(file);
            if (prepared) {
              onChange(prepared);
            } else {
              setError(t(locale, "streamSepolia.create.artTooLarge"));
              onChange(null);
            }
          } finally {
            setBusy(false);
          }
        }}
      />
      <p id="stream-create-media-hint" className={HINT}>
        {mediaHint(busy, media, locale)}
      </p>
      {error ? (
        <p role="alert" className="tw-m-0 tw-mt-1 tw-text-sm tw-text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EditionsField({
  draft,
  available,
  onChange,
}: {
  readonly draft: Draft;
  readonly available: boolean;
  readonly onChange: (patch: Partial<Draft>) => void;
}) {
  const locale = useBrowserLocale();
  const capValid = !draft.editions || parseCap(draft.cap) !== null;
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-p-3">
      <label className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-text-iron-100">
        <input
          type="checkbox"
          className="tw-mt-1 tw-accent-primary-500"
          checked={draft.editions}
          disabled={!available}
          onChange={(event) => onChange({ editions: event.target.checked })}
        />
        <span>
          <span className="tw-block tw-font-semibold">{t(locale, "streamSepolia.create.editions")}</span>
          <span className="tw-block tw-text-xs tw-text-iron-400">
            {available ? t(locale, "streamSepolia.create.editionsHelp") : t(locale, "streamSepolia.create.editionsNeedContract")}
          </span>
        </span>
      </label>
      {draft.editions ? (
        <div className="tw-mt-3 tw-max-w-xs">
          <label htmlFor="stream-create-cap" className={FIELD_LABEL}>
            {t(locale, "streamSepolia.create.cap")}
          </label>
          <input
            id="stream-create-cap"
            className={darkInputClassName}
            inputMode="numeric"
            value={draft.cap}
            aria-invalid={!capValid}
            aria-describedby="stream-create-cap-hint"
            onChange={(event) => onChange({ cap: event.target.value })}
          />
          <p id="stream-create-cap-hint" className={capValid ? HINT : `${HINT} tw-text-red`}>
            {t(locale, capValid ? "streamSepolia.create.capHelp" : "streamSepolia.create.capInvalid")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The work's fields. Shown and fillable without a wallet; the wallet is asked
 * for only when the steps start. Royalty is the artist's choice only on
 * Independent Stream (on 6529 Stream the network sets the terms).
 */
export function WorkForm({
  draft,
  onChange,
  withRoyalty,
  editionsAvailable,
  artistPlaceholder,
}: {
  readonly draft: Draft;
  readonly onChange: (patch: Partial<Draft>) => void;
  readonly withRoyalty: boolean;
  readonly editionsAvailable: boolean;
  readonly artistPlaceholder: string;
}) {
  const locale = useBrowserLocale();
  const royaltyValid = parseRoyalty(draft.royalty) !== null;
  return (
    <div className="tw-flex tw-flex-col tw-gap-5">
      <MediaPicker media={draft.media} onChange={(media) => onChange({ media })} />
      <div>
        <label htmlFor="stream-create-title" className={FIELD_LABEL}>
          {t(locale, "streamSepolia.create.titleField")}
        </label>
        <input
          id="stream-create-title"
          className={darkInputClassName}
          maxLength={80}
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </div>
      <div>
        <label htmlFor="stream-create-description" className={FIELD_LABEL}>
          {t(locale, "streamSepolia.create.description")}
        </label>
        <textarea
          id="stream-create-description"
          className={`${darkInputClassName} tw-h-24 tw-py-2.5`}
          maxLength={600}
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </div>
      <div className="tw-grid tw-gap-5 sm:tw-grid-cols-2">
        <div>
          <label htmlFor="stream-create-artist" className={FIELD_LABEL}>
            {t(locale, "streamSepolia.create.artistName")}
          </label>
          <input
            id="stream-create-artist"
            className={darkInputClassName}
            maxLength={48}
            placeholder={artistPlaceholder}
            value={draft.artistName}
            onChange={(event) => onChange({ artistName: event.target.value })}
          />
        </div>
        {withRoyalty ? (
          <div>
            <label htmlFor="stream-create-royalty" className={FIELD_LABEL}>
              {t(locale, "streamSepolia.create.royalty")}
            </label>
            <input
              id="stream-create-royalty"
              className={darkInputClassName}
              inputMode="decimal"
              value={draft.royalty}
              aria-invalid={!royaltyValid}
              aria-describedby="stream-create-royalty-hint"
              onChange={(event) => onChange({ royalty: event.target.value })}
            />
            <p id="stream-create-royalty-hint" className={HINT}>
              {t(locale, "streamSepolia.create.royaltyHelp")}
            </p>
          </div>
        ) : null}
      </div>
      <EditionsField draft={draft} available={editionsAvailable} onChange={onChange} />
    </div>
  );
}
