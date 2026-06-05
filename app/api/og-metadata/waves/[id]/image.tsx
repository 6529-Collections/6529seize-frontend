import { publicEnv } from "@/config/env";
import type { ApiOgMetadataProfile } from "@/generated/models/ApiOgMetadataProfile";
import type { ApiOgMetadataWave } from "@/generated/models/ApiOgMetadataWave";
import {
  formatInteger,
  getFirstMediaUrl,
  getMediaProxyUrl,
  getUsableText,
  getWrappedTextLines,
  pluralize,
  truncateText,
} from "../../_lib/imageUtils";
import {
  getProfileDisplayName,
  ProfileAvatar,
  ProfileBadgeRow,
} from "../../_lib/profileSummary";

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
const CREATOR_BADGE_SIZE = 38;

const formatNumber = (value: number | null | undefined): string =>
  formatInteger(value) ?? "0";

const getTitleLines = (value: string, wrapWidth: number): readonly string[] =>
  getWrappedTextLines({
    value,
    fontSize: TITLE_FONT_SIZE,
    wrapWidth,
    ellipsize: false,
  });

const getDescriptionLines = (
  value: string | null | undefined,
  wrapWidth: number
): readonly string[] =>
  getWrappedTextLines({
    value,
    fontSize: WAVE_DESCRIPTION_FONT_SIZE,
    wrapWidth,
    maxLines: WAVE_DESCRIPTION_MAX_LINES,
    ellipsize: true,
  });

const getDescriptionTop = ({
  titleLineCount,
  descriptionLineCount,
}: {
  readonly titleLineCount: number;
  readonly descriptionLineCount: number;
}): number => {
  const titleBottom =
    TITLE_TOP + titleLineCount * TITLE_FONT_SIZE * TITLE_LINE_HEIGHT;
  const descriptionHeight =
    descriptionLineCount *
    WAVE_DESCRIPTION_FONT_SIZE *
    WAVE_DESCRIPTION_LINE_HEIGHT;
  const availableSpace = CREATOR_ROW_TOP - titleBottom;

  return titleBottom + Math.max(0, (availableSpace - descriptionHeight) / 2);
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
    width={28}
  >
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
  const waveName = getUsableText(wave?.name) ?? id;
  const authorName = getProfileDisplayName(author);
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
      }}
    >
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
          }}
        >
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
        }}
      >
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
        }}
      >
        {titleLines.map((line) => (
          <div
            key={`title-${line}`}
            style={{
              display: "flex",
              whiteSpace: "nowrap",
            }}
          >
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
        }}
      >
        {descriptionLines.map((line) => (
          <div
            key={`description-${line}`}
            style={{
              display: "flex",
              overflow: "hidden",
              whiteSpace: "nowrap",
              width: contentWidth,
            }}
          >
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
        }}
      >
        <div
          style={{
            color: "#93939F",
            display: "flex",
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          by
        </div>
        <ProfileAvatar
          avatarUrl={authorAvatarUrl}
          borderRadius={13}
          innerBorderRadius={10}
          innerSize={CREATOR_AVATAR_INNER_SIZE}
          size={CREATOR_AVATAR_SIZE}
        />
        <div
          style={{
            color: "#ffffff",
            display: "flex",
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 250,
            overflow: "hidden",
          }}
        >
          {truncateText(authorName, 16)}
        </div>
        <ProfileBadgeRow
          activityBorderRadius={10}
          activityIconSize={18}
          badgeSize={CREATOR_BADGE_SIZE}
          cicFontSize={24}
          glassesSize={29}
          levelFontSize={15}
          profile={author}
        />
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 54,
          left: contentLeft,
          position: "absolute",
          top: STATS_ROW_TOP,
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: "#FFFFFF",
            display: "flex",
            fontSize: 30,
            fontWeight: 500,
            gap: 12,
          }}
        >
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
          }}
        >
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
