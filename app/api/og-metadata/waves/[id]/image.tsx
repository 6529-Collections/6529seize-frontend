import { publicEnv } from "@/config/env";
import { CICType } from "@/entities/IProfile";
import type { ApiOgMediaAsset } from "@/generated/models/ApiOgMediaAsset";
import type { ApiOgMetadataProfile } from "@/generated/models/ApiOgMetadataProfile";
import type { ApiOgMetadataWave } from "@/generated/models/ApiOgMetadataWave";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;
const HORIZONTAL_MARGIN = 34;
const LEFT_MEDIA_WIDTH = 410;
const LEFT_MEDIA_PADDING = 34;
const LEFT_MEDIA_CONTENT_WIDTH = LEFT_MEDIA_WIDTH - LEFT_MEDIA_PADDING * 2;
const LEFT_MEDIA_CONTENT_HEIGHT = CANVAS_HEIGHT - LEFT_MEDIA_PADDING * 2;
const CONTENT_LEFT = LEFT_MEDIA_WIDTH + 58;
const CONTENT_WIDTH = CANVAS_WIDTH - CONTENT_LEFT - HORIZONTAL_MARGIN;
const LOGO_URL = `${publicEnv.BASE_ENDPOINT}/6529.svg`;
const LOGO_SIZE = 42;
const MEDIA_PROXY_PATH = "/api/og-metadata/image";
const CARD_BACKGROUND = "#131316";
const TITLE_TOP = 70;
const TITLE_FONT_SIZE = 52;
const TITLE_LINE_HEIGHT = 1.14;
const WAVE_DESCRIPTION_FONT_SIZE = 36;
const WAVE_DESCRIPTION_LINE_HEIGHT = 1.18;
const WAVE_DESCRIPTION_MAX_LINES = 3;
const CREATOR_ROW_TOP = 405;
const STATS_ROW_TOP = 510;
const CREATOR_AVATAR_SIZE = 62;
const CREATOR_AVATAR_INNER_SIZE = 56;
const CREATOR_BADGE_SIZE = 42;
const LEVEL_COLORS = [
  { minLevel: 80, color: "#55B075" },
  { minLevel: 60, color: "#AABE68" },
  { minLevel: 40, color: "#DAC660" },
  { minLevel: 20, color: "#DAAC60" },
  { minLevel: 0, color: "#DA8C60" },
] as const;
const CIC_BADGE_STYLES: Record<
  CICType,
  {
    readonly background: string;
    readonly color: string;
    readonly icon: "glasses" | "text";
    readonly label: string;
  }
> = {
  [CICType.INACCURATE]: {
    background: "#F97066",
    color: "#0A0A0A",
    icon: "text",
    label: "!",
  },
  [CICType.UNKNOWN]: {
    background: "#FEDF89",
    color: "#0A0A0A",
    icon: "text",
    label: "?",
  },
  [CICType.PROBABLY_ACCURATE]: {
    background: "#AAF0C4",
    color: "#0A0A0A",
    icon: "glasses",
    label: "",
  },
  [CICType.ACCURATE]: {
    background: "#73E2A3",
    color: "#0A0A0A",
    icon: "glasses",
    label: "",
  },
  [CICType.HIGHLY_ACCURATE]: {
    background: "#3CCB7F",
    color: "#0A0A0A",
    icon: "glasses",
    label: "",
  },
};
const CIC_GLASSES_FRAME_PATH =
  "M161.834 63.7197C166.468 74.1749 169.431 85.2818 170.305 97.1606C171.075 107.632 167.26 119.865 157.866 123.75C155.698 124.647 153.306 125.029 151.011 125.054C139.282 125.18 127.551 125.085 115.82 125.124C108.848 125.146 103.815 112.299 100.921 104.181C98.9675 98.7027 95.204 96.3318 90.6621 96.3497C86.3803 96.3676 83.1481 99.1707 81.3103 104.065C78.4129 111.776 73.6321 124.682 66.8283 124.534C66.5878 124.529 66.3473 124.526 66.1051 124.521C64.5744 124.5 62.0183 124.487 58.9324 124.482C56.4266 124.491 53.8803 124.511 51.2543 124.511C51.2591 124.5 51.264 124.49 51.2689 124.478C42.3314 124.483 32.479 124.511 29.4321 124.511L26.8403 123.778C18.7738 120.772 14.6251 113.68 13.1708 103.657C12.03 95.8004 13.5478 88.3287 15.215 80.8862C16.7474 74.0482 19.1101 67.6457 22.066 61.6007C22.3943 60.928 23.249 60.2666 23.8633 60.2633C35.0644 60.1837 46.2655 60.2048 57.4666 60.2097C57.6194 60.2097 57.7705 60.2292 57.9623 60.2601C58.2011 60.2 58.4628 60.1691 58.7569 60.1675C80.1321 60.148 120.273 60.1236 146.359 59.9903C149.783 59.9692 153.207 59.9529 156.629 59.9253C159.198 59.9074 160.607 60.9523 161.834 63.7197Z";
