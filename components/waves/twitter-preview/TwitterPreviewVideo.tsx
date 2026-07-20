"use client";

import {
  ArrowLeftIcon,
  CheckIcon,
  Cog6ToothIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import * as Sentry from "@sentry/nextjs";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import type HlsType from "hls.js";

import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";
import type { SeizeVideoTemplate } from "@/components/drops/view/item/content/media/SeizeVideoPlayer.config";
import type {
  TweetPreviewMedia,
  TweetPreviewVideoVariant,
} from "@/lib/twitter";

function stopCardEvent(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
}

type VideoQualitySelection =
  | { readonly type: "auto" }
  | { readonly type: "variant"; readonly url: string };

interface VideoQualityOption {
  readonly id: string;
  readonly label: string;
  readonly selection: VideoQualitySelection;
}

function stopMediaEvent(event: SyntheticEvent<HTMLElement>) {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
}

function readObjectRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function formatBitrate(value: number): string {
  if (value >= 1_000_000) {
    const mbps = value / 1_000_000;
    return `${Number.isInteger(mbps) ? mbps.toFixed(0) : mbps.toFixed(1)} Mbps`;
  }

  return `${Math.round(value / 1000)} Kbps`;
}

function getVideoVariantLabel(
  variant: TweetPreviewVideoVariant,
  variants: readonly TweetPreviewVideoVariant[],
  index: number
): string {
  if (variant.quality) {
    const qualityLabel = `${variant.quality}p`;
    const hasDuplicateQuality =
      variants.filter((candidate) => candidate.quality === variant.quality)
        .length > 1;
    if (hasDuplicateQuality && variant.bitrate) {
      return `${qualityLabel} ${formatBitrate(variant.bitrate)}`;
    }

    return qualityLabel;
  }

  if (variant.width && variant.height) {
    return `${variant.width}x${variant.height}`;
  }

  if (variant.bitrate) {
    return formatBitrate(variant.bitrate);
  }

  return `Option ${index + 1}`;
}

function buildVideoVariantOptions(
  videoUrl: string,
  variants: readonly TweetPreviewVideoVariant[] | undefined,
  hlsUrl: string | undefined
): readonly TweetPreviewVideoVariant[] {
  if (!variants || variants.length === 0) {
    if (videoUrl === hlsUrl) {
      return [];
    }
    return [{ url: videoUrl }];
  }

  if (variants.some((variant) => variant.url === videoUrl)) {
    return variants;
  }

  return [{ url: videoUrl }, ...variants];
}

function buildVideoQualityOptions({
  hlsUrl,
  variants,
  videoUrl,
}: {
  readonly hlsUrl: string | undefined;
  readonly variants: readonly TweetPreviewVideoVariant[] | undefined;
  readonly videoUrl: string;
}): readonly VideoQualityOption[] {
  const manualOptions = buildVideoVariantOptions(
    videoUrl,
    variants,
    hlsUrl
  ).map((variant, index, allVariants) => ({
    id: variant.url,
    label: getVideoVariantLabel(variant, allVariants, index),
    selection: { type: "variant" as const, url: variant.url },
  }));

  if (hlsUrl) {
    return [
      { id: "auto", label: "Auto", selection: { type: "auto" } },
      ...manualOptions,
    ];
  }

  return manualOptions;
}

function getDefaultQualitySelection(
  hlsUrl: string | undefined,
  videoUrl: string
): VideoQualitySelection {
  if (hlsUrl) {
    return { type: "auto" };
  }

  return { type: "variant", url: videoUrl };
}

function getQualitySelectionId(selection: VideoQualitySelection): string {
  if (selection.type === "auto") {
    return "auto";
  }

  return selection.url;
}

function isHlsSource(selection: VideoQualitySelection): boolean {
  return selection.type === "auto";
}

function getVideoSource(
  selection: VideoQualitySelection,
  hlsUrl: string | undefined,
  fallbackUrl: string
): string {
  if (selection.type === "auto") {
    return hlsUrl ?? fallbackUrl;
  }

  return selection.url;
}

function updateAutoQualityFromHlsEvent(
  hls: HlsType,
  data: unknown,
  onAutoQualityChange: (quality: number | undefined) => void
) {
  const levelIndex = readHlsEventLevelIndex(data);
  if (levelIndex === undefined) {
    onAutoQualityChange(undefined);
    return;
  }

  onAutoQualityChange(readHlsLevelQuality(hls.levels[levelIndex]));
}

function isFatalHlsError(data: unknown): boolean {
  const record = readObjectRecord(data);
  return record?.["fatal"] === true;
}

async function setupHlsSource(
  videoElement: HTMLVideoElement,
  src: string,
  hlsRef: { current: HlsType | null },
  onAutoQualityChange: (quality: number | undefined) => void,
  onFatalError: () => void,
  isCancelled: () => boolean
): Promise<boolean> {
  if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
    if (isCancelled()) {
      return false;
    }
    videoElement.src = src;
    videoElement.load();
    onAutoQualityChange(undefined);
    return true;
  }

  const mod = await import("hls.js");
  if (isCancelled()) {
    return false;
  }

  const HlsConstructor = mod.default;
  if (HlsConstructor.isSupported()) {
    const hls = new HlsConstructor({
      startLevel: -1,
      enableWorker: true,
    });
    if (isCancelled()) {
      hls.destroy();
      return false;
    }
    hlsRef.current = hls;
    const handleQualityEvent = (_event: unknown, data: unknown) => {
      updateAutoQualityFromHlsEvent(hls, data, onAutoQualityChange);
    };
    const cleanupHls = () => {
      hls.off(HlsConstructor.Events.LEVEL_SWITCHED, handleQualityEvent);
      hls.off(HlsConstructor.Events.FRAG_CHANGED, handleQualityEvent);
      hls.off(HlsConstructor.Events.ERROR, handleErrorEvent);
      hls.destroy();
      if (hlsRef.current === hls) {
        hlsRef.current = null;
      }
    };
    const handleErrorEvent = (_event: unknown, data: unknown) => {
      if (!isFatalHlsError(data) || isCancelled()) {
        return;
      }

      cleanupHls();
      if (isCancelled()) {
        return;
      }

      onAutoQualityChange(undefined);
      onFatalError();
    };
    hls.on(HlsConstructor.Events.LEVEL_SWITCHED, handleQualityEvent);
    hls.on(HlsConstructor.Events.FRAG_CHANGED, handleQualityEvent);
    hls.on(HlsConstructor.Events.ERROR, handleErrorEvent);
    hls.loadSource(src);
    hls.attachMedia(videoElement);
    return true;
  }

  return false;
}

