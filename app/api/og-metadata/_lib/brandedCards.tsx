import { publicEnv } from "@/config/env";
import {
  formatInteger,
  getMediaProxyUrl,
  getUsableText,
  getWrappedTextLines,
  truncateText,
} from "@/app/api/og-metadata/_lib/imageUtils";
import { isAllowedOgImageSourceUrl } from "@/app/api/og-metadata/_lib/imageProxyPolicy";
import {
  NFT_SOCIAL_CARD_SIZES,
  type NftSocialCardFormat,
} from "@/components/providers/metadata";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;
const LOGO_URL = `${publicEnv.BASE_ENDPOINT}/6529.svg`;
const LOGO_SIZE = 42;
const CARD_BACKGROUND = "#141418";
const PANEL_BACKGROUND = "#0F1015";
const PANEL_BORDER = "rgba(255,255,255,0.1)";
const MUTED_TEXT = "#9A9AA5";
const ACCENT_TEXT = "#7DD3FC";
const HORIZONTAL_MARGIN = 46;
const MEDIA_LEFT = 46;
const MEDIA_TOP = 46;
const MEDIA_SIZE = 538;
const CONTENT_LEFT = 644;
const CONTENT_WIDTH = CANVAS_WIDTH - CONTENT_LEFT - HORIZONTAL_MARGIN;
const TITLE_LINE_HEIGHT = 1.08;
const COLLECTION_TITLE_FONT_SIZE = 64;
const COLLECTION_TITLE_MAX_LINES = 2;
const SUBTITLE_FONT_SIZE = 34;
const SUBTITLE_LINE_HEIGHT = 1.18;
const SUBTITLE_MAX_LINES = 3;
const BADGE_TOP = 62;
const COLLECTION_TITLE_TOP = 156;
const COLLECTION_SUBTITLE_TOP = 338;

// ImageResponse markup renders raw image elements; next/image is unavailable in generated OG image trees.
const OgRawImage = "img";

export type BrandedNftOgImageModel = {
  readonly artist?: string | null | undefined;
  readonly badge?: string | null | undefined;
  readonly collection?: string | null | undefined;
  readonly contract: string;
  readonly displayId?: string | null | undefined;
  readonly format?: NftSocialCardFormat | undefined;
  readonly id: string;
  readonly imageUrl?: string | null | undefined;
  readonly imageDataUrl?: string | undefined;
  readonly origin?: string | undefined;
  readonly subtitle?: string | null | undefined;
  readonly title: string;
};

export type BrandedCollectionOgImageModel = {
  readonly badge?: string | null | undefined;
  readonly imageUrl?: string | null | undefined;
  readonly origin?: string | undefined;
  readonly slug: string;
  readonly subtitle?: string | null | undefined;
  readonly title: string;
};

const getDisplayImageUrl = ({
  imageUrl,
  origin,
  width,
  proxyLocalAssets = false,
}: {
  readonly imageUrl: string | null | undefined;
  readonly origin: string;
  readonly width: number;
  readonly proxyLocalAssets?: boolean;
}): string | null => {
  const normalizedImageUrl = getUsableText(imageUrl);
  if (!normalizedImageUrl) {
    return null;
  }

  const getProxiedPublicHttpsUrl = (sourceUrl: string): string | null =>
    isAllowedOgImageSourceUrl(sourceUrl)
      ? getMediaProxyUrl({
          sourceUrl,
          origin,
          width,
        })
      : null;

  // Query-supplied external media must be public HTTPS and go through the
  // normal OG image proxy. Local static assets may only resolve to BASE_ENDPOINT.
  if (normalizedImageUrl.startsWith("//")) {
    return getProxiedPublicHttpsUrl(`https:${normalizedImageUrl}`);
  }

  try {
    const url = new URL(normalizedImageUrl);
    return getProxiedPublicHttpsUrl(url.toString());
  } catch {
    if (!normalizedImageUrl.startsWith("/")) {
      return null;
    }

    const resolvedUrl = new URL(normalizedImageUrl, publicEnv.BASE_ENDPOINT);
    const baseOrigin = new URL(publicEnv.BASE_ENDPOINT).origin;

    if (resolvedUrl.origin !== baseOrigin) {
      return null;
    }
    return proxyLocalAssets
      ? getProxiedPublicHttpsUrl(resolvedUrl.toString())
      : resolvedUrl.toString();
  }
};

