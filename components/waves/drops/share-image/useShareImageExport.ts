"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";

type ShareImageActionStatus =
  | "idle"
  | "working"
  | "copied"
  | "downloaded"
  | "shared"
  | "failed";

// A dark 1x1 pixel stands in for images that cannot be read cross-origin.
const IMAGE_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const PIXEL_RATIO = 2;

/** Renders the card to a PNG blob on the device. */
async function renderPng(node: HTMLElement): Promise<Blob> {
  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(node, {
    pixelRatio: PIXEL_RATIO,
    cacheBust: false,
    imagePlaceholder: IMAGE_PLACEHOLDER,
    backgroundColor: "#0e0e11",
  });
  if (!blob) {
    throw new Error("The image could not be rendered");
  }
  return blob;
}

/** Counts card images that the browser cannot read for the canvas. */
async function countUnreadableImages(node: HTMLElement): Promise<number> {
  const sources = Array.from(node.querySelectorAll("img"))
    .map((image) => image.currentSrc || image.src)
    .filter((source) => source !== "" && !source.startsWith("data:"));
  const results = await Promise.all(
    [...new Set(sources)].map(async (source) => {
      try {
        const response = await fetch(source, { mode: "cors" });
        return response.ok;
      } catch {
        return false;
      }
    })
  );
  return results.filter((ok) => !ok).length;
}

export function canCopyImages(): boolean {
  return (
    typeof ClipboardItem !== "undefined" &&
    typeof navigator !== "undefined" &&
    "clipboard" in navigator &&
    typeof navigator.clipboard.write === "function"
  );
}

export function canShareImageFiles(): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function"
  ) {
    return false;
  }
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({
      files: [new File([new Blob()], "check.png", { type: "image/png" })],
    });
  } catch {
    return false;
  }
}

/**
 * Copy, download and share for the share-as-image card. Every action renders
 * a fresh PNG from the card as it is now, so the image always matches the
 * preview. Nothing is uploaded.
 */
export function useShareImageExport({
  cardRef,
  fileName,
  isNativeApp,
  nativeDialogTitle,
  refreshKey,
}: {
  readonly cardRef: RefObject<HTMLDivElement | null>;
  readonly fileName: string;
  readonly isNativeApp: boolean;
  readonly nativeDialogTitle: string;
  /** Changes whenever the card's content changes. */
  readonly refreshKey: string;
}) {
  const [status, setStatus] = useState<ShareImageActionStatus>("idle");
  const [unreadableImages, setUnreadableImages] = useState(0);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    let active = true;
    void countUnreadableImages(node).then((count) => {
      if (active) setUnreadableImages(count);
    });
    return () => {
      active = false;
    };
  }, [cardRef, refreshKey]);

  const run = useCallback(
    async (
      action: (blob: Blob) => void | Promise<void>,
      success: ShareImageActionStatus
    ) => {
      const node = cardRef.current;
      if (!node) return;
      setStatus("working");
      try {
        await action(await renderPng(node));
        setStatus(success);
      } catch (error) {
        setStatus(
          error instanceof DOMException && error.name === "AbortError"
            ? "idle"
            : "failed"
        );
      }
    },
    [cardRef]
  );

  const copyImage = useCallback(() => {
    const node = cardRef.current;
    if (!node || !canCopyImages()) return;
    setStatus("working");
    // Safari needs the clipboard write to start inside the click, with the
    // image supplied as a promise.
    const blob = renderPng(node);
    navigator.clipboard
      .write([new ClipboardItem({ "image/png": blob })])
      .then(() => setStatus("copied"))
      .catch(() => setStatus("failed"));
  }, [cardRef]);

  const shareNative = useCallback(
    (blob: Blob) =>
      shareFetchedBlobInNativeApp(blob, fileName, {
        dialogTitle: nativeDialogTitle,
      }),
    [fileName, nativeDialogTitle]
  );

  const download = useCallback(() => {
    if (isNativeApp) {
      return run(shareNative, "shared");
    }
    return run((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.rel = "noopener";
      document.body.append(link);
      link.click();
      link.remove();
      globalThis.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }, "downloaded");
  }, [fileName, isNativeApp, run, shareNative]);

  const share = useCallback(() => {
    if (isNativeApp) {
      return run(shareNative, "shared");
    }
    return run(async (blob) => {
      const file = new File([blob], fileName, { type: "image/png" });
      await navigator.share({ files: [file] });
    }, "shared");
  }, [fileName, isNativeApp, run, shareNative]);

  return { status, unreadableImages, copyImage, download, share };
}
