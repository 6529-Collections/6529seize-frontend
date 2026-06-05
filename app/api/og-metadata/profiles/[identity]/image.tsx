import { publicEnv } from "@/config/env";
import { CLASSIFICATIONS } from "@/entities/IProfile";
import type { ApiOgMetadataProfile } from "@/generated/models/ApiOgMetadataProfile";
import {
  getFirstMediaUrl,
  getMediaProxyUrl,
  getUsableText,
  formatInteger,
  getWrappedTextLines,
  pluralize,
  shortenAddress,
  truncateText,
} from "../../_lib/imageUtils";
import {
  ArtistActivityBadge,
  CicBadge,
  getActivityBadgeType,
  LevelBadge,
} from "../../_lib/profileBadges";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;
const BANNER_HEIGHT = 166;
const HORIZONTAL_MARGIN = 34;
const PFP_SIZE = 286;
const PFP_PADDING = 6;
const PFP_INNER_SIZE = PFP_SIZE - PFP_PADDING * 2;
const PROFILE_TEXT_WITH_AVATAR_LEFT = HORIZONTAL_MARGIN + PFP_SIZE + 42;
const PROFILE_TEXT_WITH_AVATAR_WIDTH =
  CANVAS_WIDTH - PROFILE_TEXT_WITH_AVATAR_LEFT - HORIZONTAL_MARGIN;
const PROFILE_TEXT_FULL_WIDTH = CANVAS_WIDTH - HORIZONTAL_MARGIN * 2;
const PFP_TOP = 54;
const DESCRIPTION_MAX_LINES = 3;
const DESCRIPTION_FONT_SIZE = 40;
const DESCRIPTION_LINE_HEIGHT = 1.12;
const DESCRIPTION_WIDTH = CANVAS_WIDTH - HORIZONTAL_MARGIN * 2;
const DESCRIPTION_WRAP_WIDTH = DESCRIPTION_WIDTH - 24;
const STATS_TOP = 552;
const DESCRIPTION_AVAILABLE_TOP = PFP_TOP + PFP_SIZE;
const getDescriptionTop = (lineCount: number): number =>
  Math.round(
    DESCRIPTION_AVAILABLE_TOP +
      (STATS_TOP -
        DESCRIPTION_AVAILABLE_TOP -
        DESCRIPTION_FONT_SIZE *
          DESCRIPTION_LINE_HEIGHT *
          Math.max(lineCount, 1)) /
        2
  );
const PROFILE_MAIN_BACKGROUND = "#131316";
const LOGO_URL = `${publicEnv.BASE_ENDPOINT}/6529.svg`;
const LOGO_SIZE = 42;
const HEX_COLOR_PATTERN = /^#[\da-f]{3}(?:[\da-f]{3})?$/i;

type ProfileWithOptionalRates = ApiOgMetadataProfile & {
  readonly tdh_rate?: number | null;
  readonly rep_rate?: number | null;
  readonly has_active_submissions?: boolean | null;
  readonly has_winning_submissions?: boolean | null;
};

const getSafeColor = (value: string | null | undefined): string | null => {
  const normalized = getUsableText(value);
  return normalized && HEX_COLOR_PATTERN.test(normalized) ? normalized : null;
};

const getSeededNumber = (value: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ (value.codePointAt(index) ?? 0), 16777619);
  }

  return hash >>> 0;
};

const getFallbackBannerColors = (
  profile: ApiOgMetadataProfile | undefined,
  identity: string
): { readonly primary: string; readonly secondary: string } => {
  const seed =
    getUsableText(profile?.id) ??
    getUsableText(profile?.handle) ??
    getUsableText(profile?.primary_address) ??
    identity;
  const primaryHue = getSeededNumber(seed) % 360;
  const secondaryHue =
    (primaryHue + 45 + (getSeededNumber(`${seed}:2`) % 90)) % 360;

  return {
    primary: `hsl(${primaryHue}, 48%, 58%)`,
    secondary: `hsl(${secondaryHue}, 48%, 50%)`,
  };
};

const formatSignedNumber = (
  value: number | null | undefined
): string | null => {
  const formatted = formatInteger(value);
  if (!formatted || value === undefined || value === null || value <= 0) {
    return null;
  }
  return `+${formatted}`;
};

const getDescriptionLines = (
  value: string | null | undefined
): readonly string[] =>
  getWrappedTextLines({
    value,
    fontSize: DESCRIPTION_FONT_SIZE,
    wrapWidth: DESCRIPTION_WRAP_WIDTH,
    maxLines: DESCRIPTION_MAX_LINES,
    ellipsize: true,
  });

