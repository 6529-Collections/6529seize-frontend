import { load } from "cheerio";

import type {
  FarcasterEmbedKind,
  FarcasterEmbedLinkPreview,
  LinkPreviewMedia,
  LinkPreviewResponse,
} from "@/services/api/link-preview-api";

type LoadedHtml = ReturnType<typeof load>;

interface BuildFarcasterEmbedOptions {
  readonly assertPublicUrl: (url: URL) => Promise<void>;
}

const META_JSON_MAX_CHARS = 16 * 1024;
const TEXT_MAX_CHARS = 180;
const ACTION_URL_MAX_CHARS = 2048;
const MAX_LEGACY_FRAME_BUTTONS = 4;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const MINIAPP_META_KEYS = ["fc:miniapp"] as const;
const FRAME_META_KEYS = ["fc:frame"] as const;
const FRAME_IMAGE_KEYS = [
  "fc:frame:image",
  "og:image",
  "twitter:image",
] as const;
const TITLE_KEYS = ["og:title", "twitter:title"] as const;
const DESCRIPTION_KEYS = ["og:description", "twitter:description"] as const;
const SITE_NAME_KEYS = ["og:site_name", "application-name"] as const;

type MiniAppMetadata = {
  readonly version?: unknown;
  readonly imageUrl?: unknown;
  readonly button?: {
    readonly title?: unknown;
    readonly action?: {
      readonly type?: unknown;
      readonly name?: unknown;
      readonly url?: unknown;
      readonly splashImageUrl?: unknown;
      readonly splashBackgroundColor?: unknown;
    };
  };
};

interface LegacyFrameButton {
  readonly label: string;
  readonly action: string | null;
  readonly target: string | null;
}

function normalizeWhitespace(value: string | undefined): string | undefined {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function readString(value: unknown, maxChars = TEXT_MAX_CHARS): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxChars);
}

function getMetaIdentifier($: LoadedHtml, element: unknown): string | undefined {
  const tag = $(element);
  return normalizeWhitespace(
    tag.attr("property") ?? tag.attr("name") ?? tag.attr("itemprop")
  )?.toLowerCase();
}

function getFirstMetaContent(
  $: LoadedHtml,
  keys: readonly string[]
): string | undefined {
  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  let result: string | undefined;

  $("meta").each((_index: number, element: unknown) => {
    if (result) {
      return;
    }

    const identifier = getMetaIdentifier($, element);
    if (!identifier || !keySet.has(identifier)) {
      return;
    }

    result = normalizeWhitespace($(element).attr("content"));
  });

  return result;
}

function getTitleTag($: LoadedHtml): string | null {
  return readString($("title").first().text());
}

function parseMiniAppMetadata(value: string | undefined): MiniAppMetadata | null {
  if (!value || value.length > META_JSON_MAX_CHARS) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    return parsed as MiniAppMetadata;
  } catch {
    return null;
  }
}

function getFallbackTitle(
  $: LoadedHtml,
  basePreview: LinkPreviewResponse
): string | null {
  return (
    readString(basePreview.title) ??
    readString(getFirstMetaContent($, TITLE_KEYS)) ??
    getTitleTag($)
  );
}

function getFallbackDescription(
  $: LoadedHtml,
  basePreview: LinkPreviewResponse
): string | null {
  return (
    readString(basePreview.description, 260) ??
    readString(getFirstMetaContent($, DESCRIPTION_KEYS), 260)
  );
}

function getFallbackSiteName(
  $: LoadedHtml,
  basePreview: LinkPreviewResponse,
  url: URL
): string {
  return (
    readString(basePreview.siteName) ??
    readString(basePreview.source) ??
    readString(getFirstMetaContent($, SITE_NAME_KEYS)) ??
    url.hostname.replace(/^www\./i, "")
  );
}

async function resolvePublicUrl(
  baseUrl: string,
  value: string | null,
  assertPublicUrl: (url: URL) => Promise<void>
): Promise<string | null> {
  if (!value || value.length > ACTION_URL_MAX_CHARS) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value, baseUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  try {
    await assertPublicUrl(parsed);
  } catch {
    return null;
  }

  return parsed.toString();
}

function normalizeSplashColor(value: unknown): string | null {
  const color = readString(value, 7);
  return color && COLOR_PATTERN.test(color) ? color : null;
}

function createImageEntry(imageUrl: string | null): LinkPreviewMedia | null {
  return imageUrl
    ? {
        url: imageUrl,
        secureUrl: imageUrl,
      }
    : null;
}

function buildPreview({
  actionType,
  actionUrl,
  appName,
  basePreview,
  buttonTitle,
  buttons,
  description,
  embedKind,
  imageUrl,
  siteName,
  splashBackgroundColor,
  splashImageUrl,
  title,
  url,
}: {
  readonly actionType?: string | null | undefined;
  readonly actionUrl?: string | null | undefined;
  readonly appName?: string | null | undefined;
  readonly basePreview: LinkPreviewResponse;
  readonly buttonTitle?: string | null | undefined;
  readonly buttons?: readonly string[] | null | undefined;
  readonly description?: string | null | undefined;
  readonly embedKind: FarcasterEmbedKind;
  readonly imageUrl?: string | null | undefined;
  readonly siteName: string;
  readonly splashBackgroundColor?: string | null | undefined;
  readonly splashImageUrl?: string | null | undefined;
  readonly title?: string | null | undefined;
  readonly url: URL;
}): FarcasterEmbedLinkPreview {
  const image = createImageEntry(imageUrl ?? null);
  const resolvedTitle = title ?? appName ?? buttonTitle ?? siteName;
  const responseType =
    embedKind === "legacy-frame" ? "farcaster.frame" : "farcaster.miniapp";

  return {
    ...basePreview,
    type: responseType,
    requestUrl: basePreview.requestUrl ?? url.toString(),
    url: actionUrl ?? basePreview.url ?? url.toString(),
    title: resolvedTitle,
    description: description ?? basePreview.description ?? null,
    siteName,
    mediaType: "application",
    source: siteName,
    image,
    images: image ? [image] : [],
    embedKind,
    appName: appName ?? null,
    buttonTitle: buttonTitle ?? null,
    actionType: actionType ?? null,
    actionUrl: actionUrl ?? null,
    imageUrl: imageUrl ?? null,
    splashImageUrl: splashImageUrl ?? null,
    splashBackgroundColor: splashBackgroundColor ?? null,
    buttons: buttons ?? null,
  };
}

