"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { TweetPreviewModeProvider } from "@/components/tweets/TweetPreviewModeContext";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
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
  type ReactElement,
} from "react";

const MASONRY_COLUMN_WIDTH = 300;
const MASONRY_GUTTER = 16;
const INFINITE_SCROLL_ROOT_MARGIN = "1200px 0px";
const SCROLL_IDLE_DELAY_MS = 120;

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

    const readViewport = (isScrolling: boolean): PanelViewport => ({
      height: scrollContainer.clientHeight,
      isScrolling,
      scrollTop: getGridScrollTop(scrollContainer, gridElement),
    });

    const scheduleViewportUpdate = (isScrolling: boolean) => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        frameId = null;
        const nextViewport = readViewport(isScrolling);
        setViewport((currentViewport) =>
          areViewportsEqual(currentViewport, nextViewport)
            ? currentViewport
            : nextViewport
        );
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
  return (
    <article className="tw-group tw-relative tw-isolate">
      <Drop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        location={DropLocation.MY_STREAM}
        dropViewDropId={null}
        onReply={noop}
        onReplyClick={noop}
        onQuoteClick={noop}
        identityMode="default"
        showInteractions={false}
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
    <TweetPreviewModeProvider mode="never">
      <div className="tw-overflow-hidden tw-rounded-2xl">
        <CommunityCurationsVirtualMasonry
          drops={drops}
          scrollContainer={scrollContainer}
        />

        {((hasNextPage ?? false) || isFetchingNextPage) && (
          <div className="tw-flex tw-justify-center tw-py-6">
            {isFetchingNextPage ? (
              <CircleLoader size={CircleLoaderSize.MEDIUM} />
            ) : (
              <CommunityCurationsInfiniteScrollTrigger
                onIntersection={handleIntersection}
                scrollContainer={scrollContainer}
              />
            )}
          </div>
        )}
      </div>
    </TweetPreviewModeProvider>
  );
}
