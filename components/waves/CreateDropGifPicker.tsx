"use client";

import {
  Grid,
  SearchBar,
  SearchContext,
  SearchContextManager,
} from "@giphy/react-components";
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type RefObject,
} from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";

const GIPHY_GRID_FALLBACK_WIDTH = 360;
const GIPHY_GRID_GUTTER = 8;
const GIPHY_RATING = "r";
const GIPHY_BRAND_NAME = "GIPHY";

type GridOnGifClick = NonNullable<ComponentProps<typeof Grid>["onGifClick"]>;
type GiphyGif = Parameters<GridOnGifClick>[0];

function useMeasuredWidth<TElement extends HTMLElement>(
  fallbackWidth: number
): readonly [RefObject<TElement | null>, number] {
  const ref = useRef<TElement | null>(null);
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const setElementWidth = (nextWidth: number) => {
      if (nextWidth <= 0) {
        return;
      }

      setWidth(Math.floor(nextWidth));
    };

    setElementWidth(element.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setElementWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function getGiphyGifUrl(gif: GiphyGif): string | null {
  const preferredRenditions = [
    "original",
    "downsized_medium",
    "fixed_height",
    "fixed_width",
  ] as const;

  for (const rendition of preferredRenditions) {
    const url = gif.images[rendition]?.url;
    if (url) {
      return url;
    }
  }

  return null;
}

function getGiphyGridColumns(width: number): number {
  if (width < 240) {
    return 1;
  }

  if (width < 360) {
    return 2;
  }

  return 3;
}

function GifPickerUnavailable({
  title,
  hint,
  closeLabel,
  onClose,
}: {
  readonly title: string;
  readonly hint: string;
  readonly closeLabel: string;
  readonly onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="tw-flex tw-min-h-72 tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-px-6 tw-py-10 tw-text-center">
      <div className="tw-space-y-2">
        <p
          role="alert"
          className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50"
        >
          {title}
        </p>
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">{hint}</p>
      </div>
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-white/10 tw-bg-iron-800 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition tw-duration-200 hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
      >
        {closeLabel}
      </button>
    </div>
  );
}

function GiphyAttributionMark({
  ariaLabel,
  prefixLabel,
}: {
  readonly ariaLabel: string;
  readonly prefixLabel: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-normal tw-text-iron-400"
    >
      <span>{prefixLabel}</span>
      <span className="tw-rounded-sm tw-bg-white tw-px-1.5 tw-py-1 tw-text-[11px] tw-font-black tw-leading-none tw-tracking-normal tw-text-black">
        {GIPHY_BRAND_NAME}
      </span>
    </div>
  );
}

function GiphyResults({
  onSelect,
  onUnavailable,
  onAvailable,
  unavailableTitle,
  unavailableHint,
  closeLabel,
  noResultsLabel,
  onClose,
}: {
  readonly onSelect: (gif: string) => void;
  readonly onUnavailable: () => void;
  readonly onAvailable: () => void;
  readonly unavailableTitle: string;
  readonly unavailableHint: string;
  readonly closeLabel: string;
  readonly noResultsLabel: string;
  readonly onClose: () => void;
}) {
  const { fetchGifs, searchKey } = useContext(SearchContext);
  const [containerRef, gridWidth] = useMeasuredWidth<HTMLDivElement>(
    GIPHY_GRID_FALLBACK_WIDTH
  );
  const [hasFetchError, setHasFetchError] = useState(false);

  const handleGifClick = useCallback<GridOnGifClick>(
    (gif, event) => {
      event.preventDefault();
      const gifUrl = getGiphyGifUrl(gif);
      if (!gifUrl) {
        return;
      }

      onSelect(gifUrl);
    },
    [onSelect]
  );

  const handleGifsFetchError = useCallback(() => {
    setHasFetchError(true);
    onUnavailable();
  }, [onUnavailable]);

  const handleGifsFetched = useCallback(() => {
    setHasFetchError(false);
    onAvailable();
  }, [onAvailable]);

  useEffect(() => {
    setHasFetchError(false);
    onAvailable();
  }, [onAvailable, searchKey]);

  const gridColumns = getGiphyGridColumns(gridWidth);

  if (hasFetchError) {
    return (
      <GifPickerUnavailable
        title={unavailableTitle}
        hint={unavailableHint}
        closeLabel={closeLabel}
        onClose={onClose}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="tw-min-h-0 tw-flex-1 tw-overflow-x-hidden tw-overflow-y-auto tw-p-3"
    >
      <Grid
        key={searchKey}
        width={gridWidth}
        columns={gridColumns}
        gutter={GIPHY_GRID_GUTTER}
        fetchGifs={fetchGifs}
        onGifClick={handleGifClick}
        onGifsFetchError={handleGifsFetchError}
        onGifsFetched={handleGifsFetched}
        noLink={true}
        borderRadius={8}
        backgroundColor="#121318"
        noResultsMessage={
          <div className="tw-px-4 tw-py-12 tw-text-center tw-text-sm tw-font-medium tw-text-iron-400">
            {noResultsLabel}
          </div>
        }
      />
    </div>
  );
}

function GifPickerDialog({
  giphyApiKey,
  onSelect,
  onClose,
}: {
  readonly giphyApiKey: string;
  readonly onSelect: (gif: string) => void;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const dialogTitle = t(locale, "waves.gifPicker.dialogTitle");
  const poweredByLabel = t(locale, "waves.gifPicker.poweredBy", {
    brandName: GIPHY_BRAND_NAME,
  });
  const [statusMessage, setStatusMessage] = useState(() =>
    t(locale, "waves.gifPicker.status.ready")
  );

  useEffect(() => {
    setStatusMessage(t(locale, "waves.gifPicker.status.ready"));
  }, [locale]);

  const markUnavailable = useCallback(() => {
    setStatusMessage(t(locale, "waves.gifPicker.unavailable.title"));
  }, [locale]);

  const markAvailable = useCallback(() => {
    setStatusMessage(t(locale, "waves.gifPicker.status.ready"));
  }, [locale]);

  return (
    <MobileWrapperDialog
      title={dialogTitle}
      isOpen={true}
      onClose={onClose}
      noPadding={true}
      headerClassName="tw-sr-only"
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="tw-sr-only"
      >
        {statusMessage}
      </div>
      <SearchContextManager
        apiKey={giphyApiKey}
        shouldDefaultToTrending={true}
        shouldFetchChannels={false}
        options={{ rating: GIPHY_RATING, type: "gifs" }}
        theme={{
          darkMode: true,
          searchbarHeight: 44,
          mobileSearchbarHeight: 44,
          hideCancelButton: true,
        }}
      >
        <div className="tw-flex tw-h-[min(78vh,720px)] tw-min-h-[420px] tw-flex-col tw-overflow-hidden tw-bg-iron-950">
          <div className="tw-flex tw-flex-col tw-gap-3 tw-border-b tw-border-white/10 tw-bg-iron-950 tw-p-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
              <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50">
                {dialogTitle}
              </p>
              <GiphyAttributionMark
                ariaLabel={poweredByLabel}
                prefixLabel={t(locale, "waves.gifPicker.poweredByPrefix")}
              />
            </div>
            <SearchBar
              placeholder={t(locale, "waves.gifPicker.searchPlaceholder")}
              clear={true}
              autoFocus={true}
            />
          </div>
          <GiphyResults
            onSelect={onSelect}
            onUnavailable={markUnavailable}
            onAvailable={markAvailable}
            unavailableTitle={t(locale, "waves.gifPicker.unavailable.title")}
            unavailableHint={t(locale, "waves.gifPicker.unavailable.hint")}
            closeLabel={t(locale, "common.close")}
            noResultsLabel={t(locale, "waves.gifPicker.noResults")}
            onClose={onClose}
          />
        </div>
      </SearchContextManager>
    </MobileWrapperDialog>
  );
}

export default function CreateDropGifPicker({
  giphyApiKey,
  show,
  setShow,
  onSelect,
}: {
  readonly giphyApiKey: string;
  readonly show: boolean;
  readonly setShow: (show: boolean) => void;
  readonly onSelect: (gif: string) => void;
}) {
  const handleClose = () => setShow(false);

  if (!show) {
    return null;
  }

  return (
    <GifPickerDialog
      giphyApiKey={giphyApiKey}
      onSelect={onSelect}
      onClose={handleClose}
    />
  );
}
