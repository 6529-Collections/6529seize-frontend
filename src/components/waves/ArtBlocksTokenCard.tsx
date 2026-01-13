"use client";

import { FocusTrap } from "focus-trap-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  fetchArtBlocksMeta,
  inferSeries,
  type ArtBlocksMeta,
} from "@/src/services/api/artblocks";
import {
  buildLiveUrl,
  buildMediaUrl,
  type ArtBlocksTokenIdentifier,
} from "@/src/services/artblocks/url";

interface ArtBlocksTokenCardProps {
  readonly href: string;
  readonly id: ArtBlocksTokenIdentifier;
}

const MEDIA_PLACEHOLDER: ReactNode = (
  <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-y-2 tw-rounded-xl tw-bg-gradient-to-br tw-from-iron-800 tw-via-iron-900 tw-to-iron-800">
    <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-semibold tw-text-iron-200">
      <span className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/10 tw-text-primary-300">
        AB
      </span>
      <span>Preview unavailable</span>
    </div>
    <span className="tw-text-xs tw-text-iron-400">Art Blocks media</span>
  </div>
);

const featuresLimit = 6;

const recordArtBlocksEvent = (
  eventName: string,
  detail: Record<string, unknown>
) => {
  if (typeof window === "undefined") {
    return;
  }

  const rum = (
    window as unknown as {
      awsRum?: { recordEvent?: Function | undefined } | undefined;
    }
  ).awsRum;
  if (rum && typeof rum.recordEvent === "function") {
    try {
      rum.recordEvent(eventName, detail);
    } catch {
      // ignore analytics errors silently
    }
  }
};