const CIC_GLASSES_LEFT_EYE_PATH =
  "M58.2108 72.6133L45.3294 85.493L32.4497 72.6133L24.7212 80.3418L37.6009 93.2215L24.7212 106.103L32.4497 113.83L45.3294 100.95L58.2108 113.83L65.9377 106.103L53.0579 93.2215L65.9377 80.3418L58.2108 72.6133Z";
const CIC_GLASSES_RIGHT_EYE_PATH =
  "M146.119 72.6133L133.237 85.493L120.357 72.6133L112.629 80.3418L125.509 93.2215L112.629 106.103L120.357 113.83L133.237 100.95L146.119 113.83L153.845 106.103L140.966 93.2215L153.845 80.3418L146.119 72.6133Z";
const TROPHY_PATH =
  "M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z";
const PALETTE_PATH =
  "M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3L344 320c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 96a32 32 0 1 0 0-64 32 32 0 1 0 0 64z";

type AuthorWithOptionalBadges = ApiOgMetadataProfile & {
  readonly has_active_submissions?: boolean | null;
  readonly has_winning_submissions?: boolean | null;
};

type ActivityBadgeType = "active" | "winning";

const getUsableText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

const getFirstMediaUrl = (
  media: readonly ApiOgMediaAsset[] | null | undefined
): string | null =>
  media?.find((asset) => getUsableText(asset.url) !== null)?.url ?? null;

const getMediaProxyUrl = ({
  sourceUrl,
  origin,
  width,
}: {
  readonly sourceUrl: string | null;
  readonly origin: string;
  readonly width: number;
}): string | null => {
  if (!sourceUrl) {
    return null;
  }

  const proxyUrl = new URL(MEDIA_PROXY_PATH, origin);
  proxyUrl.searchParams.set("url", sourceUrl);
  proxyUrl.searchParams.set("w", `${width}`);
  return proxyUrl.toString();
};

const shortenAddress = (address: string): string => {
  if (address.length <= 13) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getAuthorDisplayName = (
  author: ApiOgMetadataProfile | undefined
): string => {
  const handle = getUsableText(author?.handle);
  if (handle) {
    return handle.replace(/^@/, "");
  }

  const primaryAddress = getUsableText(author?.primary_address);
  if (primaryAddress) {
    return shortenAddress(primaryAddress);
  }

  return "6529";
};

const getInitials = (displayName: string): string =>
  (displayName.replace(/^@/, "").trim().at(0) || "6").toUpperCase();

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
};

const pluralize = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural;

const truncateText = (value: string, maxLength: number): string =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;

const getCharacterWidthFactor = (character: string): number => {
  if (character === " ") {
    return 0.34;
  }

  if ("il.,:;|'![]()".includes(character)) {
    return 0.28;
  }

  if ("mwMW@#%&".includes(character)) {
    return 0.9;
  }

  if (character >= "A" && character <= "Z") {
    return 0.72;
  }

  return 0.58;
};

const getEstimatedTextWidth = (value: string, fontSize: number): number =>
  [...value].reduce(
    (width, character) =>
      width + getCharacterWidthFactor(character) * fontSize,
    0
  );

const fitsTitleLine = (value: string, wrapWidth: number): boolean =>
  getEstimatedTextWidth(value, TITLE_FONT_SIZE) <= wrapWidth;

const fitsDescriptionLine = (value: string, wrapWidth: number): boolean =>
  getEstimatedTextWidth(value, WAVE_DESCRIPTION_FONT_SIZE) <= wrapWidth;

