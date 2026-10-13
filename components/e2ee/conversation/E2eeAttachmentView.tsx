"use client";

import { ArrowDownTrayIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { isSafeInlineImageMime } from "@/lib/e2ee/media";
import type { E2eeAttachment, E2eeEngine } from "@/lib/e2ee/types";

const MAX_IMAGE_HEIGHT_PX = 320;

const isInlineImage = (attachment: E2eeAttachment) =>
  isSafeInlineImageMime(attachment.mime);

function formatFileSize(
  locale: ReturnType<typeof useBrowserLocale>,
  bytes: number
) {
  if (bytes >= 1024 * 1024) {
    return formatNumber(locale, bytes / (1024 * 1024), {
      style: "unit",
      unit: "megabyte",
      maximumFractionDigits: 1,
    });
  }
  return formatNumber(locale, Math.max(1, Math.round(bytes / 1024)), {
    style: "unit",
    unit: "kilobyte",
  });
}

interface AttachmentProps {
  readonly engine: E2eeEngine;
  readonly g: string;
  readonly messageId: string;
  readonly attachment: E2eeAttachment;
}

/** Decrypted image, loaded through the engine into a local object URL. */
function InlineImage({ engine, g, messageId, attachment }: AttachmentProps) {
  const locale = useBrowserLocale();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    engine
      .getAttachment(g, messageId, attachment.blob)
      .then((blob) => {
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [engine, g, messageId, attachment.blob]);

  const aspectStyle =
    attachment.width !== undefined &&
    attachment.height !== undefined &&
    attachment.width > 0 &&
    attachment.height > 0
      ? { aspectRatio: `${attachment.width} / ${attachment.height}` }
      : undefined;

  if (failed) {
    return (
      <span className="tw-text-xs tw-text-rose-300">
        {t(locale, "e2ee.message.attachment.failed", { name: attachment.name })}
      </span>
    );
  }
  if (!url) {
    return (
      <span
        role="status"
        style={aspectStyle}
        className="tw-flex tw-min-h-24 tw-w-48 tw-max-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-text-xs tw-text-iron-400"
      >
        <CircleLoader />
        <span className="tw-sr-only">
          {t(locale, "e2ee.message.attachment.loading")}
        </span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decrypted locally into a blob: URL; next/image cannot optimize it.
    <img
      src={url}
      alt={t(locale, "e2ee.message.attachment.imageAlt", {
        name: attachment.name,
      })}
      width={attachment.width}
      height={attachment.height}
      style={{ ...aspectStyle, maxHeight: MAX_IMAGE_HEIGHT_PX }}
      className="tw-h-auto tw-w-auto tw-max-w-full tw-rounded-lg tw-bg-iron-900 tw-object-contain"
    />
  );
}

/** File chip with an on-demand decrypt-and-download. */
function DownloadableFile({
  engine,
  g,
  messageId,
  attachment,
}: AttachmentProps) {
  const locale = useBrowserLocale();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const download = async () => {
    setPending(true);
    setFailed(false);
    try {
      const blob = await engine.getAttachment(g, messageId, attachment.blob);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = attachment.name;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      globalThis.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <span className="tw-inline-flex tw-max-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-2">
      <DocumentIcon
        aria-hidden="true"
        className="tw-size-5 tw-flex-shrink-0 tw-text-iron-400"
      />
      <span className="tw-flex tw-min-w-0 tw-flex-col">
        <span className="tw-truncate tw-text-sm tw-text-iron-100">
          {attachment.name}
        </span>
        <span className="tw-text-xs tw-text-iron-500">
          {formatFileSize(locale, attachment.size)}
        </span>
        {failed ? (
          <span role="alert" className="tw-text-xs tw-text-rose-300">
            {t(locale, "e2ee.message.attachment.failed", {
              name: attachment.name,
            })}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={() => void download()}
        disabled={pending}
        aria-label={t(locale, "e2ee.message.attachment.download", {
          name: attachment.name,
        })}
        className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
      >
        {pending ? (
          <CircleLoader />
        ) : (
          <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
        )}
      </button>
    </span>
  );
}

export function E2eeAttachmentView(props: AttachmentProps) {
  return isInlineImage(props.attachment) ? (
    <InlineImage {...props} />
  ) : (
    <DownloadableFile {...props} />
  );
}
