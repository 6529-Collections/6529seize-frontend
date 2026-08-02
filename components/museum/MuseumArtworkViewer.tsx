"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CaseyArtwork } from "@/lib/museum/casey";

type ViewerMode = "still" | "live";
type LoadState = "loading" | "ready" | "error";

export function MuseumArtworkViewer({
  artwork,
}: {
  readonly artwork: CaseyArtwork;
}) {
  const [mode, setMode] = useState<ViewerMode>("still");
  const [stillState, setStillState] = useState<LoadState>("loading");
  const [liveState, setLiveState] = useState<LoadState>("loading");

  useEffect(() => {
    if (mode !== "live" || liveState !== "loading") {
      return;
    }

    const timeout = window.setTimeout(() => setLiveState("error"), 12_000);
    return () => window.clearTimeout(timeout);
  }, [liveState, mode]);

  const showStill = () => {
    setMode("still");
    setLiveState("loading");
  };

  return (
    <figure className="tw-m-0" aria-labelledby="museum-artwork-caption">
      <div className="tw-relative tw-aspect-square tw-w-full tw-overflow-hidden tw-bg-black">
        {mode === "still" && stillState !== "error" && (
          <Image
            src={artwork.imageUrl}
            alt={artwork.visualDescription}
            fill
            priority
            sizes="(min-width: 1024px) 72vw, 100vw"
            className={`tw-object-contain tw-transition-opacity tw-duration-300 motion-reduce:tw-transition-none ${
              stillState === "ready" ? "tw-opacity-100" : "tw-opacity-0"
            }`}
            onLoad={() => setStillState("ready")}
            onError={() => setStillState("error")}
            unoptimized
          />
        )}

        {mode === "still" && stillState === "loading" && (
          <div
            className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black tw-text-sm tw-text-iron-400"
            role="status"
          >
            Loading artwork
          </div>
        )}

        {mode === "still" && stillState === "error" && (
          <div
            className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-bg-black tw-p-8 tw-text-center"
            role="alert"
          >
            <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
              The upstream still is temporarily unavailable.
            </p>
            <p className="tw-m-0 tw-max-w-md tw-text-sm tw-leading-6 tw-text-iron-400">
              {artwork.visualDescription}
            </p>
            <a
              href={artwork.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:tw-text-primary-200 tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              Open the official Art Blocks still
            </a>
          </div>
        )}

        {mode === "live" && liveState !== "error" && (
          <iframe
            src={artwork.generatorUrl}
            title={`Live official Art Blocks presentation of ${artwork.title}`}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            loading="eager"
            className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-border-0 tw-bg-black"
            onLoad={() => setLiveState("ready")}
          />
        )}

        {mode === "live" && liveState === "loading" && (
          <div
            className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-bg-black/90 tw-p-3 tw-text-center tw-text-sm tw-text-iron-300"
            role="status"
          >
            Starting the official live presentation
          </div>
        )}

        {mode === "live" && liveState === "error" && (
          <div
            className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-bg-black tw-p-8 tw-text-center"
            role="alert"
          >
            <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
              The live presentation did not load.
            </p>
            <p className="tw-m-0 tw-max-w-md tw-text-sm tw-leading-6 tw-text-iron-400">
              Return to the still image or open the official generator in a new
              tab.
            </p>
            <button
              type="button"
              onClick={showStill}
              className="tw-min-h-11 tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-iron-400 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              Return to still image
            </button>
          </div>
        )}
      </div>

      <figcaption
        id="museum-artwork-caption"
        className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4"
      >
        <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
          <div className="tw-max-w-3xl">
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              {artwork.creditLine}{" "}
              {artwork.rightsUrl ? (
                <a
                  href={artwork.rightsUrl}
                  target="_blank"
                  rel="license noopener noreferrer"
                  className="tw-text-iron-200 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {artwork.rightsLabel}
                </a>
              ) : (
                artwork.rightsLabel
              )}
            </p>
            <p className="tw-m-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-500">
              Still and live presentation are loaded from the governed official
              Art Blocks URLs. The Museum has not yet published retained media
              bytes or an IIIF derivative for this work.
            </p>
          </div>
          <div className="tw-flex tw-shrink-0 tw-flex-wrap tw-gap-2">
            <button
              type="button"
              onClick={() => (mode === "live" ? showStill() : setMode("live"))}
              aria-pressed={mode === "live"}
              className="tw-min-h-11 tw-rounded-md tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
            >
              {mode === "live" ? "Return to still" : "View live work"}
            </button>
            <a
              href={mode === "live" ? artwork.generatorUrl : artwork.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline hover:tw-border-iron-400 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              Open official source
            </a>
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