const appendEllipsis = (value: string, wrapWidth: number): string => {
  const suffix = "...";
  if (fitsDescriptionLine(`${value}${suffix}`, wrapWidth)) {
    return `${value}${suffix}`;
  }

  let truncated = value.trimEnd();
  while (
    truncated.length > 0 &&
    !fitsDescriptionLine(`${truncated}${suffix}`, wrapWidth)
  ) {
    truncated = truncated.slice(0, -1).trimEnd();
  }

  return `${truncated}${suffix}`;
};

const getTitleLines = (
  value: string,
  wrapWidth: number
): readonly string[] => {
  const normalized = value.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  let currentLine = "";

  for (const word of normalized.split(" ")) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (fitsTitleLine(nextLine, wrapWidth)) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [normalized];
};

const getDescriptionLines = (
  value: string | null | undefined,
  wrapWidth: number
): readonly string[] => {
  const normalized = getUsableText(value)?.replace(/\s+/g, " ");
  if (!normalized) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of normalized.split(" ")) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (fitsDescriptionLine(nextLine, wrapWidth)) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    } else {
      lines.push(appendEllipsis(word, wrapWidth));
    }

    if (lines.length === WAVE_DESCRIPTION_MAX_LINES) {
      break;
    }

    currentLine = word;
  }

  if (currentLine && lines.length < WAVE_DESCRIPTION_MAX_LINES) {
    lines.push(currentLine);
  }

  if (lines.join(" ").length < normalized.length && lines.length > 0) {
    lines[lines.length - 1] = appendEllipsis(
      lines[lines.length - 1],
      wrapWidth
    );
  }

  return lines;
};

const getDescriptionTop = ({
  titleLineCount,
  descriptionLineCount,
}: {
  readonly titleLineCount: number;
  readonly descriptionLineCount: number;
}): number => {
  const titleBottom = TITLE_TOP + titleLineCount * TITLE_FONT_SIZE * TITLE_LINE_HEIGHT;
  const descriptionHeight =
    descriptionLineCount * WAVE_DESCRIPTION_FONT_SIZE * WAVE_DESCRIPTION_LINE_HEIGHT;
  const availableSpace = CREATOR_ROW_TOP - titleBottom;

  return titleBottom + Math.max(0, (availableSpace - descriptionHeight) / 2);
};

const getCicType = (cic: number): CICType => {
  if (cic < -20) {
    return CICType.INACCURATE;
  }

  if (cic < 1000) {
    return CICType.UNKNOWN;
  }

  if (cic < 10000) {
    return CICType.PROBABLY_ACCURATE;
  }

  if (cic < 25000) {
    return CICType.ACCURATE;
  }

  return CICType.HIGHLY_ACCURATE;
};

const getLevelColor = (level: number): string =>
  LEVEL_COLORS.find((levelColor) => levelColor.minLevel <= level)?.color ??
  "#DA8C60";

const getActivityBadgeType = (
  author: AuthorWithOptionalBadges | undefined
): ActivityBadgeType | null => {
  if (author?.has_winning_submissions === true) {
    return "winning";
  }

  if (author?.has_active_submissions === true) {
    return "active";
  }

  return null;
};

const CicBadge = ({ cic }: { readonly cic: number }) => {
  const badge = CIC_BADGE_STYLES[getCicType(cic)];
  const showGlasses = badge.icon === "glasses";

  return (
    <div
      style={{
        alignItems: "center",
        background: badge.background,
        borderRadius: 999,
        color: badge.color,
        display: "flex",
        fontSize: 27,
        fontWeight: 800,
        height: CREATOR_BADGE_SIZE,
        justifyContent: "center",
        lineHeight: 1,
        width: CREATOR_BADGE_SIZE,
      }}>
      {showGlasses ? (
        <svg
          height={32}
          style={{
            display: "flex",
            height: 32,
            width: 32,
          }}
          viewBox="0 0 183 183"
          width={32}>
          <path d={CIC_GLASSES_FRAME_PATH} fill={badge.color} />
          <path d={CIC_GLASSES_LEFT_EYE_PATH} fill={badge.background} />
          <path d={CIC_GLASSES_RIGHT_EYE_PATH} fill={badge.background} />
        </svg>
      ) : (
        badge.label
      )}
    </div>
  );
};

const LevelBadge = ({ level }: { readonly level: number }) => {
  const color = getLevelColor(level);

  return (
    <div
      style={{
        alignItems: "center",
        background: `${color}1A`,
        border: `1px solid ${color}`,
        borderRadius: 999,
        color,
        display: "flex",
        fontSize: 16,
        fontWeight: 700,
        height: CREATOR_BADGE_SIZE,
        justifyContent: "center",
        lineHeight: 1,
        width: CREATOR_BADGE_SIZE,
      }}>
      {level}
    </div>
  );
};

