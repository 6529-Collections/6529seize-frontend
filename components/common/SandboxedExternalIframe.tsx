"use client";

import { canonicalizeInteractiveMediaUrl } from "@/components/waves/memes/submission/constants/security";
import { publicEnv } from "@/config/env";
import { requestElementFullScreen } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { useFullScreenSupported } from "@/hooks/useFullScreenSupported";
import { t } from "@/i18n/messages";
import { toIsolatedHtmlUrlFromInput } from "@/lib/media/decentralized-media";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Sandbox policy for external interactive media:
// - allow-scripts: Required for interactive HTML content.
// - intentionally omits allow-pointer-lock, allow-same-origin and allow-popups to preserve isolation and block window spawning.
const DEFAULT_SANDBOX = "allow-scripts";

interface SandboxedExternalIframeProps {
  readonly src: string;
  readonly title: string;
  readonly className?: string | undefined;
  readonly fallback?: React.ReactNode | undefined;
  readonly containerClassName?: string | undefined;
  readonly onLoad?:
    | React.IframeHTMLAttributes<HTMLIFrameElement>["onLoad"]
    | undefined;
  readonly onError?:
    | React.IframeHTMLAttributes<HTMLIFrameElement>["onError"]
    | undefined;
  readonly iframeRef?: React.Ref<HTMLIFrameElement> | undefined;
  /** Fires once when the container scrolls into view and the iframe is about to render. */
  readonly onVisible?: (() => void) | undefined;
  /**
   * Show a banner control that expands the sandboxed frame to full screen.
   * Leave it off when the parent already offers its own full-screen action.
   */
  readonly showFullscreenControl?: boolean | undefined;
}

/**
 * Render untrusted interactive media inside a strongly sandboxed iframe.
 *
 * Security notes:
 * - keep allow-same-origin disabled to force an opaque origin boundary.
 * - grant only the `fullscreen` Permission Policy feature, so the frame itself can be expanded.
 * - enforce HTTPS and strip referrers; credentialless removes ambient cookies where supported.
 * - the sandbox isolates the frame even if it redirects after the initial load.
 * - the source is never offered as a top-level link: viewers expand the
 *   sandboxed frame itself, so the media always keeps the frame's isolation.
 */
const SandboxedExternalIframe: React.FC<SandboxedExternalIframeProps> = ({
  src,
  title,
  className,
  fallback = null,
  containerClassName,
  onLoad,
  onError,
  iframeRef,
  onVisible,
  showFullscreenControl = false,
}) => {
  const locale = useBrowserLocale();
  const { isCapacitor } = useCapacitor();
  const supportsFullScreen = useFullScreenSupported();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // The frame is the only iframe in this component's container, so the
  // caller's iframeRef stays untouched and is passed straight through.
  const expandFrame = useCallback(async () => {
    const frame = containerRef.current?.querySelector("iframe");
    if (!frame) {
      return;
    }
    try {
      // The helper logs a refused or unsupported request and resolves false.
      await requestElementFullScreen(frame);
    } catch (error: unknown) {
      console.error("Could not expand interactive media", error);
    }
  }, []);

  const canonicalSrc = useMemo(
    () => canonicalizeInteractiveMediaUrl(src),
    [src]
  );

  const frameClassName = useMemo(() => {
    const classes = [
      "tw-block",
      "tw-h-full",
      "tw-w-full",
      "tw-border-0",
      className,
    ].filter((value): value is string => Boolean(value));
    return classes.join(" ");
  }, [className]);

  useEffect(() => {
    if (!canonicalSrc) {
      return;
    }

    if (isVisible) {
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      onVisible?.();
      return;
    }

    const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        if (isIntersecting) {
          setIsVisible(true);
          onVisible?.();
          observerInstance.disconnect();
        }
      },
      { root: null, threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [canonicalSrc, isVisible, onVisible]);

  const parsedCanonicalUrl = useMemo(() => {
    if (!canonicalSrc) {
      return null;
    }

    try {
      return new URL(canonicalSrc);
    } catch {
      return null;
    }
  }, [canonicalSrc]);

  const iframeTitle = useMemo(() => {
    if (!canonicalSrc) {
      return title;
    }

    return `${title}: ${canonicalSrc}`;
  }, [canonicalSrc, title]);

  const iframeProps = useMemo(() => {
    if (!canonicalSrc) {
      return null;
    }

    const baseProps = {
      // IPFS HTML on the separate content domain loads from its own per-CID
      // origin; with any other resolver this is the canonical URL itself.
      src: toIsolatedHtmlUrlFromInput(
        canonicalSrc,
        publicEnv.MEDIA_RESOLVER_ENDPOINT
      ),
      sandbox: DEFAULT_SANDBOX,
      // Fullscreen is allowed so the parent viewer can expand the isolated frame itself.
      allow: "fullscreen",
      allowFullScreen: true,
      referrerPolicy: "no-referrer",
      loading: "lazy",
    } as React.IframeHTMLAttributes<HTMLIFrameElement> & {
      fetchPriority?: "high" | "low" | "auto" | undefined;
      credentialless?: string | undefined;
    };

    baseProps.fetchPriority = "low";
    baseProps.credentialless = "";
    baseProps.className = frameClassName;

    return baseProps;
  }, [canonicalSrc, frameClassName]);

  if (!canonicalSrc || !iframeProps) {
    return fallback ? <>{fallback}</> : null;
  }

  const placeholder = (
    <div className={frameClassName} aria-hidden="true" role="presentation" />
  );

  const canExpand =
    showFullscreenControl && isVisible && supportsFullScreen && !isCapacitor;

  const banner = (
    <div
      className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-t-md tw-border tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2"
      aria-live="polite"
    >
      <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-300">
        {t(locale, "media.interactive.untrustedContent")}
      </span>
      <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
        {/* The source is shown, never linked: opening it would leave the sandbox. */}
        <span
          className="tw-min-w-0 tw-truncate tw-text-xs tw-text-iron-400"
          translate="no"
        >
          {parsedCanonicalUrl?.hostname ?? canonicalSrc}
        </span>
        {canExpand ? (
          <button
            type="button"
            onClick={() => {
              void expandFrame();
            }}
            className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-min-h-6 tw-shrink-0 tw-items-center tw-gap-1 tw-rounded tw-border-0 tw-bg-transparent tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-primary-300 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            <ArrowsPointingOutIcon
              aria-hidden="true"
              className="tw-size-4 tw-shrink-0"
            />
            {t(locale, "media.interactive.fullscreen")}
          </button>
        ) : null}
      </span>
    </div>
  );

  const containerClasses = [
    "tw-flex",
    "tw-flex-col",
    "tw-h-full",
    containerClassName,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return (
    <div ref={containerRef} className={containerClasses}>
      {banner}
      <div className="tw-min-h-0 tw-flex-1 tw-overflow-hidden">
        {isVisible ? (
          <iframe
            {...iframeProps}
            ref={iframeRef}
            title={iframeTitle}
            onLoad={onLoad}
            onError={onError}
          />
        ) : (
          placeholder
        )}
      </div>
    </div>
  );
};

export default SandboxedExternalIframe;