const getDisplayName = (
  profile: ApiOgMetadataProfile | undefined,
  identity: string
): string => {
  const handle = getUsableText(profile?.handle);
  if (handle) {
    return handle.replace(/^@/, "");
  }

  const primaryAddress = getUsableText(profile?.primary_address);
  if (primaryAddress) {
    return shortenAddress(primaryAddress);
  }

  return identity;
};

const getClassificationLabel = (
  profile: ApiOgMetadataProfile | undefined
): string => {
  const classification = profile?.classification;
  if (!classification) {
    return "Profile";
  }
  return CLASSIFICATIONS[classification]?.title ?? classification;
};

const formatProfileEnabledAt = (
  value: number | null | undefined
): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const timestamp = value < 1_000_000_000_000 ? value * 1000 : value;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const getBannerBackground = ({
  primaryColor,
  secondaryColor,
  hasSecondaryColor,
}: {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly hasSecondaryColor: boolean;
}): string =>
  hasSecondaryColor
    ? `linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
    : primaryColor;

const getStats = (profile: ProfileWithOptionalRates | undefined) => {
  const followersCount = profile?.followers_count ?? 0;
  const stats = [
    {
      label: "TDH",
      value: formatInteger(profile?.tdh),
      rate: formatSignedNumber(profile?.tdh_rate),
    },
    {
      label: "NIC",
      value: formatInteger(profile?.cic),
      rate: null,
    },
    {
      label: "Rep",
      value: formatInteger(profile?.rep),
      rate: formatSignedNumber(profile?.rep_rate),
    },
    {
      label: pluralize(followersCount, "Follower", "Followers"),
      value: formatInteger(followersCount),
      rate: null,
    },
  ];

  return stats.filter((stat) => stat.value !== null);
};

export const renderProfileOgImage = ({
  profile,
  identity,
  origin = publicEnv.BASE_ENDPOINT,
}: {
  readonly profile: ApiOgMetadataProfile | undefined;
  readonly identity: string;
  readonly origin?: string;
}) => {
  const profileWithRates = profile as ProfileWithOptionalRates | undefined;
  const displayName = getDisplayName(profile, identity);
  const description = getUsableText(profile?.description);
  const descriptionLines = getDescriptionLines(description);
  const descriptionTop = getDescriptionTop(descriptionLines.length);
  const avatarUrl = getMediaProxyUrl({
    sourceUrl: getFirstMediaUrl(profile?.media),
    origin,
    width: PFP_INNER_SIZE,
  });
  const bannerImageUrl = getMediaProxyUrl({
    sourceUrl: getFirstMediaUrl(profile?.banner?.media),
    origin,
    width: CANVAS_WIDTH,
  });
  const primaryColor = getSafeColor(profile?.banner?.primary);
  const secondaryColor = getSafeColor(profile?.banner?.secondary);
  const fallbackBannerColors = getFallbackBannerColors(profile, identity);
  const hasBothBannerColors = primaryColor !== null && secondaryColor !== null;
  const resolvedPrimaryColor =
    primaryColor ?? secondaryColor ?? fallbackBannerColors.primary;
  const resolvedSecondaryColor =
    secondaryColor ?? primaryColor ?? fallbackBannerColors.secondary;
  const shouldUseBannerGradient =
    hasBothBannerColors || (primaryColor === null && secondaryColor === null);
  const profileEnabledLabel = formatProfileEnabledAt(
    profile?.profile_enabled_at
  );
  const classificationLabel = getClassificationLabel(profile);
  const stats = getStats(profileWithRates);
  const activityBadgeType = getActivityBadgeType(profileWithRates);
  const profileTextLeft = avatarUrl
    ? PROFILE_TEXT_WITH_AVATAR_LEFT
    : HORIZONTAL_MARGIN;
  const profileTextWidth = avatarUrl
    ? PROFILE_TEXT_WITH_AVATAR_WIDTH
    : PROFILE_TEXT_FULL_WIDTH;
  const bannerBackground = getBannerBackground({
    primaryColor: resolvedPrimaryColor,
    secondaryColor: resolvedSecondaryColor,
    hasSecondaryColor: shouldUseBannerGradient,
  });

  return (
    <div
      style={{
        background: PROFILE_MAIN_BACKGROUND,
        color: "#ffffff",
        display: "flex",
        fontFamily: "Montserrat, sans-serif",
        height: CANVAS_HEIGHT,
        overflow: "hidden",
        position: "relative",
        width: CANVAS_WIDTH,
      }}
    >
      <div
        style={{
          background: bannerBackground,
          display: "flex",
          height: BANNER_HEIGHT,
          left: 0,
          overflow: "hidden",
          position: "absolute",
          top: 0,
          width: CANVAS_WIDTH,
        }}
      >
        {bannerImageUrl ? (
          <img
            alt=""
            height={BANNER_HEIGHT}
            src={bannerImageUrl}
            style={{
              height: BANNER_HEIGHT,
              objectFit: "cover",
              width: CANVAS_WIDTH,
            }}
            width={CANVAS_WIDTH}
          />
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          height: LOGO_SIZE,
          position: "absolute",
          right: HORIZONTAL_MARGIN,
          top: HORIZONTAL_MARGIN,
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
          background: PROFILE_MAIN_BACKGROUND,
          display: "flex",
          height: CANVAS_HEIGHT - BANNER_HEIGHT,
          left: 0,
          position: "absolute",
          top: BANNER_HEIGHT,
          width: CANVAS_WIDTH,
        }}
      />
      {avatarUrl ? (
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 25,
            display: "flex",
            height: PFP_SIZE,
            left: HORIZONTAL_MARGIN,
            overflow: "hidden",
            padding: PFP_PADDING,
            position: "absolute",
            top: PFP_TOP,
            width: PFP_SIZE,
          }}
        >
          <img
            alt=""
            height={PFP_INNER_SIZE}
            src={avatarUrl}
            style={{
              background: "#111111",
              borderRadius: 22,
              height: PFP_INNER_SIZE,
              objectFit: "cover",
              width: PFP_INNER_SIZE,
            }}
            width={PFP_INNER_SIZE}
          />
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          left: profileTextLeft,
          overflow: "hidden",
          position: "absolute",
          top: 196,
          width: profileTextWidth,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 18,
            width: profileTextWidth,
          }}
        >
          <div
            style={{
              color: "#ffffff",
              fontSize: 62,
              fontWeight: 600,
              letterSpacing: 0,
              lineHeight: 1.15,
              maxWidth: profileTextWidth - 210,
              overflow: "hidden",
            }}
          >
            {truncateText(displayName, 18)}
          </div>
          <CicBadge
            cic={profile?.cic ?? 0}
            fontSize={32}
            glassesSize={39}
            size={50}
          />
          {profile?.level !== null && profile?.level !== undefined ? (
            <LevelBadge fontSize={18} level={profile.level} size={50} />
          ) : null}
          {activityBadgeType ? (
            <ArtistActivityBadge
              borderRadius={12}
              iconSize={24}
              size={50}
              type={activityBadgeType}
            />
          ) : null}
        </div>
        <div
          style={{
            alignItems: "center",
            color: "#93939F",
            display: "flex",
            fontSize: 33,
            fontWeight: 500,
            gap: 14,
            letterSpacing: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            width: profileTextWidth,
          }}
        >
          <span>{classificationLabel}</span>
          {profileEnabledLabel ? <span>·</span> : null}
          {profileEnabledLabel ? (
            <span>Profile enabled: {profileEnabledLabel}</span>
          ) : null}
        </div>
      </div>
      <div
        style={{
          color: "#ECECEE",
          display: "flex",
          flexDirection: "column",
          fontSize: DESCRIPTION_FONT_SIZE,
          fontWeight: 500,
          left: HORIZONTAL_MARGIN,
          letterSpacing: 0,
          lineHeight: DESCRIPTION_LINE_HEIGHT,
          position: "absolute",
          top: descriptionTop,
          width: CANVAS_WIDTH - HORIZONTAL_MARGIN * 2,
        }}
      >
        {descriptionLines.map((line) => (
          <div
            key={line}
            style={{
              display: "flex",
              overflow: "hidden",
              whiteSpace: "nowrap",
              width: CANVAS_WIDTH - HORIZONTAL_MARGIN * 2,
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
          justifyContent: "space-between",
          left: HORIZONTAL_MARGIN,
          position: "absolute",
          top: STATS_TOP,
          width: CANVAS_WIDTH - HORIZONTAL_MARGIN * 2,
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              alignItems: "baseline",
              display: "flex",
              gap: 8,
            }}
          >
            <span
              style={{
                color: "#CECFD4",
                fontSize: 38,
                fontWeight: 600,
                letterSpacing: 0,
              }}
            >
              {stat.value}
            </span>
            <span
              style={{
                color: "#848490",
                fontSize: 38,
                fontWeight: 500,
                letterSpacing: 0,
              }}
            >
              {stat.label}
            </span>
            {stat.rate ? (
              <span
                style={{
                  color: "#22C99A",
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: 0,
                }}
              >
                {stat.rate}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
