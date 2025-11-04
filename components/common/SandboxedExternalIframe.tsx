"use client";

import React from "react";
import {
  INTERACTIVE_MEDIA_HTML_EXTENSIONS,
  isInteractiveMediaAllowedHost,
} from "@/components/waves/memes/submission/constants/security";

// Sandbox policy for external interactive media:
// - allow-scripts: Required for interactive HTML content.
// - allow-pointer-lock: Enables immersive pointer capture for canvas / 3D experiences.
// - intentionally omits allow-same-origin and allow-popups to preserve isolation and block window spawning.
const DEFAULT_SANDBOX = "allow-scripts allow-pointer-lock";

export interface SandboxedExternalIframeProps {
  readonly src: string;
  readonly title: string;
  readonly className?: string;
  readonly sandbox?: string;
  readonly fallback?: React.ReactNode;
}

const hasAllowedHtmlExtension = (url: URL): boolean => {
  const path = url.pathname ?? "";
  const segments = path.split("/").filter(Boolean);
  if (segments.includes("..")) {
    return false;
  }

  const lastSegment = segments.at(-1) ?? "";
  if (!lastSegment) {
    return true;
  }

  if (!lastSegment.includes(".")) {
    return true;
  }

  const extension = lastSegment.slice(lastSegment.lastIndexOf(".") + 1).toLowerCase();
  return INTERACTIVE_MEDIA_HTML_EXTENSIONS.has(extension);
};

const getAllowedUrl = (src: string): URL | null => {
  try {
    const parsedUrl = new URL(src);
    if (parsedUrl.protocol !== "https:") {
      return null;
    }

    if (parsedUrl.search || parsedUrl.hash) {
      return null;
    }

    if (!isInteractiveMediaAllowedHost(parsedUrl.hostname)) {
      return null;
    }

    return parsedUrl;
  } catch {
    return null;
  }
};

const SandboxedExternalIframe: React.FC<SandboxedExternalIframeProps> = ({
  src,
  title,
  className,
  sandbox = DEFAULT_SANDBOX,
  fallback = null,
}) => {
  const parsedUrl = getAllowedUrl(src);
  if (!parsedUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!hasAllowedHtmlExtension(parsedUrl)) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <iframe
      src={src}
      title={title}
      className={className}
      sandbox={sandbox}
      allow=""
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
};

export default SandboxedExternalIframe;