const getTitleLines = ({
  fontSize,
  maxLines,
  value,
}: {
  readonly fontSize: number;
  readonly maxLines: number;
  readonly value: string;
}): readonly string[] =>
  getWrappedTextLines({
    value,
    fontSize,
    wrapWidth: CONTENT_WIDTH,
    maxLines,
    ellipsize: true,
  });

const getSubtitleLines = (
  value: string | null | undefined
): readonly string[] =>
  getWrappedTextLines({
    value,
    fontSize: SUBTITLE_FONT_SIZE,
    wrapWidth: CONTENT_WIDTH,
    maxLines: SUBTITLE_MAX_LINES,
    ellipsize: true,
  });

const getKeyedLines = (
  lines: readonly string[]
): readonly {
  readonly key: string;
  readonly value: string;
}[] => {
  const seenCounts = new Map<string, number>();

  return lines.map((value) => {
    const count = seenCounts.get(value) ?? 0;
    seenCounts.set(value, count + 1);

    return {
      key: count === 0 ? value : `${value}-${count}`,
      value,
    };
  });
};

const CardLogo = () => (
  <div
    style={{
      display: "flex",
      height: LOGO_SIZE,
      position: "absolute",
      right: HORIZONTAL_MARGIN,
      bottom: HORIZONTAL_MARGIN,
      width: LOGO_SIZE,
    }}
  >
    <OgRawImage
      alt=""
      height={LOGO_SIZE}
      src={LOGO_URL}
      style={{
        height: LOGO_SIZE,
        objectFit: "contain",
        opacity: 0.75,
        width: LOGO_SIZE,
      }}
      width={LOGO_SIZE}
    />
  </div>
);