function readHlsEventLevelIndex(value: unknown): number | undefined {
  const record = readObjectRecord(value);
  if (record) {
    const level = record["level"];
    if (typeof level === "number" && Number.isFinite(level)) {
      return level;
    }

    const frag = readObjectRecord(record["frag"]);
    if (frag) {
      const fragLevel = frag["level"];
      if (typeof fragLevel === "number" && Number.isFinite(fragLevel)) {
        return fragLevel;
      }
    }
  }

  return undefined;
}

function readHlsLevelQuality(level: unknown): number | undefined {
  const record = readObjectRecord(level);
  if (record) {
    const width =
      typeof record["width"] === "number" ? record["width"] : undefined;
    const height =
      typeof record["height"] === "number" ? record["height"] : undefined;
    return width && height ? Math.min(width, height) : undefined;
  }

  return undefined;
}

function snapshotVideoPlayback(videoElement: HTMLVideoElement): {
  readonly currentTime: number;
  readonly wasPlaying: boolean;
} {
  return {
    currentTime: videoElement.currentTime,
    wasPlaying: !videoElement.paused && !videoElement.ended,
  };
}

function handleVideoPlaybackRestoreError(error: unknown): void {
  if (readObjectRecord(error)?.["name"] === "AbortError") {
    return;
  }

  Sentry.captureException(error);
}

function restoreVideoPlayback(
  videoElement: HTMLVideoElement,
  snapshot: { readonly currentTime: number; readonly wasPlaying: boolean },
  isCancelled: () => boolean
): void {
  const restore = () => {
    if (isCancelled()) {
      return;
    }

    if (Number.isFinite(snapshot.currentTime) && snapshot.currentTime > 0) {
      videoElement.currentTime = Math.min(
        snapshot.currentTime,
        videoElement.duration || snapshot.currentTime
      );
    }

    if (snapshot.wasPlaying) {
      void videoElement.play().catch(handleVideoPlaybackRestoreError);
    }
  };

  if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
    restore();
    return;
  }

  videoElement.addEventListener("loadedmetadata", restore, { once: true });
}

