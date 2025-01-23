import React, { forwardRef, useRef, useState } from "react";

interface FeedScrollContainerProps {
  readonly children: React.ReactNode;
  readonly onScrollUpNearTop: () => void;
  readonly onScrollDownNearBottom?: () => void;
  readonly isFetchingNextPage?: boolean;
}

const MIN_OUT_OF_VIEW_COUNT = 30;

export const FeedScrollContainer = forwardRef<
  HTMLDivElement,
  FeedScrollContainerProps
>(
  (
    { children, onScrollUpNearTop, onScrollDownNearBottom, isFetchingNextPage },
    ref
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [lastScrollTop, setLastScrollTop] = useState(0);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      if (!ref || !("current" in ref) || !ref.current) return;
      if (isFetchingNextPage) return;

      const currentTarget = event.currentTarget;
      const currentScrollTop = currentTarget.scrollTop;
      const direction = currentScrollTop > lastScrollTop ? "down" : "up";
      setLastScrollTop(currentScrollTop);

      if (direction === "up") {
        const dropElements =
          contentRef.current?.querySelectorAll("[id^='feed-item-']");
        if (!dropElements) return;

        const containerRect = currentTarget.getBoundingClientRect();
        let outOfViewCount = 0;

        dropElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < containerRect.top) {
            outOfViewCount++;
          }
        });

        if (outOfViewCount <= MIN_OUT_OF_VIEW_COUNT) {
          onScrollUpNearTop();
        }
      }

      if (direction === "down" && onScrollDownNearBottom) {
        const { scrollHeight, scrollTop, clientHeight } = currentTarget;
        const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (scrolledToBottom) {
          onScrollDownNearBottom();
        }
      }
    };

    return (
      <div
        ref={ref}
        style={{ overflowAnchor: "none" }}
        className="tw-flex tw-flex-col-reverse tw-overflow-x-hidden lg:tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 lg:tw-pr-2 tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0"
        onScroll={handleScroll}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    );
  }
);

FeedScrollContainer.displayName = "FeedScrollContainer";