const CardMedia = ({
  imageUrl,
  label,
}: {
  readonly imageUrl: string | null;
  readonly label: string;
}) => (
  <div
    style={{
      alignItems: "center",
      background: PANEL_BACKGROUND,
      border: `1px solid ${PANEL_BORDER}`,
      borderRadius: 30,
      display: "flex",
      height: MEDIA_SIZE,
      justifyContent: "center",
      left: MEDIA_LEFT,
      overflow: "hidden",
      position: "absolute",
      top: MEDIA_TOP,
      width: MEDIA_SIZE,
    }}
  >
    {imageUrl ? (
      <OgRawImage
        alt=""
        height={MEDIA_SIZE}
        src={imageUrl}
        style={{
          height: MEDIA_SIZE,
          objectFit: "contain",
          width: MEDIA_SIZE,
        }}
        width={MEDIA_SIZE}
      />
    ) : (
      <div
        style={{
          alignItems: "center",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          fontSize: 76,
          fontWeight: 700,
          gap: 18,
          justifyContent: "center",
          letterSpacing: 0,
          lineHeight: 1,
          width: MEDIA_SIZE,
        }}
      >
        <span>6529</span>
        <span
          style={{
            color: MUTED_TEXT,
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          {truncateText(label, 28)}
        </span>
      </div>
    )}
  </div>
);

const Badge = ({ value }: { readonly value: string }) => (
  <div
    style={{
      alignItems: "center",
      background: "rgba(125, 211, 252, 0.11)",
      border: "1px solid rgba(125, 211, 252, 0.3)",
      borderRadius: 999,
      color: ACCENT_TEXT,
      display: "flex",
      fontSize: 24,
      fontWeight: 700,
      height: 42,
      justifyContent: "center",
      lineHeight: 1,
      padding: "0 20px",
      position: "absolute",
      left: CONTENT_LEFT,
      top: BADGE_TOP,
      whiteSpace: "nowrap",
    }}
  >
    {value}
  </div>
);

const TitleLines = ({
  lines,
  top,
  fontSize,
}: {
  readonly fontSize: number;
  readonly lines: readonly string[];
  readonly top: number;
}) => (
  <div
    style={{
      color: "#FFFFFF",
      display: "flex",
      flexDirection: "column",
      fontSize,
      fontWeight: 800,
      left: CONTENT_LEFT,
      letterSpacing: 0,
      lineHeight: TITLE_LINE_HEIGHT,
      position: "absolute",
      top,
      width: CONTENT_WIDTH,
    }}
  >
    {getKeyedLines(lines).map(({ key, value }) => (
      <div
        key={key}
        style={{
          display: "flex",
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: CONTENT_WIDTH,
        }}
      >
        {value}
      </div>
    ))}
  </div>
);

const SubtitleLines = ({
  lines,
  top,
}: {
  readonly lines: readonly string[];
  readonly top: number;
}) => (
  <div
    style={{
      color: "#D5D5DC",
      display: "flex",
      flexDirection: "column",
      fontSize: SUBTITLE_FONT_SIZE,
      fontWeight: 500,
      left: CONTENT_LEFT,
      letterSpacing: 0,
      lineHeight: SUBTITLE_LINE_HEIGHT,
      position: "absolute",
      top,
      width: CONTENT_WIDTH,
    }}
  >
    {getKeyedLines(lines).map(({ key, value }) => (
      <div
        key={key}
        style={{
          display: "flex",
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: CONTENT_WIDTH,
        }}
      >
        {value}
      </div>
    ))}
  </div>
);

const NFT_LAYOUTS = {
  landscape: {
    margin: 46,
    mediaTop: 46,
    mediaHeight: 538,
    mediaWidth: 538,
    textLeft: 636,
    textTop: 112,
    textWidth: 518,
    titleSize: 52,
    titleLines: 3,
    footerBottom: 46,
  },
  square: {
    margin: 60,
    mediaTop: 60,
    mediaHeight: 660,
    mediaWidth: 960,
    textLeft: 60,
    textTop: 756,
    textWidth: 960,
    titleSize: 44,
    titleLines: 2,
    footerBottom: 40,
  },
  portrait: {
    margin: 60,
    mediaTop: 60,
    mediaHeight: 930,
    mediaWidth: 960,
    textLeft: 60,
    textTop: 1026,
    textWidth: 960,
    titleSize: 44,
    titleLines: 2,
    footerBottom: 40,
  },
  story: {
    margin: 60,
    mediaTop: 250,
    mediaHeight: 1030,
    mediaWidth: 960,
    textLeft: 60,
    textTop: 1320,
    textWidth: 960,
    titleSize: 50,
    titleLines: 3,
    footerBottom: 250,
  },
} as const;

export const getNftArtworkImageUrl = ({
  imageUrl,
  origin = publicEnv.BASE_ENDPOINT,
  format = "landscape",
}: BrandedNftOgImageModel): string | null =>
  getDisplayImageUrl({
    imageUrl,
    origin,
    width: NFT_LAYOUTS[format].mediaWidth,
    proxyLocalAssets: true,
  });

const getNftIdentityLabel = ({
  badge,
  collection,
  displayId,
  id,
  title,
}: BrandedNftOgImageModel): string => {
  const visibleId = getUsableText(displayId) ?? id;
  const numericId = /^(0|[1-9]\d*)$/.test(visibleId) ? Number(visibleId) : null;
  const idLabel =
    numericId !== null && Number.isSafeInteger(numericId)
      ? `#${formatInteger(numericId) ?? visibleId}`
      : `#${visibleId}`;
  const resolvedCollection = getUsableText(collection);
  const normalizedTitle = title.toLowerCase().replaceAll(",", "");
  const titleNamesCollection =
    resolvedCollection !== null &&
    (normalizedTitle === resolvedCollection.toLowerCase() ||
      normalizedTitle.includes(`${resolvedCollection.toLowerCase()} #`));
  const labels: string[] = [];
  if (resolvedCollection && !titleNamesCollection) {
    labels.push(resolvedCollection);
  } else if (
    badge &&
    badge !== resolvedCollection &&
    !normalizedTitle.includes(badge.toLowerCase())
  ) {
    labels.push(badge);
  }
  if (!normalizedTitle.split(/\s+/).includes(`#${visibleId}`)) {
    labels.push(idLabel);
  }
  return labels.join(" · ");
};

const NftTextLines = ({
  value,
  fontSize,
  maxLines,
  width,
  color,
  weight,
}: {
  readonly value: string | null | undefined;
  readonly fontSize: number;
  readonly maxLines: number;
  readonly width: number;
  readonly color: string;
  readonly weight: number;
}) => {
  const lines = getWrappedTextLines({
    value,
    fontSize,
    wrapWidth: width,
    maxLines,
    ellipsize: true,
  });
  if (lines.length === 0) {
    return null;
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        color,
        fontSize,
        fontWeight: weight,
        lineHeight: 1.12,
        width,
      }}
    >
      {getKeyedLines(lines).map(({ key, value: line }) => (
        <div key={key} style={{ display: "flex", whiteSpace: "nowrap", width }}>
          {line}
        </div>
      ))}
    </div>
  );
};

