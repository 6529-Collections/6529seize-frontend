"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CurationDropFooter from "@/components/waves/drops/CurationDropFooter";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import { WaveDropQuoteDisplayProvider } from "@/components/waves/drops/WaveDropQuoteDisplayContext";
import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useNavigateToDropWave } from "@/hooks/useNavigateToDropWave";
import { useIntersectionObserver } from "@/hooks/scroll/useIntersectionObserver";
import {
  type RenderComponentProps,
  useMasonry,
  usePositioner,
  useResizeObserver,
} from "masonic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from "react";

const MASONRY_COLUMN_WIDTH = 300;
const MASONRY_GUTTER = 16;
const INFINITE_SCROLL_ROOT_MARGIN = "1200px 0px";
const SCROLL_IDLE_DELAY_MS = 120;
const CURATION_CARD_CLASS_NAME =
  "tw-group tw-relative tw-isolate tw-z-0 tw-rounded-xl desktop-hover:hover:tw-z-30 focus-within:tw-z-30";
const CURATION_CARD_HOVER_FRAME_CLASS_NAME =
  "tw-pointer-events-none tw-absolute tw-inset-0 -tw-z-10 tw-rounded-xl tw-border tw-border-solid tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-out desktop-hover:group-hover:tw-border-white/10 motion-reduce:tw-transition-none";

type PanelViewport = {
  readonly height: number;
  readonly isScrolling: boolean;
  readonly scrollTop: number;
};

interface CommunityCurationsMasonryProps {
  readonly drops: readonly ExtendedDrop[];
  readonly fetchNextPage: () => Promise<void>;
  readonly hasNextPage: boolean | undefined;
  readonly isFetchingNextPage: boolean;
  readonly scrollContainer: HTMLElement | null;
}

const EMPTY_VIEWPORT: PanelViewport = {
  height: 0,
  isScrolling: false,
  scrollTop: 0,
};

const noop = () => {};

const getDropKey = (drop: ExtendedDrop) => drop.stableKey;

const getGridScrollTop = (
  scrollContainer: HTMLElement,
  gridElement: HTMLElement | null
) => {
  if (!gridElement) {
    return 0;
  }

  const scrollRect = scrollContainer.getBoundingClientRect();
  const gridRect = gridElement.getBoundingClientRect();
  const gridOffsetTop =
    gridRect.top - scrollRect.top + scrollContainer.scrollTop;

  return Math.max(0, scrollContainer.scrollTop - gridOffsetTop);
};

const areViewportsEqual = (left: PanelViewport, right: PanelViewport) =>
  left.height === right.height &&
  left.isScrolling === right.isScrolling &&
  left.scrollTop === right.scrollTop;

const readPanelViewport = (
  scrollContainer: HTMLElement,
  gridElement: HTMLElement | null,
  isScrolling: boolean
): PanelViewport => ({
  height: scrollContainer.clientHeight,
  isScrolling,
  scrollTop: getGridScrollTop(scrollContainer, gridElement),
});

const setPanelViewport = (
  setViewport: Dispatch<SetStateAction<PanelViewport>>,
  nextViewport: PanelViewport
) => {
  setViewport((currentViewport) =>
    areViewportsEqual(currentViewport, nextViewport)
      ? currentViewport
      : nextViewport
  );
};

const schedulePanelViewportUpdate = ({
  frameId,
  gridElement,
  isScrolling,
  scrollContainer,
  setViewport,
}: {
  readonly frameId: number | null;
  readonly gridElement: HTMLElement | null;
  readonly isScrolling: boolean;
  readonly scrollContainer: HTMLElement;
  readonly setViewport: Dispatch<SetStateAction<PanelViewport>>;
}): number => {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }

  return requestAnimationFrame(() => {
    const nextViewport = readPanelViewport(
      scrollContainer,
      gridElement,
      isScrolling
    );
    setPanelViewport(setViewport, nextViewport);
  });
};

function useElementWidth(element: HTMLElement | null) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.floor(entry?.contentRect.width ?? 0);
      setWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return { setWidth, width };
}

function usePanelViewport(
  scrollContainer: HTMLElement | null,
  gridElement: HTMLElement | null
) {
  const [viewport, setViewport] = useState<PanelViewport>(EMPTY_VIEWPORT);

  useEffect(() => {
    if (!scrollContainer) {
      return;
    }

    let idleTimeout: ReturnType<typeof setTimeout> | null = null;
    let frameId: number | null = null;

    const scheduleViewportUpdate = (isScrolling: boolean) => {
      frameId = schedulePanelViewportUpdate({
        frameId,
        gridElement,
        isScrolling,
        scrollContainer,
        setViewport,
      });
    };

    const onScroll = () => {
      scheduleViewportUpdate(true);

      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }

      idleTimeout = setTimeout(
        () => scheduleViewportUpdate(false),
        SCROLL_IDLE_DELAY_MS
      );
    };

    scheduleViewportUpdate(false);
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => scheduleViewportUpdate(false));

    observer?.observe(scrollContainer);
    if (gridElement) {
      observer?.observe(gridElement);
    }

    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [gridElement, scrollContainer]);

  return scrollContainer ? viewport : EMPTY_VIEWPORT;
}

