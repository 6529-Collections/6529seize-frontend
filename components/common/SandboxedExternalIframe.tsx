"use client";

import React from "react";

const ALLOWED_HOSTS = new Set([
  "ipfs.io",
  "www.ipfs.io",
  "arweave.net",
  "www.arweave.net",
]);

const DEFAULT_SANDBOX = "allow-scripts allow-pointer-lock allow-popups";

export interface SandboxedExternalIframeProps {
  readonly src: string;
  readonly title: string;
  readonly className?: string;
  readonly sandbox?: string;
  readonly fallback?: React.ReactNode;
}

const isAllowedHost = (src: string): boolean => {
  try {
    const parsedUrl = new URL(src);
    if (parsedUrl.protocol !== "https:") {
      return false;
    }

    return ALLOWED_HOSTS.has(parsedUrl.hostname.toLowerCase());
  } catch {
    return false;
  }
};

const SandboxedExternalIframe: React.FC<SandboxedExternalIframeProps> = ({
  src,
  title,
  className,
  sandbox = DEFAULT_SANDBOX,
  fallback = null,
}) => {
  if (!isAllowedHost(src)) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <iframe
      src={src}
      title={title}
      className={className}
      sandbox={sandbox}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
};

export default SandboxedExternalIframe;