async function buildJsonPreview(
  $: LoadedHtml,
  url: URL,
  basePreview: LinkPreviewResponse,
  metadata: MiniAppMetadata,
  embedKind: FarcasterEmbedKind,
  options: BuildFarcasterEmbedOptions
): Promise<FarcasterEmbedLinkPreview | null> {
  const imageUrl = await resolvePublicUrl(
    url.toString(),
    readString(metadata.imageUrl, ACTION_URL_MAX_CHARS),
    options.assertPublicUrl
  );
  if (!imageUrl) {
    return null;
  }

  const button = metadata.button;
  const action = button?.action;
  const buttonTitle = readString(button?.title, 64);
  const actionType = readString(action?.type, 64);
  const appName = readString(action?.name, 96);
  const actionUrl =
    (await resolvePublicUrl(
      url.toString(),
      readString(action?.url, ACTION_URL_MAX_CHARS),
      options.assertPublicUrl
    )) ?? url.toString();
  const splashImageUrl = await resolvePublicUrl(
    url.toString(),
    readString(action?.splashImageUrl, ACTION_URL_MAX_CHARS),
    options.assertPublicUrl
  );
  const siteName = appName ?? getFallbackSiteName($, basePreview, url);

  return buildPreview({
    actionType,
    actionUrl,
    appName,
    basePreview,
    buttonTitle,
    buttons: buttonTitle ? [buttonTitle] : null,
    description: getFallbackDescription($, basePreview),
    embedKind,
    imageUrl,
    siteName,
    splashBackgroundColor: normalizeSplashColor(action?.splashBackgroundColor),
    splashImageUrl,
    title: appName ?? getFallbackTitle($, basePreview),
    url,
  });
}

async function buildLegacyFramePreview(
  $: LoadedHtml,
  url: URL,
  basePreview: LinkPreviewResponse,
  options: BuildFarcasterEmbedOptions
): Promise<FarcasterEmbedLinkPreview | null> {
  if (!getFirstMetaContent($, FRAME_META_KEYS)) {
    return null;
  }

  const imageUrl = await resolvePublicUrl(
    url.toString(),
    readString(getFirstMetaContent($, FRAME_IMAGE_KEYS), ACTION_URL_MAX_CHARS),
    options.assertPublicUrl
  );
  const title = getFallbackTitle($, basePreview);
  if (!imageUrl && !title) {
    return null;
  }

  const buttons: LegacyFrameButton[] = [];
  for (let index = 1; index <= MAX_LEGACY_FRAME_BUTTONS; index += 1) {
    const label = readString(
      getFirstMetaContent($, [`fc:frame:button:${index}`]),
      64
    );
    if (label) {
      const action = readString(
        getFirstMetaContent($, [`fc:frame:button:${index}:action`]),
        64
      );
      const target = await resolvePublicUrl(
        url.toString(),
        readString(getFirstMetaContent($, [`fc:frame:button:${index}:target`])),
        options.assertPublicUrl
      );
      buttons.push({ action, label, target });
    }
  }

  const firstLinkButton = buttons.find(
    (button) => button.action === "link" && button.target
  );
  const buttonLabels = buttons.map((button) => button.label);
  const siteName = getFallbackSiteName($, basePreview, url);

  return buildPreview({
    actionUrl: firstLinkButton?.target ?? url.toString(),
    appName: siteName,
    basePreview,
    buttonTitle: firstLinkButton?.label ?? buttonLabels[0] ?? null,
    buttons: buttonLabels,
    description: getFallbackDescription($, basePreview),
    embedKind: "legacy-frame",
    imageUrl,
    siteName,
    title,
    url,
  });
}

export async function buildFarcasterEmbedResponse(
  url: URL,
  html: string,
  basePreview: LinkPreviewResponse,
  options: BuildFarcasterEmbedOptions
): Promise<FarcasterEmbedLinkPreview | null> {
  const $ = load(html);
  const miniAppMetadata = parseMiniAppMetadata(
    getFirstMetaContent($, MINIAPP_META_KEYS)
  );
  if (miniAppMetadata) {
    const preview = await buildJsonPreview(
      $,
      url,
      basePreview,
      miniAppMetadata,
      "miniapp",
      options
    );
    if (preview) {
      return preview;
    }
  }

  const frameMetadata = parseMiniAppMetadata(
    getFirstMetaContent($, FRAME_META_KEYS)
  );
  if (frameMetadata) {
    const preview = await buildJsonPreview(
      $,
      url,
      basePreview,
      frameMetadata,
      "frame",
      options
    );
    if (preview) {
      return preview;
    }
  }

  return buildLegacyFramePreview($, url, basePreview, options);
}
