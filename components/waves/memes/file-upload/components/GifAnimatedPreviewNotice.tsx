"use client";

import { useEffect, useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  GIF_ANIMATED_PREVIEW_MAX_FRAME_PIXELS,
  GIF_ANIMATED_PREVIEW_MAX_FRAMES,
  GIF_ANIMATED_PREVIEW_MAX_TOTAL_PIXELS,
  inspectGifAnimatedPreview,
  type GifAnimatedPreviewIssue,
} from "../utils/gifAnimationLimits";

interface GifAnimatedPreviewNoticeProps {
  /** The newly selected artwork file, if any. */
  readonly file: File | null;
}

/**
 * Explains the animated-preview limits for GIF artwork and warns when the
 * selected GIF is too large to get an animated preview.
 */
export default function GifAnimatedPreviewNotice({
  file,
}: GifAnimatedPreviewNoticeProps) {
  const locale = useBrowserLocale();
  const [inspected, setInspected] = useState<{
    readonly file: File;
    readonly issue: GifAnimatedPreviewIssue | null;
  } | null>(null);

  useEffect(() => {
    if (file?.type !== "image/gif") return;
    let cancelled = false;
    void inspectGifAnimatedPreview(file).then((issue) => {
      if (!cancelled) setInspected({ file, issue });
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const issue = inspected?.file === file ? inspected.issue : null;
  const format = (value: number) => formatInteger(locale, value);

  if (issue) {
    const { width, height, frames } = issue.info;
    const framePixels = width * height;
    let message: string;
    if (issue.kind === "framePixels") {
      message = t(locale, "memes.submission.media.gifPreview.framePixels", {
        width: format(width),
        height: format(height),
        pixels: format(framePixels),
        limit: format(GIF_ANIMATED_PREVIEW_MAX_FRAME_PIXELS),
      });
    } else if (issue.kind === "frames") {
      message = t(locale, "memes.submission.media.gifPreview.frames", {
        frames: format(frames),
        limit: format(GIF_ANIMATED_PREVIEW_MAX_FRAMES),
      });
    } else {
      message = t(locale, "memes.submission.media.gifPreview.totalPixels", {
        frames: format(frames),
        width: format(width),
        height: format(height),
        pixels: format(framePixels * frames),
        limit: format(GIF_ANIMATED_PREVIEW_MAX_TOTAL_PIXELS),
      });
    }

    return (
      <div
        role="status"
        data-testid="gif-animated-preview-warning"
        className="tw-mt-3 tw-flex tw-flex-shrink-0 tw-items-start tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/30 tw-bg-amber-500/10 tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-text-amber-200"
      >
        <ExclamationTriangleIcon
          className="tw-mt-0.5 tw-h-4 tw-w-4 tw-flex-shrink-0"
          aria-hidden="true"
        />
        <p className="tw-m-0">{message}</p>
      </div>
    );
  }

  return (
    <p className="tw-mb-0 tw-mt-3 tw-flex-shrink-0 tw-text-xs tw-leading-5 tw-text-iron-400">
      {t(locale, "memes.submission.media.gifPreview.guide", {
        pixels: format(GIF_ANIMATED_PREVIEW_MAX_FRAME_PIXELS),
        exampleWidth: format(2048),
        exampleHeight: format(4096),
        frames: format(GIF_ANIMATED_PREVIEW_MAX_FRAMES),
      })}
    </p>
  );
}