export default function ArtBlocksTokenCard({
  href,
  id,
}: ArtBlocksTokenCardProps) {
  const [meta, setMeta] = useState<ArtBlocksMeta | null>(null);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const openedAtRef = useRef<number | null>(null);

  const eventPayload = useMemo(
    () => ({ href, tokenId: id.tokenId, contract: id.contract }),
    [href, id.contract, id.tokenId]
  );

  useEffect(() => {
    recordArtBlocksEvent("ab_card_impression", eventPayload);
  }, [eventPayload]);

  useEffect(() => {
    setMeta(null);
    setMetaLoaded(false);
    setImgError(false);
    setShowAllFeatures(false);

    const controller = new AbortController();

    fetchArtBlocksMeta(
      { contract: id.contract, tokenId: id.tokenId },
      controller.signal
    )
      .then((data) => {
        setMeta(data);
      })
      .catch((error) => {
        if (!(error instanceof Error) || error.name !== "AbortError") {
          setMeta(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setMetaLoaded(true);
        }
      });

    return () => {
      controller.abort();
    };
  }, [id.contract, id.tokenId]);

  const headerTitle = meta?.projectName ?? "Art Blocks";
  const headerToken = meta?.tokenNumber ?? id.tokenId;
  const artistName = meta?.artistName ?? "Unknown";
  const resolvedSeries = meta
    ? (meta.series ?? inferSeries(id.contract))
    : undefined;
  const aspectRatio =
    meta?.aspectRatio && meta.aspectRatio > 0 ? meta.aspectRatio : 1;

  const features = useMemo(() => {
    if (!meta?.features) {
      return [] as Array<[string, string]>;
    }

    return Object.entries(meta.features).sort(([a], [b]) => a.localeCompare(b));
  }, [meta?.features]);

  const displayedFeatures = showAllFeatures
    ? features
    : features.slice(0, featuresLimit);
  const remainingFeatures = features.length - displayedFeatures.length;

  const altText = `${headerTitle ?? "Art Blocks token"} #${headerToken} by ${artistName}`;
  const mediaUrl = buildMediaUrl({
    contract: id.contract,
    tokenId: id.tokenId,
  });
  const liveUrl = buildLiveUrl({ contract: id.contract, tokenId: id.tokenId });

  const handleCloseLive = useCallback(() => {
    if (!showLive) {
      return;
    }

    setShowLive(false);

    const openedAt = openedAtRef.current;
    const dwell =
      typeof openedAt === "number" ? Math.max(Date.now() - openedAt, 0) : 0;
    openedAtRef.current = null;

    recordArtBlocksEvent("ab_card_live_open", {
      ...eventPayload,
      dwell_ms: dwell,
    });

    const focusTarget = lastTriggerRef.current;
    lastTriggerRef.current = null;
    if (focusTarget) {
      focusTarget.focus();
    }
  }, [eventPayload, showLive]);

  const openLiveViewer = useCallback(
    (trigger: HTMLElement | null) => {
      if (showLive) {
        handleCloseLive();
        return;
      }

      if (trigger) {
        lastTriggerRef.current = trigger;
      }

      openedAtRef.current = Date.now();
      recordArtBlocksEvent("ab_card_link_out", {
        ...eventPayload,
        target: "viewer",
      });
      setShowLive(true);
    },
    [eventPayload, handleCloseLive, showLive]
  );

  useEffect(() => {
    if (!showLive) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCloseLive();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [handleCloseLive, showLive]);

  useEffect(() => {
    if (showLive && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [showLive]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        handleCloseLive();
      }
    },
    [handleCloseLive]
  );

  const handleAnchorClick = useCallback(() => {
    recordArtBlocksEvent("ab_card_link_out", {
      ...eventPayload,
      target: "artblocks",
    });
  }, [eventPayload]);

  return (
    <div
      className="tw-flex tw-h-full tw-w-full tw-flex-col tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-900 tw-shadow-lg"
      style={{ contain: "content" }}
    >
      <div className="tw-flex tw-flex-col tw-gap-y-4 tw-p-4">
        <div className="tw-flex tw-flex-col tw-gap-y-2">
          {metaLoaded ? (
            <div className="tw-flex tw-flex-col tw-gap-y-1">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <h3 className="tw-truncate tw-text-base tw-font-semibold tw-text-iron-100">
                  {headerTitle} #{headerToken}
                </h3>
                {resolvedSeries && (
                  <span className="tw-ml-auto tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/10 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
                    {resolvedSeries}
                  </span>
                )}
              </div>
              <p className="tw-text-sm tw-font-medium tw-text-iron-400">
                by {artistName}
              </p>
            </div>
          ) : (
            <div className="tw-flex tw-animate-pulse tw-flex-col tw-gap-y-2">
              <div className="tw-h-5 tw-w-48 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-iron-800" />
            </div>
          )}
        </div>

        <button
          type="button"
          className="tw-relative tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          onClick={(event) => openLiveViewer(event.currentTarget)}
          aria-label="View live render on Art Blocks"
          aria-expanded={showLive}
        >
          <div className="tw-relative tw-block tw-aspect-square tw-w-full tw-bg-iron-800">
            {!imgError ? (
              <img
                src={mediaUrl}
                alt={altText}
                loading="lazy"
                className="tw-h-full tw-w-full tw-object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              MEDIA_PLACEHOLDER
            )}
            {!metaLoaded && (
              <div className="tw-absolute tw-inset-0 tw-bg-iron-900/30">
                <div className="tw-absolute tw-inset-0 tw-animate-pulse tw-bg-iron-800 tw-opacity-70" />
              </div>
            )}
          </div>
        </button>

        {metaLoaded && features.length > 0 && (
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              Features
            </span>
            <div className="tw-grid tw-grid-cols-1 tw-gap-2 md:tw-grid-cols-2">
              {displayedFeatures.map(([trait, value]) => (
                <div
                  key={trait}
                  className="tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2"
                >
                  <div className="tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                    {trait}
                  </div>
                  <div
                    className="tw-truncate tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-100"
                    title={value}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
            {remainingFeatures > 0 && !showAllFeatures && (
              <button
                type="button"
                className="tw-self-start tw-text-xs tw-font-semibold tw-text-primary-300 hover:tw-text-primary-300"
                onClick={() => setShowAllFeatures(true)}
              >
                +{remainingFeatures} more
              </button>
            )}
          </div>
        )}
      </div>

      <div className="tw-mt-auto tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-border-t tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-3">
        <button
          type="button"
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition hover:tw-bg-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300"
          aria-label="View live render on Art Blocks"
          aria-expanded={showLive}
          onClick={(event) => openLiveViewer(event.currentTarget)}
        >
          View live
        </button>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition hover:tw-border-primary-400 hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          aria-label="Open this token on Art Blocks"
          onClick={handleAnchorClick}
        >
          Open on Art Blocks
        </a>
      </div>

      {showLive && (
        <FocusTrap active={showLive}>
          <div
            className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/60 tw-p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${headerTitle} live view`}
            onClick={handleBackdropClick}
          >
            <div className="tw-relative tw-flex tw-w-full tw-max-w-5xl tw-flex-col tw-gap-y-3 tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-shadow-xl">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-flex-col">
                  <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
                    {headerTitle} #{headerToken}
                  </span>
                  <span className="tw-text-xs tw-text-iron-400">
                    Live render
                  </span>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-transparent tw-text-iron-200 hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                  aria-label="Close live render"
                  onClick={handleCloseLive}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div
                className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-black"
                style={{ aspectRatio, maxHeight: "80vh" }}
              >
                <iframe
                  title={`${headerTitle} live render`}
                  src={liveUrl}
                  className="tw-h-full tw-w-full"
                  sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                  referrerPolicy="no-referrer"
                  allow="autoplay; encrypted-media"
                />
              </div>
            </div>
          </div>
        </FocusTrap>
      )}
    </div>
  );
}
