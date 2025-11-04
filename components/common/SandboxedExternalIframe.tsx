"use client";

import React from "react";
import {
  canonicalizeInteractiveMediaHostname,
  isInteractiveMediaAllowedHost,
  isInteractiveMediaContentPathAllowed,
} from "@/components/waves/memes/submission/constants/security";

// Sandbox policy for external interactive media:
// - allow-scripts: Required for interactive HTML content.
// - intentionally omits allow-pointer-lock, allow-same-origin and allow-popups to preserve isolation and block window spawning.
const DEFAULT_SANDBOX = "allow-scripts";

export interface SandboxedExternalIframeProps {
  readonly src: string;
  readonly title: string;
  readonly className?: string;
  readonly fallback?: React.ReactNode;
}

const getAllowedUrl = (src: string): URL | null => {
  try {
    const parsedUrl = new URL(src);
    if (parsedUrl.protocol !== "https:") {
      return null;
    }

    if (parsedUrl.username || parsedUrl.password) {
      return null;
    }

    if (parsedUrl.search || parsedUrl.hash) {
      return null;
    }

    const normalizedHostname = canonicalizeInteractiveMediaHostname(
      parsedUrl.hostname
    );
    if (!normalizedHostname) {
      return null;
    }

    if (normalizedHostname !== parsedUrl.hostname) {
      parsedUrl.hostname = normalizedHostname;
    }

    if (parsedUrl.port) {
      if (parsedUrl.port === "443") {
        parsedUrl.port = "";
      } else {
        return null;
      }
    }

    if (!isInteractiveMediaAllowedHost(parsedUrl.hostname)) {
      return null;
    }

    if (
      !isInteractiveMediaContentPathAllowed(
        parsedUrl.hostname,
        parsedUrl.pathname
      )
    ) {
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
  fallback = null,
}) => {
  const parsedUrl = getAllowedUrl(src);
  if (!parsedUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <iframe
      src={parsedUrl.toString()}
      title={title}
      className={className}
      sandbox={DEFAULT_SANDBOX}
      // `allow=""` intentionally denies all Permission Policy features beyond the sandbox defaults.
      allow=""
      referrerPolicy="no-referrer"
      loading="lazy"
      {...({
        credentialless: "",
      } as React.IframeHTMLAttributes<HTMLIFrameElement>)}
    />
  );
};

export default SandboxedExternalIframe;
