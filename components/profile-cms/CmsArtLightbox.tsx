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

import {
  getCmsArtGalleryCaptionClassName,
  getCmsArtGalleryCardClassName,
  getCmsArtGalleryFrameClassName,
  getCmsArtGalleryGridClassName,
  getCmsArtGalleryImageClassName,
  type CmsArtGridMode,
} from "@/components/profile-cms/cmsArtGalleryClasses";

const INHERITED_TEXT_CLASS = "tw-text-inherit";

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
  previewSrc,
  labels,
  loading = "lazy",
}: {
  readonly caption?: string | undefined;
  readonly className?: string | undefined;
  readonly frameClassName?: string | undefined;
  readonly imageClassName?: string | undefined;
  readonly item: CmsArtInspectionItem;
  readonly previewSrc?: string | undefined;
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
          item={previewSrc ? { ...item, src: previewSrc } : item}
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
  appearance = "dark",
  previewSources,
}: {
  readonly description?: string | undefined;
  readonly heading?: string | undefined;
  readonly items: readonly CmsArtInspectionItem[];
  readonly labels: CmsArtInspectorLabels;
  readonly mode?: CmsArtGridMode | undefined;
  readonly appearance?: "dark" | "studio" | undefined;
  readonly previewSources?: Readonly<Record<string, string>> | undefined;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const studio = appearance === "studio";

  if (!items.length) {
    return null;
  }

  return (
    <section className="tw-flex tw-flex-col tw-gap-4">
      {heading || description ? (
        <div>
          {heading ? (
            <h3
              className={`tw-m-0 tw-text-xl tw-font-semibold ${studio ? INHERITED_TEXT_CLASS : "tw-text-white"}`}
            >
              {heading}
            </h3>
          ) : null}
          {description ? (
            <p
              className={`tw-mt-2 tw-text-sm tw-leading-6 ${studio ? INHERITED_TEXT_CLASS : "tw-text-iron-400"}`}
            >
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <div
        className={
          studio
            ? STUDIO_GALLERY_GRIDS[mode]
            : getCmsArtGalleryGridClassName(mode)
        }
      >
        {items.map((item, index) => (
          <figure
            className={
              studio
                ? getStudioGalleryCardClassName(mode, index)
                : getCmsArtGalleryCardClassName(mode, index)
            }
            key={item.id}
          >
            <ArtworkButton
              frameClassName={`${getCmsArtGalleryFrameClassName(mode)} ${studio ? getStudioGalleryFrameClassName(mode) : ""}`}
              imageClassName={`${getCmsArtGalleryImageClassName(mode)} ${studio ? "tw-max-h-[70vh] !tw-object-contain" : ""}`}
              item={getArtworkPreviewItem(item, previewSources?.[item.id])}
              labels={labels}
              loading={index === 0 ? "eager" : "lazy"}
              onOpen={() => setOpenIndex(index)}
            />
            <figcaption
              className={
                studio
                  ? "tw-mt-3 tw-text-xs tw-leading-6"
                  : getCmsArtGalleryCaptionClassName(mode)
              }
            >
              <span
                className={`tw-block tw-font-semibold ${studio ? INHERITED_TEXT_CLASS : "tw-text-iron-100"}`}
              >
                {item.title}
              </span>
              {item.caption ? (
                <span
                  className={`tw-mt-1 tw-block ${studio ? INHERITED_TEXT_CLASS : "tw-text-iron-400"}`}
                >
                  {item.caption}
                </span>
              ) : null}
              {item.roleLabel ? (
                <span
                  className={`tw-mt-2 tw-inline-flex tw-border tw-border-solid tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase ${studio ? "tw-border-[color:var(--cms-line)] tw-text-inherit" : "tw-border-iron-700 tw-text-primary-300"}`}
                >
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

function getStudioGalleryCardClassName(
  mode: CmsArtGridMode,
  index: number
): string {
  const wide = mode === "editorial" && index === 0;
  return `tw-m-0 tw-min-w-0 ${wide ? "@[48rem]/cms-studio:tw-col-span-2" : ""}`;
}

function getStudioGalleryFrameClassName(mode: CmsArtGridMode): string {
  const square = mode === "contact_sheet" || mode === "dense";
  return `!tw-bg-transparent ${square ? "!tw-aspect-square" : "!tw-aspect-auto"}`;
}

function getArtworkPreviewItem(
  item: CmsArtInspectionItem,
  previewSrc: string | undefined
): CmsArtInspectionItem {
  return previewSrc ? { ...item, src: previewSrc } : item;
}

const STUDIO_GALLERY_GRIDS: Record<CmsArtGridMode, string> = {
  clean:
    "tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-12 @[40rem]/cms-studio:tw-grid-cols-2 @[64rem]/cms-studio:tw-grid-cols-3",
  editorial:
    "tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-12 @[48rem]/cms-studio:tw-grid-cols-2",
  dense: "tw-grid tw-grid-cols-2 tw-gap-4 @[48rem]/cms-studio:tw-grid-cols-4",
  contact_sheet:
    "tw-grid tw-grid-cols-2 tw-gap-4 @[40rem]/cms-studio:tw-grid-cols-3 @[64rem]/cms-studio:tw-grid-cols-5",
};

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const activeItem =
    activeIndex === null ? undefined : (items[activeIndex] ?? undefined);
  const titleId = activeItem ? `cms-art-lightbox-title-${activeItem.id}` : "";
  const metadataRows = activeItem
    ? getUniqueMetadataRows(activeItem.metadata)
    : [];

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

    previousFocusRef.current ??=
      globalThis.document?.activeElement instanceof HTMLElement
        ? globalThis.document.activeElement
        : null;
    closeButtonRef.current?.focus();
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Tab") {
      trapFocus(event, dialogRef.current);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (isTextEntryTarget(event.target)) {
      return;
    }

    if (activeIndex === null) {
      return;
    }

    if (event.key === "ArrowRight" && items.length > 1) {
      event.preventDefault();
      goToIndex(activeIndex + 1);
      return;
    }

    if (event.key === "ArrowLeft" && items.length > 1) {
      event.preventDefault();
      goToIndex(activeIndex - 1);
      return;
    }

    stopNestedSpaceScroll(event);
  };

  if (activeIndex === null || !activeItem) {
    return null;
  }

  return (
    <dialog
      aria-labelledby={titleId}
      aria-modal="true"
      className="tw-fixed tw-inset-0 tw-z-[1100] tw-m-0 tw-flex tw-h-auto tw-max-h-none tw-w-auto tw-max-w-none tw-border-0 tw-bg-black/95 tw-p-0 tw-text-iron-100"
      onKeyDown={handleDialogKeyDown}
      open
      ref={dialogRef}
      tabIndex={-1}
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
          <div
            className="tw-flex tw-flex-wrap tw-items-center tw-gap-2"
            data-testid="cms-art-lightbox-toolbar"
          >
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
          <div className="tw-relative tw-min-h-0 tw-overflow-auto tw-p-4">
            <button
              aria-hidden="true"
              className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-border-0 tw-bg-transparent tw-p-0"
              data-testid="cms-art-lightbox-backdrop"
              onClick={close}
              tabIndex={-1}
              type="button"
            />
            <div
              className="tw-pointer-events-none tw-relative tw-flex tw-min-h-full tw-items-center tw-justify-center"
              style={getArtworkFrameStyle(activeItem)}
            >
              <img
                alt={activeItem.alt}
                className="tw-pointer-events-auto tw-max-h-[calc(100dvh-8rem)] tw-max-w-full tw-object-contain"
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
                {metadataRows.map((entry) => (
                  <div key={entry.key}>
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
    </dialog>
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

function stopNestedSpaceScroll(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== " ") {
    return;
  }

  if (event.target instanceof HTMLButtonElement) {
    return;
  }

  event.preventDefault();
}

const FOCUSABLE_ELEMENT_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(
  event: KeyboardEvent<HTMLElement>,
  container: HTMLElement | null
): void {
  if (!container) {
    return;
  }

  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR)
  ).filter((element) => element.getAttribute("aria-hidden") !== "true");

  if (!focusableElements.length) {
    event.preventDefault();
    container.focus();
    return;
  }

  const firstElement = focusableElements[0]!;
  const lastElement = focusableElements.at(-1)!;
  const activeElement = globalThis.document?.activeElement ?? null;

  if (event.shiftKey) {
    if (activeElement === firstElement || !container.contains(activeElement)) {
      event.preventDefault();
      lastElement.focus();
    }
    return;
  }

  if (activeElement === lastElement || !container.contains(activeElement)) {
    event.preventDefault();
    firstElement.focus();
  }
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

function getUniqueMetadataRows(
  entries: readonly CmsArtInspectionMetadata[]
): ReadonlyArray<CmsArtInspectionMetadata & { readonly key: string }> {
  const seen = new Map<string, number>();

  return entries.map((entry) => {
    const baseKey = `${entry.label}-${entry.value}-${entry.href ?? ""}`;
    const occurrence = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, occurrence);

    return {
      ...entry,
      key: `${baseKey}-${occurrence}`,
    };
  });
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