function CommunityCurationsInfiniteScrollTrigger({
  onIntersection,
  scrollContainer,
}: {
  readonly onIntersection: (isIntersecting: boolean) => void;
  readonly scrollContainer: HTMLElement | null;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const handleIntersection = useCallback(
    (entry: IntersectionObserverEntry) => onIntersection(entry.isIntersecting),
    [onIntersection]
  );

  useIntersectionObserver(
    triggerRef,
    {
      root: scrollContainer,
      rootMargin: INFINITE_SCROLL_ROOT_MARGIN,
      threshold: 0,
    },
    handleIntersection,
    Boolean(scrollContainer)
  );

  return <div ref={triggerRef} aria-hidden="true" className="tw-h-px" />;
}

function CommunityCurationsMasonryItem({
  data: drop,
}: RenderComponentProps<ExtendedDrop>) {
  const navigateToDropWave = useNavigateToDropWave();

  return (
    <article className={CURATION_CARD_CLASS_NAME}>
      <WaveDropQuoteDisplayProvider flattenWhenAuthorSameAs={drop.author}>
        <Drop
          drop={drop}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={true}
          activeDrop={null}
          showReplyAndQuote={false}
          location={DropLocation.MY_STREAM}
          dropViewDropId={null}
          onReply={noop}
          onReplyClick={noop}
          onQuoteClick={navigateToDropWave}
          onDropContentClick={navigateToDropWave}
          footer={<CurationDropFooter drop={drop} />}
          mediaImageScale={ImageScale.AUTOx1080}
          timestampLayout="inline"
          showInteractions={false}
          inlineAuthorOnDesktop={true}
          fullWidthMedia={true}
          fullWidthLinkPreviews={true}
          reserveMediaHeight={true}
          showVideoFullscreen={false}
        />
      </WaveDropQuoteDisplayProvider>
      <div
        aria-hidden="true"
        className={CURATION_CARD_HOVER_FRAME_CLASS_NAME}
      />
    </article>
  );
}

function CommunityCurationsVirtualMasonry({
  drops,
  scrollContainer,
}: {
  readonly drops: readonly ExtendedDrop[];
  readonly scrollContainer: HTMLElement | null;
}): ReactElement {
  const [gridElement, setGridElement] = useState<HTMLElement | null>(null);
  const { setWidth, width } = useElementWidth(gridElement);
  const viewport = usePanelViewport(scrollContainer, gridElement);
  const items = useMemo(() => [...drops], [drops]);
  const resetKey = useMemo(
    () => items.slice(0, 8).map(getDropKey).join("|"),
    [items]
  );
  const positioner = usePositioner(
    {
      columnGutter: MASONRY_GUTTER,
      columnWidth: MASONRY_COLUMN_WIDTH,
      rowGutter: MASONRY_GUTTER,
      width: Math.max(width, 1),
    },
    [resetKey, items.length]
  );
  const resizeObserver = useResizeObserver(positioner);
  const setContainerRef = useCallback(
    (element: HTMLElement | null) => {
      setGridElement(element);
      setWidth(element?.offsetWidth ?? 0);
    },
    [setWidth]
  );

  return useMasonry<ExtendedDrop>({
    containerRef: setContainerRef,
    height: Math.max(viewport.height, 1),
    isScrolling: viewport.isScrolling,
    itemHeightEstimate: 420,
    itemKey: getDropKey,
    items,
    overscanBy: 2,
    positioner,
    render: CommunityCurationsMasonryItem,
    resizeObserver,
    scrollTop: viewport.scrollTop,
  }) as ReactElement;
}

export default function CommunityCurationsMasonry({
  drops,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  scrollContainer,
}: CommunityCurationsMasonryProps) {
  const shouldShowPaginationFooter = Boolean(hasNextPage) || isFetchingNextPage;
  const shouldShowLoader = isFetchingNextPage || drops.length === 0;
  const handleIntersection = useCallback(
    (isIntersecting: boolean) => {
      if (!isIntersecting || !hasNextPage || isFetchingNextPage) {
        return;
      }

      fetchNextPage().catch(() => undefined);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  return (
    <div>
      <CommunityCurationsVirtualMasonry
        drops={drops}
        scrollContainer={scrollContainer}
      />

      {shouldShowPaginationFooter && (
        <div className="tw-flex tw-justify-center tw-py-6">
          {!isFetchingNextPage && (
            <CommunityCurationsInfiniteScrollTrigger
              onIntersection={handleIntersection}
              scrollContainer={scrollContainer}
            />
          )}
          {shouldShowLoader && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
        </div>
      )}
    </div>
  );
}
