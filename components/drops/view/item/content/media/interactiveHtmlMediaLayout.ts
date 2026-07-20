const INTERACTIVE_HTML_MEDIA_MIME_TYPE = "text/html";

export const INTERACTIVE_HTML_MEDIA_CONTAINER_CLASS_NAME =
  "tw-mx-auto tw-w-full tw-max-w-[min(48rem,calc(80svh-3rem))]";

export const INTERACTIVE_HTML_MEDIA_VIEWPORT_CLASS_NAME =
  "tw-aspect-[11/16] tw-flex-none sm:tw-aspect-square";

export const isInteractiveHtmlMedia = (mimeType: string): boolean =>
  mimeType === INTERACTIVE_HTML_MEDIA_MIME_TYPE;