function VideoQualityMenu({
  autoQuality,
  isOpen,
  onClose,
  onSelect,
  options,
  selection,
}: {
  readonly autoQuality: number | undefined;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelect: (selection: VideoQualitySelection) => void;
  readonly options: readonly VideoQualityOption[];
  readonly selection: VideoQualitySelection;
}) {
  if (!isOpen) {
    return null;
  }

  const selectedId = getQualitySelectionId(selection);
  return (
    <dialog
      open
      className="tw-absolute tw-left-auto tw-right-3 tw-top-11 tw-z-30 tw-m-0 tw-w-fit tw-min-w-40 tw-max-w-[calc(100%-1.5rem)] tw-overflow-hidden tw-rounded-xl tw-border-0 tw-bg-[#171717] tw-px-1.5 tw-pb-1.5 tw-pt-0 tw-text-white tw-shadow-xl"
      aria-label="Video quality"
    >
      <span
        aria-hidden="true"
        className="tw-absolute tw-right-8 tw-top-[-7px] tw-h-0 tw-w-0 tw-border-x-8 tw-border-b-8 tw-border-x-transparent tw-border-b-[#171717]"
      />
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-py-2">
        <button
          type="button"
          aria-label="Close video quality"
          onClick={(event) => {
            stopMediaEvent(event);
            onClose();
          }}
          className="tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white hover:tw-bg-white/10 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          <ArrowLeftIcon className="tw-h-4 tw-w-4" />
        </button>
        <span className="tw-text-xs tw-font-semibold tw-leading-6 tw-text-white">
          Video quality
        </span>
      </div>
      <div
        className="tw-rounded-lg tw-bg-black tw-px-2.5 tw-py-2"
        role="radiogroup"
        aria-label="Video quality"
      >
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={(event) => {
                stopMediaEvent(event);
                onSelect(option.selection);
                onClose();
              }}
              className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-5 tw-border-0 tw-bg-transparent tw-px-1 tw-py-1.5 tw-text-left tw-text-[13px] tw-font-semibold tw-text-white hover:tw-bg-white/10"
            >
              <span>
                {option.label}
                {option.id === "auto" && autoQuality && (
                  <span className="tw-ml-1 tw-text-iron-400">
                    ({autoQuality}p)
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                className={`tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-solid ${
                  isSelected
                    ? "tw-border-[#1d9bf0] tw-bg-[#1d9bf0]"
                    : "tw-border-iron-500"
                }`}
              >
                {isSelected && <CheckIcon className="tw-h-3.5 tw-w-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
    </dialog>
  );
}

function TwitterVideoPlayer({
  allowQualitySelection = true,
  autoPlay,
  captionsUrl,
  className,
  hlsUrl,
  muted,
  posterUrl,
  template = "watch-media",
  variants,
  videoUrl,
}: {
  readonly allowQualitySelection?: boolean;
  readonly autoPlay?: boolean;
  readonly captionsUrl: string | undefined;
  readonly className: string;
  readonly hlsUrl: string | undefined;
  readonly muted?: boolean;
  readonly posterUrl: string | undefined;
  readonly template?: SeizeVideoTemplate;
  readonly variants: readonly TweetPreviewVideoVariant[] | undefined;
  readonly videoUrl: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const fallbackPlaybackSnapshotRef = useRef<{
    readonly currentTime: number;
    readonly wasPlaying: boolean;
  } | null>(null);
  const qualitySwitchSnapshotRef = useRef<{
    readonly currentTime: number;
    readonly wasPlaying: boolean;
  } | null>(null);
  const previousSourceRef = useRef({ hlsUrl, videoUrl });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentAutoQuality, setCurrentAutoQuality] = useState<
    number | undefined
  >(undefined);
  const [selection, setSelection] = useState<VideoQualitySelection>(() =>
    getDefaultQualitySelection(hlsUrl, videoUrl)
  );
  const qualityOptions = useMemo(
    () => buildVideoQualityOptions({ hlsUrl, variants, videoUrl }),
    [hlsUrl, variants, videoUrl]
  );

  useEffect(() => {
    const previousSource = previousSourceRef.current;
    if (
      previousSource.hlsUrl === hlsUrl &&
      previousSource.videoUrl === videoUrl
    ) {
      return;
    }

    previousSourceRef.current = { hlsUrl, videoUrl };
    setSelection(getDefaultQualitySelection(hlsUrl, videoUrl));
    setIsMenuOpen(false);
  }, [hlsUrl, videoUrl]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    let cancelled = false;
    const playbackSnapshot =
      qualitySwitchSnapshotRef.current ??
      fallbackPlaybackSnapshotRef.current ??
      snapshotVideoPlayback(videoElement);
    qualitySwitchSnapshotRef.current = null;
    fallbackPlaybackSnapshotRef.current = null;
    const destroyHls = () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
    const loadFallbackSource = () => {
      fallbackPlaybackSnapshotRef.current = playbackSnapshot;
      setSelection({ type: "variant", url: videoUrl });
      setCurrentAutoQuality(undefined);
    };
    const playSelectedSource = () => {
      if (autoPlay) {
        videoElement.play().catch(() => undefined);
      }
    };

    destroyHls();
    const src = getVideoSource(selection, hlsUrl, videoUrl);

    if (isHlsSource(selection) && hlsUrl) {
      setupHlsSource(
        videoElement,
        hlsUrl,
        hlsRef,
        setCurrentAutoQuality,
        loadFallbackSource,
        () => cancelled
      )
        .then((loaded) => {
          if (cancelled) {
            destroyHls();
            return;
          }
          if (!loaded) {
            loadFallbackSource();
            return;
          }
          restoreVideoPlayback(videoElement, playbackSnapshot, () => cancelled);
          playSelectedSource();
        })
        .catch(() => {
          if (!cancelled) {
            loadFallbackSource();
          }
        });
    } else {
      setCurrentAutoQuality(undefined);
      videoElement.src = src;
      videoElement.load();
      restoreVideoPlayback(videoElement, playbackSnapshot, () => cancelled);
      playSelectedSource();
    }

    return () => {
      cancelled = true;
      destroyHls();
    };
  }, [autoPlay, hlsUrl, selection, videoUrl]);

  return (
    <div className="tw-relative tw-h-full tw-w-full">
      {allowQualitySelection && qualityOptions.length > 1 && (
        <>
          {isMenuOpen && (
            <button
              type="button"
              aria-label="Close video quality menu"
              onClick={(event) => {
                stopMediaEvent(event);
                setIsMenuOpen(false);
              }}
              className="tw-absolute tw-inset-0 tw-z-10 tw-border-0 tw-bg-transparent tw-p-0"
            />
          )}
          <button
            type="button"
            aria-label="Video quality"
            aria-expanded={isMenuOpen}
            onClick={(event) => {
              stopMediaEvent(event);
              setIsMenuOpen((value) => !value);
            }}
            className="tw-absolute tw-right-2.5 tw-top-2.5 tw-z-20 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/45 tw-p-0 tw-text-white/65 tw-backdrop-blur-sm tw-transition hover:tw-bg-black/75 hover:tw-text-white focus:tw-outline-none focus-visible:tw-bg-black/75 focus-visible:tw-text-white focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            <Cog6ToothIcon className="tw-h-4 tw-w-4" />
          </button>
          <VideoQualityMenu
            autoQuality={currentAutoQuality}
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onSelect={(opt) => {
              if (videoRef.current) {
                qualitySwitchSnapshotRef.current = snapshotVideoPlayback(
                  videoRef.current
                );
              }
              setSelection(opt);
            }}
            options={qualityOptions}
            selection={selection}
          />
        </>
      )}
      <SeizeVideoPlayer
        videoRef={videoRef}
        template={template}
        poster={posterUrl}
        className={className}
        preload="metadata"
        autoPlay={autoPlay}
        muted={muted}
        captionsSrc={captionsUrl}
        captionsLang="und"
        layout="fill"
        showActions={false}
        onVideoClick={(event) => {
          stopMediaEvent(event);
          setIsMenuOpen(false);
        }}
      />
    </div>
  );
}

export function TweetVideo({
  captionsUrl,
  hlsUrl,
  posterUrl,
  variants,
  videoUrl,
}: {
  readonly captionsUrl: string | undefined;
  readonly hlsUrl: string | undefined;
  readonly posterUrl: string | undefined;
  readonly variants: readonly TweetPreviewVideoVariant[] | undefined;
  readonly videoUrl: string;
}) {
  return (
    <div className="tw-relative tw-aspect-video tw-min-h-40 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-black">
      <TwitterVideoPlayer
        captionsUrl={captionsUrl}
        className="tw-h-full tw-w-full tw-object-contain"
        hlsUrl={hlsUrl}
        posterUrl={posterUrl}
        variants={variants}
        videoUrl={videoUrl}
      />
    </div>
  );
}

export function TweetMediaGridVideo({
  media,
}: {
  readonly media: TweetPreviewMedia;
}) {
  const [playing, setPlaying] = useState(false);
  const posterUrl = media.posterUrl ?? media.imageUrl;

  const playVideo = (event: MouseEvent<HTMLButtonElement>) => {
    stopCardEvent(event);
    setPlaying(true);
  };

  if (posterUrl && !playing) {
    return (
      <button
        type="button"
        onClick={playVideo}
        className="tw-relative tw-block tw-h-full tw-w-full tw-border-0 tw-bg-black tw-p-0"
      >
        <img
          src={posterUrl}
          alt="Tweet video"
          className="tw-h-full tw-w-full tw-object-cover"
          loading="lazy"
        />
        <span className="tw-absolute tw-bottom-3 tw-left-3 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-black/70 tw-text-white">
          <PlayIcon className="tw-h-4 tw-w-4 tw-fill-current" />
        </span>
      </button>
    );
  }

  return media.videoUrl ? (
    <TwitterVideoPlayer
      allowQualitySelection={false}
      autoPlay={playing}
      captionsUrl={media.captionsUrl}
      className="tw-h-full tw-w-full tw-object-contain"
      hlsUrl={media.videoHlsUrl}
      muted={playing}
      posterUrl={posterUrl}
      variants={media.videoVariants}
      videoUrl={media.videoUrl}
    />
  ) : null;
}
