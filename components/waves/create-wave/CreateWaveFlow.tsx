import { useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  CreateWaveScrollHintProvider,
  useCanScrollDown,
} from "./hooks/useCreateWaveScrollHint";

export default function CreateWaveFlow({
  title,
  onBack,
  children,
  isActive = true,
  pageScroll = false,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly children: ReactNode;
  readonly isActive?: boolean | undefined;
  // Native route lets the document scroll; the modal scrolls this region. When
  // page-scrolling we drop this region's `overflow`, so the sticky footer's
  // scroll context becomes the document and it pins to the viewport instead of
  // the (inert) internal container.
  readonly pageScroll?: boolean | undefined;
}) {
  const onBackRef = useRef(onBack);
  const scrollRegionRef = useRef<HTMLDivElement | null>(null);
  const canScrollDown = useCanScrollDown(scrollRegionRef, pageScroll);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  const handleBack = useCallback(() => {
    onBackRef.current?.();
  }, []);

  useEffect(() => {
    const browserWindow = globalThis.window;
    if (!browserWindow || !isActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleBack();
    };

    browserWindow.addEventListener("keydown", handleKeyDown);
    return () => {
      browserWindow.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleBack, isActive]);

  return (
    <div
      className="tailwind-scope tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-bg-iron-950"
      data-flow-title={title}
    >
      {/* Single scroll owner for the create-wave flow. The modal bounds its
          height and scrolls this region internally. The native route sits in an
          app shell that page-scrolls the document, so there we drop this
          region's `overflow` (it would otherwise be an inert scroll container
          that captures the footer's sticky context and hides it below the
          fold). Either way the footer stays a sticky child of the live
          scroller. */}
      <div
        ref={scrollRegionRef}
        className={`tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-flex-col ${
          pageScroll
            ? ""
            : "tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/15"
        }`}
      >
        <CreateWaveScrollHintProvider value={{ canScrollDown }}>
          {children}
        </CreateWaveScrollHintProvider>
      </div>
    </div>
  );
}
