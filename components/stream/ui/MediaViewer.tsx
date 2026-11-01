"use client";

import Image from "next/image";
import { useState } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import {
  STREAM_BUTTON_PRIMARY,
  STREAM_CARD,
} from "@/components/stream/ui/styles";
import { decodeInlineHtml } from "@/lib/stream/media";
import type { MediaFileView } from "@/lib/stream/types";

const FRAME = `${STREAM_CARD} tw-relative tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden`;
const BUTTON = STREAM_BUTTON_PRIMARY;

/**
 * The sandbox for HTML and script works: scripts run in an opaque origin with
 * no access to the page, its storage, top-level navigation, popups or forms.
 */
const ARTWORK_SANDBOX = "allow-scripts";

function Fallback({ text }: { readonly text: string }) {
  return (
    <p className="tw-m-0 tw-max-w-xs tw-px-6 tw-text-center tw-text-sm tw-text-iron-400">
      {text}
    </p>
  );
}

function InteractiveWork({
  uri,
  preview,
  title,
  locale,
}: {
  readonly uri: string;
  readonly preview: string | null;
  readonly title: string;
  readonly locale: SupportedLocale;
}) {
  const [running, setRunning] = useState(false);
  const html = decodeInlineHtml(uri);
  const external = uri.startsWith("https://") ? uri : null;
  if (running && (html !== null || external !== null)) {
    return (
      <iframe
        title={t(locale, "stream.media.frameTitle", { title })}
        sandbox={ARTWORK_SANDBOX}
        referrerPolicy="no-referrer"
        className="tw-absolute tw-inset-0 tw-size-full tw-border-0"
        {...(html === null ? { src: external ?? "" } : { srcDoc: html })}
      />
    );
  }
  return (
    <>
      {preview === null ? null : (
        <Image
          src={preview}
          alt={t(locale, "stream.media.previewAlt", { title })}
          fill
          unoptimized
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="tw-object-contain tw-opacity-60"
        />
      )}
      {html === null && external === null ? (
        <Fallback text={t(locale, "stream.media.unavailable")} />
      ) : (
        <button
          type="button"
          className={`${BUTTON} tw-relative`}
          onClick={() => setRunning(true)}
        >
          {t(locale, "stream.media.run")}
        </button>
      )}
    </>
  );
}

function PrimaryMedia({
  file,
  preview,
  title,
  locale,
}: {
  readonly file: MediaFileView;
  readonly preview: string | null;
  readonly title: string;
  readonly locale: SupportedLocale;
}) {
  const uri = file.displayUri;
  if (uri === null) {
    return <Fallback text={t(locale, "stream.media.onChainOnly")} />;
  }
  switch (file.kind) {
    case "image":
      return (
        <Image
          src={uri}
          alt={t(locale, "stream.media.alt", { title })}
          fill
          unoptimized
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="tw-object-contain"
        />
      );
    case "video":
      return (
        <video
          src={uri}
          controls
          muted
          loop
          playsInline
          aria-label={t(locale, "stream.media.alt", { title })}
          className="tw-size-full tw-object-contain"
        />
      );
    case "audio":
      return (
        <audio
          src={uri}
          controls
          aria-label={t(locale, "stream.media.alt", { title })}
          className="tw-w-11/12"
        />
      );
    case "html":
    case "script":
      return (
        <InteractiveWork
          uri={uri}
          preview={preview}
          title={title}
          locale={locale}
        />
      );
    case "other":
      return <Fallback text={t(locale, "stream.media.unsupported")} />;
  }
}

/**
 * Shows a work's primary file: images and video inline, HTML and script works
 * in a sandboxed frame after the viewer chooses to run them.
 */
export default function MediaViewer({
  media,
  title,
  locale,
}: {
  readonly media: readonly MediaFileView[];
  readonly title: string;
  readonly locale: SupportedLocale;
}) {
  const primary = media.find((file) => file.role === "PRIMARY");
  const preview =
    media.find((file) => file.role === "PREVIEW")?.displayUri ?? null;
  return (
    <div className={FRAME}>
      {primary ? (
        <PrimaryMedia
          file={primary}
          preview={preview}
          title={title}
          locale={locale}
        />
      ) : (
        <Fallback text={t(locale, "stream.media.noRecord")} />
      )}
    </div>
  );
}
