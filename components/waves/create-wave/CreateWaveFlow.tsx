import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  CreateWaveScrollHintProvider,
  useCanScrollDown,
} from "./hooks/useCreateWaveScrollHint";
import { CREATE_WAVE_FORM_CONTROL_SCOPE_STYLES } from "./utils/createWaveFormStyles";

export default function CreateWaveFlow({
  title,
  onBack,
  children,
  isActive = true,
  nativeBoundedStyle,
  scrollResetKey,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly children: ReactNode;
  readonly isActive?: boolean | undefined;
  // Bumped when the flow should snap back to the top of ITS OWN scrollport
  // (e.g. a step change). We reset THIS region's scrollTop rather than
  // scrollIntoView-ing the container: the container's nearest scrollable
  // ancestor is the app-shell scroller, so scrolling that would ride the app
  // header (its back arrow) up under the status bar and leave a black gap.
  readonly scrollResetKey?: string | number | undefined;
  // Native app shell only. The web modal bounds this region's height itself, so
  // its internal `overflow-y-auto` is already a real scrollport and the sticky
  // footer pins to it. The native /waves/create route has no such bounding
  // ancestor, and the app shell wraps the view in transformed elements
  // (pull-to-refresh root + framer-motion) — a transform between the footer and
  // its scroll container defeats sticky on WKWebView/Chromium alike. Applying
  // the app's own measured content height here makes THIS region the scrollport
  // (no transform between it and the footer), so the footer sticks on iOS and
  // Android. Reserve-free: the height is measured by the layout system, not
  // hardcoded.
  readonly nativeBoundedStyle?: CSSProperties | undefined;
}) {
  const onBackRef = useRef(onBack);
  const scrollRegionRef = useRef<HTMLDivElement | null>(null);
  // The region is always the scrollport now (the native route no longer defers
  // to document scroll), so the "more below" hint always reads this element.
  const canScrollDown = useCanScrollDown(scrollRegionRef, false);

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

  // Snap the inner scrollport back to the top on step change, after the new
  // step's content has laid out. Never touches the app-shell scroller, so the
  // header stays put.
  useEffect(() => {
    const region = scrollRegionRef.current;
    if (!region) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      region.scrollTop = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollResetKey]);

  return (
    <div
      className={`tailwind-scope tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-bg-iron-950 ${CREATE_WAVE_FORM_CONTROL_SCOPE_STYLES}`}
      data-flow-title={title}
    >
      {/* Single scroll owner for the create-wave flow. It is always an
          internal `overflow-y-auto` scrollport so the sticky footer pins to it.
          The modal bounds the height via its own flex box; the native route
          passes `nativeBoundedStyle` (the layout system's measured content
          height) so this region gets a real bounded height inside the app
          shell instead of overflowing it. */}
      <div
        ref={scrollRegionRef}
        style={nativeBoundedStyle}
        className="tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-flex-col tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/15"
      >
        <CreateWaveScrollHintProvider value={{ canScrollDown }}>
          {children}
        </CreateWaveScrollHintProvider>
      </div>
    </div>
  );
}