const ActivityBadge = ({ type }: { readonly type: ActivityBadgeType }) => {
  const isWinning = type === "winning";
  const color = isWinning ? "#F7B955" : "#60A5FA";
  const path = isWinning ? TROPHY_PATH : PALETTE_PATH;
  const viewBox = isWinning ? "0 0 576 512" : "0 0 512 512";

  return (
    <div
      style={{
        alignItems: "center",
        background: isWinning
          ? "rgba(255,196,0,0.08)"
          : "rgba(59,130,246,0.10)",
        border: isWinning
          ? "1px solid rgba(255,180,64,0.82)"
          : "1px solid rgba(96,165,250,0.35)",
        borderRadius: 10,
        color,
        display: "flex",
        height: CREATOR_BADGE_SIZE,
        justifyContent: "center",
        width: CREATOR_BADGE_SIZE,
      }}>
      <svg
        height={20}
        style={{
          display: "flex",
          height: 20,
          width: 20,
        }}
        viewBox={viewBox}
        width={20}>
        <path d={path} fill={color} />
      </svg>
    </div>
  );
};

const HEROICON_PATHS = {
  drops:
    "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
  subscribers:
    "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
} as const;

const WaveStatIcon = ({ type }: { readonly type: "drops" | "subscribers" }) => (
    <svg
      height={28}
      style={{
        display: "flex",
        height: 28,
        width: 28,
      }}
      viewBox="0 0 24 24"
      width={28}>
      <path
        d={HEROICON_PATHS[type]}
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );

export const renderWaveOgImage = ({
  wave,
  author,
  id,
  origin = publicEnv.BASE_ENDPOINT,
}: {
  readonly wave: ApiOgMetadataWave | undefined;
  readonly author: ApiOgMetadataProfile | undefined;
  readonly id: string;
  readonly origin?: string;
}) => {
  const authorWithBadges = author as AuthorWithOptionalBadges | undefined;
  const waveName = getUsableText(wave?.name) ?? id;
  const authorName = getAuthorDisplayName(author);
  const authorAvatarUrl = getMediaProxyUrl({
    sourceUrl: getFirstMediaUrl(author?.media),
    origin,
    width: CREATOR_AVATAR_INNER_SIZE,
  });
  const waveMediaUrl = getMediaProxyUrl({
    sourceUrl: getFirstMediaUrl(wave?.media),
    origin,
    width: LEFT_MEDIA_CONTENT_WIDTH,
  });
  const hasWaveMedia = waveMediaUrl !== null;
  const contentLeft = hasWaveMedia ? CONTENT_LEFT : HORIZONTAL_MARGIN;
  const contentWidth = hasWaveMedia
    ? CONTENT_WIDTH
    : CANVAS_WIDTH - HORIZONTAL_MARGIN * 2;
  const titleLines = getTitleLines(waveName, contentWidth);
  const descriptionLines = getDescriptionLines(
    wave?.description,
    contentWidth - 30
  );
  const activityBadgeType = getActivityBadgeType(authorWithBadges);
  const dropsCount = wave?.drops_count ?? 0;
  const subscribersCount = wave?.subscribers_count ?? 0;

  return (
    <div
      style={{
        background: CARD_BACKGROUND,
        color: "#ffffff",
        display: "flex",
        fontFamily: "Montserrat, sans-serif",
        height: CANVAS_HEIGHT,
        overflow: "hidden",
        position: "relative",
        width: CANVAS_WIDTH,
      }}>
      {waveMediaUrl ? (
        <div
          style={{
            alignItems: "center",
            background: CARD_BACKGROUND,
            display: "flex",
            height: CANVAS_HEIGHT,
            justifyContent: "center",
            left: 0,
            overflow: "hidden",
            position: "absolute",
            top: 0,
            width: LEFT_MEDIA_WIDTH,
          }}>
          <img
            alt=""
            height={LEFT_MEDIA_CONTENT_HEIGHT}
            src={waveMediaUrl}
            style={{
              height: LEFT_MEDIA_CONTENT_HEIGHT,
              objectFit: "contain",
              width: LEFT_MEDIA_CONTENT_WIDTH,
            }}
            width={LEFT_MEDIA_CONTENT_WIDTH}
          />
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          bottom: HORIZONTAL_MARGIN,
          height: LOGO_SIZE,
          position: "absolute",
          right: HORIZONTAL_MARGIN,
          width: LOGO_SIZE,
        }}>
        <img
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
      <div
        style={{
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          fontSize: TITLE_FONT_SIZE,
          fontWeight: 700,
          left: contentLeft,
          letterSpacing: 0,
          lineHeight: TITLE_LINE_HEIGHT,
          maxWidth: contentWidth,
          overflow: "hidden",
          position: "absolute",
          top: TITLE_TOP,
        }}>
        {titleLines.map((line) => (
          <div
            key={line}
            style={{
              display: "flex",
              whiteSpace: "nowrap",
            }}>
            {line}
          </div>
        ))}
      </div>
      <div
        style={{
          color: "#D0D1D7",
          display: "flex",
          flexDirection: "column",
          fontSize: WAVE_DESCRIPTION_FONT_SIZE,
          fontWeight: 500,
          left: contentLeft,
          letterSpacing: 0,
          lineHeight: WAVE_DESCRIPTION_LINE_HEIGHT,
          position: "absolute",
          top: getDescriptionTop({
            titleLineCount: titleLines.length,
            descriptionLineCount: descriptionLines.length,
          }),
          width: contentWidth,
        }}>
        {descriptionLines.map((line) => (
          <div
            key={line}
            style={{
              display: "flex",
              overflow: "hidden",
              whiteSpace: "nowrap",
              width: contentWidth,
            }}>
            {line}
          </div>
        ))}
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 16,
          left: contentLeft,
          position: "absolute",
          top: CREATOR_ROW_TOP,
          width: contentWidth,
        }}>
        <div
          style={{
            color: "#93939F",
            display: "flex",
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1,
          }}>
          by
        </div>
        <div
          style={{
            alignItems: "center",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 13,
            display: "flex",
            height: CREATOR_AVATAR_SIZE,
            justifyContent: "center",
            overflow: "hidden",
            padding: 3,
            width: CREATOR_AVATAR_SIZE,
          }}>
          {authorAvatarUrl ? (
            <img
              alt=""
              height={CREATOR_AVATAR_INNER_SIZE}
              src={authorAvatarUrl}
              style={{
                borderRadius: 10,
                height: CREATOR_AVATAR_INNER_SIZE,
                objectFit: "cover",
                width: CREATOR_AVATAR_INNER_SIZE,
              }}
              width={CREATOR_AVATAR_INNER_SIZE}
            />
          ) : (
            <div
              style={{
                alignItems: "center",
                background: "#111827",
                borderRadius: 10,
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                height: CREATOR_AVATAR_INNER_SIZE,
                justifyContent: "center",
                width: CREATOR_AVATAR_INNER_SIZE,
              }}>
              {getInitials(authorName)}
            </div>
          )}
        </div>
        <div
          style={{
            color: "#ffffff",
            display: "flex",
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 250,
            overflow: "hidden",
        }}>
          {truncateText(authorName, 16)}
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
          }}>
          <CicBadge cic={author?.cic ?? 0} />
          {author?.level !== null && author?.level !== undefined ? (
            <LevelBadge level={author.level} />
          ) : null}
          {activityBadgeType ? (
            <ActivityBadge type={activityBadgeType} />
          ) : null}
        </div>
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 54,
          left: contentLeft,
          position: "absolute",
          top: STATS_ROW_TOP,
        }}>
        <div
          style={{
            alignItems: "center",
            color: "#FFFFFF",
            display: "flex",
            fontSize: 30,
            fontWeight: 500,
            gap: 12,
          }}>
          <WaveStatIcon type="drops" />
          <span>{formatNumber(dropsCount)}</span>
          <span style={{ color: "#93939F" }}>
            {pluralize(dropsCount, "Drop", "Drops")}
          </span>
        </div>
        <div
          style={{
            alignItems: "center",
            color: "#FFFFFF",
            display: "flex",
            fontSize: 30,
            fontWeight: 500,
            gap: 12,
          }}>
          <WaveStatIcon type="subscribers" />
          <span>{formatNumber(subscribersCount)}</span>
          <span style={{ color: "#93939F" }}>
            {pluralize(subscribersCount, "Joined", "Joined")}
          </span>
        </div>
      </div>
    </div>
  );
};
