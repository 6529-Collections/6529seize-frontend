"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
} from "react";

export type CmsArtGridMode = "editorial" | "dense" | "contact_sheet" | "clean";

export type CmsArtInspectionMetadata = {
  readonly label: string;
  readonly value: string;
  readonly href?: string | undefined;
};

export type CmsArtInspectionItem = {
  readonly id: string;
  readonly title: string;
  readonly src: string;
  readonly alt: string;
  readonly caption?: string | undefined;
  readonly roleLabel?: string | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly background?: string | undefined;
  readonly metadata: readonly CmsArtInspectionMetadata[];
};

export type CmsArtInspectorLabels = {
  readonly inspect: string;
  readonly close: string;
  readonly previous: string;
  readonly next: string;
  readonly zoomIn: string;
  readonly zoomOut: string;
  readonly resetZoom: string;
  readonly fullscreen: string;
  readonly showMetadata: string;
  readonly hideMetadata: string;
  readonly metadataTitle: string;
};

export function CmsInspectableArtwork({
  caption,
  className = "",
  frameClassName = "",
  imageClassName = "",
  item,
  labels,
  loading = "lazy",
}: {
  readonly caption?: string | undefined;
  readonly className?: string | undefined;
  readonly frameClassName?: string | undefined;
  readonly imageClassName?: string | undefined;
  readonly item: CmsArtInspectionItem;
  readonly labels: CmsArtInspectorLabels;
  readonly loading?: "eager" | "lazy" | undefined;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = [item];

  return (
    <>
      <figure className={`tw-overflow-hidden tw-bg-iron-950 ${className}`}>
        <ArtworkButton
          frameClassName={frameClassName}
          imageClassName={imageClassName}
          item={item}
          labels={labels}
          loading={loading}
          onOpen={() => setOpenIndex(0)}
        />
        {caption || item.caption || item.roleLabel ? (
          <figcaption className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {item.roleLabel ? (
              <span className="tw-mr-2 tw-inline-flex tw-border tw-border-solid tw-border-iron-700 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
                {item.roleLabel}
              </span>
            ) : null}
            {caption ?? item.caption}
          </figcaption>
        ) : null}
      </figure>
      <ArtworkDialog
        activeIndex={openIndex}
        items={items}
        labels={labels}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}

export function CmsArtGalleryGrid({
  description,
  heading,
  items,
  labels,
  mode = "clean",
}: {
  readonly description?: string | undefined;
  readonly heading?: string | undefined;
  readonly items: readonly CmsArtInspectionItem[];
  readonly labels: CmsArtInspectorLabels;
  readonly mode?: CmsArtGridMode | undefined;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items.length) {
    return null;
  }

  return (
    <section className="tw-flex tw-flex-col tw-gap-4">
      {heading || description ? (
        <div>
          {heading ? (
            <h3 className="tw-text-xl tw-font-semibold tw-text-white">
              {heading}
            </h3>
          ) : null}
          {description ? (
            <p className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={getGalleryGridClassName(mode)}>
        {items.map((item, index) => (
          <figure
            className={getGalleryCardClassName(mode, index)}
            key={item.id}
          >
            <ArtworkButton
              frameClassName={getGalleryFrameClassName(mode)}
              imageClassName={getGalleryImageClassName(mode)}
              item={item}
              labels={labels}
              loading={index === 0 ? "eager" : "lazy"}
              onOpen={() => setOpenIndex(index)}
            />
            <figcaption className={getGalleryCaptionClassName(mode)}>
              <span className="tw-block tw-font-semibold tw-text-iron-100">
                {item.title}
              </span>
              {item.caption ? (
                <span className="tw-mt-1 tw-block tw-text-iron-400">
                  {item.caption}
                </span>
              ) : null}
              {item.roleLabel ? (
                <span className="tw-mt-2 tw-inline-flex tw-border tw-border-solid tw-border-iron-700 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
                  {item.roleLabel}
                </span>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
      <ArtworkDialog
        activeIndex={openIndex}
        items={items}
        labels={labels}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </section>
  );
}

function ArtworkButton({
  frameClassName,
  imageClassName,
  item,
  labels,
  loading,
  onOpen,
}: {
  readonly frameClassName: string;
  readonly imageClassName: string;
  readonly item: CmsArtInspectionItem;
  readonly labels: CmsArtInspectorLabels;
  readonly loading: "eager" | "lazy";
  readonly onOpen: () => void;
}) {
  return (
    <button
      aria-label={`${labels.inspect}: ${item.title}`}
      className={`tw-group tw-relative tw-flex tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-border-0 tw-bg-iron-950 tw-p-0 tw-text-left focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 ${frameClassName}`}
      onClick={onOpen}
      style={getArtworkFrameStyle(item)}
      type="button"
    >
      <img
        alt={item.alt}
        className={`tw-h-full tw-w-full tw-transition-transform tw-duration-200 group-hover:tw-scale-[1.01] ${imageClassName}`}
        decoding="async"
        height={item.height}
        loading={loading}
        src={item.src}
        width={item.width}
      />
      <span className="tw-absolute tw-bottom-3 tw-right-3 tw-border tw-border-solid tw-border-white/25 tw-bg-black/75 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-white tw-opacity-0 tw-transition group-hover:tw-opacity-100 group-focus-visible:tw-opacity-100">
        {labels.inspect}
      </span>
    </button>
  );
}

function ArtworkDialog({
  activeIndex,
  items,
  labels,
  onClose,
  onIndexChange,
}: {
  readonly activeIndex: number | null;
  readonly items: readonly CmsArtInspectionItem[];
  readonly labels: CmsArtInspectorLabels;
  readonly onClose: () => void;
  readonly onIndexChange: (index: number) => void;
}) {
  const [showMetadata, setShowMetadata] = useState(false);
  const [zoom, setZoom] = useState(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const activeItem =
    activeIndex === null ? undefined : (items[activeIndex] ?? undefined);
  const titleId = activeItem ? `cms-art-lightbox-title-${activeItem.id}` : "";

  const close = useCallback(() => {
    onClose();
    setZoom(1);
    setShowMetadata(false);
  }, [onClose]);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (!items.length) {
        return;
      }
      const normalizedIndex = (nextIndex + items.length) % items.length;
      onIndexChange(normalizedIndex);
      setZoom(1);
    },
    [items.length, onIndexChange]
  );

  useEffect(() => {
    if (activeIndex === null) {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
      return;
    }

    previousFocusRef.current =
      globalThis.document?.activeElement instanceof HTMLElement
        ? globalThis.document.activeElement
        : null;
    closeButtonRef.current?.focus();
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToIndex(activeIndex + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToIndex(activeIndex - 1);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((current) => Math.min(current + 0.25, 4));
      } else if (event.key === "-") {
        event.preventDefault();
        setZoom((current) => Math.max(current - 0.25, 1));
      } else if (event.key === "0") {
        event.preventDefault();
        setZoom(1);
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        setShowMetadata((current) => !current);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleFullscreen(dialogRef.current);
      }
    };

    globalThis.window?.addEventListener("keydown", onKeyDown);
    return () => globalThis.window?.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, close, goToIndex]);

  if (activeIndex === null || !activeItem) {
    return null;
  }

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="tw-fixed tw-inset-0 tw-z-[1100] tw-flex tw-bg-black/95 tw-text-iron-100"
      onKeyDown={(event) => stopNestedSpaceScroll(event)}
      ref={dialogRef}
      role="dialog"
    >
      <div className="tw-flex tw-min-h-0 tw-w-full tw-flex-col">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3">
          <div className="tw-min-w-0">
            <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
              {activeIndex + 1} / {items.length}
            </p>
            <h2
              className="tw-truncate tw-text-base tw-font-semibold tw-text-white sm:tw-text-lg"
              id={titleId}
            >
              {activeItem.title}
            </h2>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            {items.length > 1 ? (
              <>
                <LightboxButton
                  label={labels.previous}
                  onClick={() => goToIndex(activeIndex - 1)}
                />
                <LightboxButton
                  label={labels.next}
                  onClick={() => goToIndex(activeIndex + 1)}
                />
              </>
            ) : null}
            <LightboxButton
              label={labels.zoomOut}
              onClick={() => setZoom((current) => Math.max(current - 0.25, 1))}
            />
            <LightboxButton
              label={labels.zoomIn}
              onClick={() => setZoom((current) => Math.min(current + 0.25, 4))}
            />
            <LightboxButton
              label={labels.resetZoom}
              onClick={() => setZoom(1)}
            />
            <LightboxButton
              label={labels.fullscreen}
              onClick={() => toggleFullscreen(dialogRef.current)}
            />
            <LightboxButton
              label={showMetadata ? labels.hideMetadata : labels.showMetadata}
              onClick={() => setShowMetadata((current) => !current)}
            />
            <LightboxButton
              buttonRef={closeButtonRef}
              label={labels.close}
              onClick={close}
            />
          </div>
        </div>

        <div
          className={`tw-grid tw-min-h-0 tw-flex-1 ${
            showMetadata
              ? "lg:tw-grid-cols-[minmax(0,1fr)_22rem]"
              : "tw-grid-cols-1"
          }`}
        >
          <div className="tw-min-h-0 tw-overflow-auto tw-p-4">
            <div
              className="tw-flex tw-min-h-full tw-items-center tw-justify-center"
              style={getArtworkFrameStyle(activeItem)}
            >
              <img
                alt={activeItem.alt}
                className="tw-max-h-[calc(100dvh-8rem)] tw-max-w-full tw-object-contain"
                height={activeItem.height}
                src={activeItem.src}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center",
                }}
                width={activeItem.width}
              />
            </div>
          </div>

          {showMetadata ? (
            <aside className="tw-max-h-[45dvh] tw-overflow-auto tw-border-x-0 tw-border-b-0 tw-border-l-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 lg:tw-max-h-none lg:tw-border-l lg:tw-border-t-0">
              <h3 className="tw-text-base tw-font-semibold tw-text-white">
                {labels.metadataTitle}
              </h3>
              {activeItem.caption ? (
                <p className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                  {activeItem.caption}
                </p>
              ) : null}
              <dl className="tw-mt-4 tw-flex tw-flex-col tw-gap-3 tw-text-sm">
                {activeItem.metadata.map((entry) => (
                  <div key={`${entry.label}-${entry.value}`}>
                    <dt className="tw-text-iron-500">{entry.label}</dt>
                    <dd className="tw-break-all tw-text-iron-100">
                      {entry.href ? (
                        <a
                          className="hover:tw-text-primary-200 tw-text-primary-300"
                          href={entry.href}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {entry.value}
                        </a>
                      ) : (
                        entry.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const LightboxButton = ({
  buttonRef,
  label,
  onClick,
}: {
  readonly buttonRef?: Ref<HTMLButtonElement> | undefined;
  readonly label: string;
  readonly onClick: () => void;
}) => (
  <button
    className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
    onClick={onClick}
    ref={buttonRef}
    type="button"
  >
    {label}
  </button>
);

function toggleFullscreen(element: HTMLElement | null): void {
  if (!element || !globalThis.document) {
    return;
  }

  if (globalThis.document.fullscreenElement) {
    void globalThis.document.exitFullscreen();
    return;
  }

  void element.requestFullscreen?.();
}

function stopNestedSpaceScroll(event: KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== " ") {
    return;
  }

  if (event.target instanceof HTMLButtonElement) {
    return;
  }

  event.preventDefault();
}

function getArtworkFrameStyle(item: CmsArtInspectionItem): CSSProperties {
  const style: CSSProperties = {};

  if (item.width && item.height) {
    style.aspectRatio = `${item.width} / ${item.height}`;
  }
  if (item.background) {
    style.background = item.background;
  }

  return style;
}

function getGalleryGridClassName(mode: CmsArtGridMode): string {
  switch (mode) {
    case "editorial":
      return "tw-grid tw-grid-cols-1 tw-gap-5 md:tw-grid-cols-2";
    case "dense":
      return "tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 lg:tw-grid-cols-5";
    case "contact_sheet":
      return "tw-grid tw-grid-cols-3 tw-gap-2 sm:tw-grid-cols-4 lg:tw-grid-cols-6";
    case "clean":
      return "tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3";
  }
}

function getGalleryCardClassName(mode: CmsArtGridMode, index: number): string {
  if (mode === "editorial" && index === 0) {
    return "tw-bg-iron-950 md:tw-col-span-2";
  }

  return "tw-bg-iron-950";
}

function getGalleryFrameClassName(mode: CmsArtGridMode): string {
  switch (mode) {
    case "editorial":
      return "tw-min-h-[18rem]";
    case "dense":
      return "tw-aspect-square";
    case "contact_sheet":
      return "tw-aspect-square";
    case "clean":
      return "tw-min-h-[16rem]";
  }
}

function getGalleryImageClassName(mode: CmsArtGridMode): string {
  switch (mode) {
    case "dense":
    case "contact_sheet":
      return "tw-object-cover";
    case "editorial":
    case "clean":
      return "tw-object-contain";
  }
}

function getGalleryCaptionClassName(mode: CmsArtGridMode): string {
  if (mode === "contact_sheet") {
    return "tw-sr-only";
  }

  return "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-leading-6";
}
