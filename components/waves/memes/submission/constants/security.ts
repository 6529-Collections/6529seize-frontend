import { InteractiveMediaProvider } from "./media";

export const INTERACTIVE_MEDIA_ALLOWED_HOSTS = new Set<string>([
  "ipfs.io",
  "www.ipfs.io",
  "arweave.net",
  "www.arweave.net",
]);

export const INTERACTIVE_MEDIA_ALLOWED_HOST_SUFFIXES = ["arweave.net"] as const;

export const isInteractiveMediaAllowedHost = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase();
  if (INTERACTIVE_MEDIA_ALLOWED_HOSTS.has(normalized)) {
    return true;
  }

  return INTERACTIVE_MEDIA_ALLOWED_HOST_SUFFIXES.some((suffix) =>
    normalized === suffix || normalized.endsWith(`.${suffix}`)
  );
};

export const INTERACTIVE_MEDIA_HTML_EXTENSIONS = new Set<string>([
  "html",
  "htm",
  "xhtml",
]);

export const INTERACTIVE_MEDIA_GATEWAY_BASE_URL: Record<
  InteractiveMediaProvider,
  string
> = {
  ipfs: "https://ipfs.io/ipfs/",
  arweave: "https://arweave.net/",
};

export const INTERACTIVE_MEDIA_ALLOWED_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
];

export interface InteractiveMediaValidationResult {
  readonly ok: boolean;
  readonly reason?: string;
  readonly contentType?: string | null;
  readonly finalUrl?: string;
}
