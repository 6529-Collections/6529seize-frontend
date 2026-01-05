"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { canonicalizeInteractiveMediaUrl } from "@/components/waves/memes/submission/constants/security";

// Sandbox policy for external interactive media:
// - allow-scripts: Required for interactive HTML content.
// - intentionally omits allow-pointer-lock, allow-same-origin and allow-popups to preserve isolation and block window spawning.
const DEFAULT_SANDBOX = "allow-scripts";

export interface SandboxedExternalIframeProps {
  readonly src: string;
  readonly title: string;
  readonly className?: string | undefined;
  readonly fallback?: React.ReactNode | undefined;
  readonly containerClassName?: string | undefined;
}

/**
 * Render untrusted interactive media inside a strongly sandboxed iframe.
 *
 * Security notes:
 * - keep allow-same-origin disabled to force an opaque origin boundary.
 * - deny all Permission Policy features via an explicit empty `allow` attribute.
 * - enforce HTTPS and strip referrers; credentialless removes ambient cookies where supported.
 * - the sandbox isolates the frame even if it redirects after the initial load.
 */
const SandboxedExternalIframe: React.FC<SandboxedExternalIframeProps> = ({
  src,
  title,
  className,
  fallback = null,
  containerClassName,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const canonicalSrc = useMemo(
    () => canonicalizeInteractiveMediaUrl(src),
    [src]
  );

  const frameClassName = useMemo(() => {
    const classes = ["tw-h-full", "tw-w-full", className].filter(
      (value): value is string => Boolean(value)
    );
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
      return;
    }

    const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        if (isIntersecting) {
          setIsVisible(true);
          observerInstance.disconnect();
        }
      },
      { root: null, threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [canonicalSrc, isVisible]);

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

  const iframeProps = useMemo(() => {
    if (!canonicalSrc) {
      return null;
    }

    const baseProps = {
      src: canonicalSrc,
      title,
      sandbox: DEFAULT_SANDBOX,
      // `allow=""` intentionally denies all Permission Policy features beyond the sandbox defaults.
      allow: "",
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
  }, [canonicalSrc, frameClassName, title]);

  if (!canonicalSrc || !iframeProps) {
    return fallback ? <>{fallback}</> : null;
  }

  const placeholder = (
    <div className={frameClassName} aria-hidden="true" role="presentation" />
  );

  const banner = (
    <div
      className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-t-md tw-border tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2"
      aria-live="polite"
    >
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-300">
        Untrusted interactive content
      </span>
      {parsedCanonicalUrl ? (
        <a
          href={canonicalSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-text-xs tw-font-medium tw-text-primary-300 hover:tw-text-primary-200 tw-transition"
        >
          {parsedCanonicalUrl.hostname}
        </a>
      ) : (
        <span className="tw-text-xs tw-text-iron-400">{canonicalSrc}</span>
      )}
    </div>
  );

  const containerClasses = ["tw-flex", "tw-flex-col", "tw-h-full", containerClassName]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return (
    <div ref={containerRef} className={containerClasses}>
      {banner}
      <div className="tw-flex-1 tw-min-h-0 tw-overflow-hidden">
        {isVisible ? <iframe {...iframeProps} /> : placeholder}
      </div>
    </div>
  );
};

export default SandboxedExternalIframe;
