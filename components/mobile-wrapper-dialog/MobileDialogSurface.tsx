"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";

const VIEW_RESIZE_MS = 220;
const KEYBOARD_DURATION =
  "var(--native-keyboard-layout-transition-duration, 0ms)";
const KEYBOARD_EASING =
  "var(--native-keyboard-layout-transition-easing, ease-out)";

interface SurfaceProps {
  readonly children: ReactNode;
  readonly className: string;
  readonly style: CSSProperties;
  readonly dialogHeight: string;
  readonly fixedHeight?: boolean | undefined;
  readonly resizeKey?: string | undefined;
  readonly isOpen: boolean;
}

function ResizingSurface({
  children,
  className,
  style,
  dialogHeight,
  fixedHeight,
  resizeKey,
  isOpen,
}: SurfaceProps & { readonly resizeKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const keyboard = useNativeKeyboard();
  const previousView = useRef<string | null>(null);

  useLayoutEffect(() => {
    const surface = ref.current;
    if (!isOpen || !surface) {
      previousView.current = null;
      return;
    }
    const changingView =
      previousView.current !== null && previousView.current !== resizeKey;
    previousView.current = resizeKey;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let previousContent: Element | null = null;
    let previousDimensions = "";
    const measure = () => {
      const content =
        surface.querySelector("[data-dialog-content-size]")?.firstElementChild ??
        null;
      const header = surface.querySelector("[data-mobile-dialog-header]");
      if (!fixedHeight && !content) return;
      const bounds = content?.getBoundingClientRect();
      const headerBounds = header?.getBoundingClientRect();
      const dimensions = [
        bounds?.width,
        bounds?.height,
        headerBounds?.width,
        headerBounds?.height,
      ].join(":");
      if (content === previousContent && dimensions === previousDimensions)
        return;
      previousContent = content;
      previousDimensions = dimensions;

      // Measure natural content before paint, then animate from the height
      // currently on screen. Parent resize frames never retrigger this read.
      const currentHeight = surface.getBoundingClientRect().height;
      surface.style.transitionProperty = "none";
      surface.style.height = "auto";
      const nextHeight = Math.ceil(surface.getBoundingClientRect().height);
      surface.style.height = `${currentHeight}px`;
      surface.getBoundingClientRect();
      const duration =
        changingView && keyboard.phase === "hidden"
          ? `${VIEW_RESIZE_MS}ms`
          : KEYBOARD_DURATION;
      surface.style.transitionProperty = "height";
      surface.style.transitionDuration = duration;
      surface.style.transitionTimingFunction = KEYBOARD_EASING;
      surface.style.height =
        !fixedHeight && nextHeight > 0
          ? `min(${nextHeight}px, ${dialogHeight})`
          : dialogHeight;
      globalThis.clearTimeout(timer);
      timer = globalThis.setTimeout(() => {
        surface.style.transitionDuration = KEYBOARD_DURATION;
      }, VIEW_RESIZE_MS);
    };
    const observer = new ResizeObserver(measure);
    const watchContent = () => {
      observer.disconnect();
      const content = surface.querySelector(
        "[data-dialog-content-size]"
      )?.firstElementChild;
      const header = surface.querySelector("[data-mobile-dialog-header]");
      if (content) observer.observe(content);
      if (header) observer.observe(header);
      measure();
    };
    const mutations = new MutationObserver(watchContent);
    mutations.observe(surface, { childList: true, subtree: true });
    watchContent();
    return () => {
      globalThis.clearTimeout(timer);
      observer.disconnect();
      mutations.disconnect();
    };
  }, [dialogHeight, fixedHeight, isOpen, keyboard.phase, resizeKey]);

  useEffect(() => {
    if (keyboard.phase !== "hidden" && ref.current)
      ref.current.style.transitionDuration = KEYBOARD_DURATION;
  }, [keyboard.phase]);

  useEffect(() => {
    const surface = ref.current;
    if (!isOpen || !surface) return;
    // Browser and native keyboard frames retain the shared keyboard timing,
    // even when focus interrupts a view's resize animation.
    const stopViewMotion = () => {
      surface.style.transitionDuration = KEYBOARD_DURATION;
    };
    const viewport = globalThis.visualViewport;
    viewport?.addEventListener("resize", stopViewMotion);
    return () => viewport?.removeEventListener("resize", stopViewMotion);
  }, [isOpen]);

  return (
    <div
      ref={ref}
      data-mobile-dialog-surface
      className={`${className} motion-reduce:!tw-transition-none`}
      style={{
        ...style,
        maxHeight: undefined,
        height: undefined,
      }}
    >
      {children}
    </div>
  );
}

export default function MobileDialogSurface(props: SurfaceProps) {
  if (props.resizeKey !== undefined)
    return <ResizingSurface {...props} resizeKey={props.resizeKey} />;
  return (
    <div
      data-mobile-dialog-surface
      className={props.className}
      style={props.style}
    >
      {props.children}
    </div>
  );
}