export const renderBrandedNftOgImage = (model: BrandedNftOgImageModel) => {
  const {
    artist,
    imageDataUrl,
    imageUrl,
    origin = publicEnv.BASE_ENDPOINT,
    title,
    format = "landscape",
  } = model;
  const size = NFT_SOCIAL_CARD_SIZES[format];
  const layout = NFT_LAYOUTS[format];
  const displayImageUrl =
    imageDataUrl ??
    getDisplayImageUrl({
      imageUrl,
      origin,
      width: layout.mediaWidth,
    });
  // Feed exports need actual artwork. Ordinary link previews retain a fallback.
  if (format !== "landscape" && !displayImageUrl) {
    throw new Error("Artwork image is unavailable for export.");
  }

  return (
    <div
      style={{
        background: CARD_BACKGROUND,
        color: "#FFFFFF",
        display: "flex",
        fontFamily: "Montserrat, sans-serif",
        height: size.height,
        overflow: "hidden",
        position: "relative",
        width: size.width,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          height: layout.mediaHeight,
          width: layout.mediaWidth,
          left: layout.margin,
          top: layout.mediaTop,
          position: "absolute",
        }}
      >
        {displayImageUrl ? (
          <OgRawImage
            alt=""
            src={displayImageUrl}
            height={layout.mediaHeight}
            width={layout.mediaWidth}
            style={{
              height: layout.mediaHeight,
              width: layout.mediaWidth,
              objectFit: "contain",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              color: MUTED_TEXT,
              fontSize: 76,
              fontWeight: 700,
            }}
          >
            6529
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          left: layout.textLeft,
          top: layout.textTop,
          position: "absolute",
          width: layout.textWidth,
        }}
      >
        <NftTextLines
          value={getNftIdentityLabel(model)}
          fontSize={24}
          maxLines={1}
          width={layout.textWidth}
          color={MUTED_TEXT}
          weight={500}
        />
        <NftTextLines
          value={title}
          fontSize={layout.titleSize}
          maxLines={layout.titleLines}
          width={layout.textWidth}
          color="#FFFFFF"
          weight={700}
        />
        <NftTextLines
          value={getUsableText(artist)}
          fontSize={28}
          maxLines={2}
          width={layout.textWidth}
          color="#D5D5DC"
          weight={500}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "absolute",
          right: layout.margin,
          bottom: layout.footerBottom,
          color: MUTED_TEXT,
          fontSize: 20,
        }}
      >
        <span>6529.io</span>
        <OgRawImage
          alt=""
          src={LOGO_URL}
          height={32}
          width={32}
          style={{ height: 32, width: 32, objectFit: "contain", opacity: 0.75 }}
        />
      </div>
    </div>
  );
};

export const renderBrandedCollectionOgImage = ({
  badge,
  imageUrl,
  origin = publicEnv.BASE_ENDPOINT,
  slug,
  subtitle,
  title,
}: BrandedCollectionOgImageModel) => {
  const resolvedBadge = getUsableText(badge) ?? "6529 Collections";
  const titleLines = getTitleLines({
    value: title,
    fontSize: COLLECTION_TITLE_FONT_SIZE,
    maxLines: COLLECTION_TITLE_MAX_LINES,
  });
  const subtitleLines = getSubtitleLines(subtitle);
  const displayImageUrl = getDisplayImageUrl({
    imageUrl,
    origin,
    width: MEDIA_SIZE,
  });

  return (
    <div
      style={{
        background: CARD_BACKGROUND,
        color: "#FFFFFF",
        display: "flex",
        fontFamily: "Montserrat, sans-serif",
        height: CANVAS_HEIGHT,
        overflow: "hidden",
        position: "relative",
        width: CANVAS_WIDTH,
      }}
    >
      <CardMedia imageUrl={displayImageUrl} label={title} />
      <CardLogo />
      <Badge value={resolvedBadge} />
      <TitleLines
        fontSize={COLLECTION_TITLE_FONT_SIZE}
        lines={titleLines}
        top={COLLECTION_TITLE_TOP}
      />
      <SubtitleLines lines={subtitleLines} top={COLLECTION_SUBTITLE_TOP} />
      <div
        style={{
          color: MUTED_TEXT,
          display: "flex",
          fontSize: 26,
          fontWeight: 600,
          left: CONTENT_LEFT,
          letterSpacing: 0,
          position: "absolute",
          top: 508,
        }}
      >
        {slug}
      </div>
    </div>
  );
};
