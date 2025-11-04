"use client";

import React from "react";
import { isInteractiveMediaAllowedHost } from "@/components/waves/memes/submission/constants/security";

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

const CONTENT_IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

const hasValidContentIdentifier = (url: URL): boolean => {
  const path = url.pathname ?? "";
  const segments = path.split("/").filter(Boolean);
  if (segments.includes("..")) {
    return false;
  }

  const lastSegment = segments.at(-1) ?? "";
  if (!lastSegment) {
    return false;
  }

  if (!CONTENT_IDENTIFIER_PATTERN.test(lastSegment)) {
    return false;
  }

  return true;
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

  if (!hasValidContentIdentifier(parsedUrl)) {
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
