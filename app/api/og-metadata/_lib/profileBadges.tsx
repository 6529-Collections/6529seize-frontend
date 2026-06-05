import { CICType } from "@/entities/IProfile";

type ActivityBadgeType = "active" | "winning";

type ProfileActivity = {
  readonly has_active_submissions?: boolean | null;
  readonly has_winning_submissions?: boolean | null;
};

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

const ACTIVITY_BADGE_CONFIG: Record<
  ActivityBadgeType,
  {
    readonly ariaLabel: string;
    readonly background: string;
    readonly border: string;
    readonly color: string;
    readonly iconPath: string;
    readonly viewBox: string;
  }
> = {
  active: {
    ariaLabel: "Active art submissions",
    background: "rgba(59,130,246,0.10)",
    border: "1px solid rgba(96,165,250,0.35)",
    color: "#60A5FA",
    iconPath:
      "M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3L344 320c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 96a32 32 0 1 0 0-64 32 32 0 1 0 0 64z",
    viewBox: "0 0 512 512",
  },
  winning: {
    ariaLabel: "Winning art submissions",
    background: "rgba(255,196,0,0.08)",
    border: "1px solid rgba(255,180,64,0.82)",
    color: "#F7B955",
    iconPath:
      "M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z",
    viewBox: "0 0 576 512",
  },
} as const;

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

export const getActivityBadgeType = (
  profile: ProfileActivity | undefined
): ActivityBadgeType | null => {
  if (profile?.has_winning_submissions === true) {
    return "winning";
  }

  if (profile?.has_active_submissions === true) {
    return "active";
  }

  return null;
};

export const CicBadge = ({
  cic,
  size,
  fontSize,
  glassesSize,
}: {
  readonly cic: number;
  readonly size: number;
  readonly fontSize: number;
  readonly glassesSize: number;
}) => {
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
        fontSize,
        fontWeight: 800,
        height: size,
        justifyContent: "center",
        lineHeight: 1,
        width: size,
      }}
    >
      {showGlasses ? (
        <svg
          height={glassesSize}
          style={{
            display: "flex",
            height: glassesSize,
            width: glassesSize,
          }}
          viewBox="0 0 183 183"
          width={glassesSize}
        >
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

export const LevelBadge = ({
  level,
  size,
  fontSize,
}: {
  readonly level: number;
  readonly size: number;
  readonly fontSize: number;
}) => {
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
        fontSize,
        fontWeight: 700,
        height: size,
        justifyContent: "center",
        lineHeight: 1,
        width: size,
      }}
    >
      {level}
    </div>
  );
};

export const ArtistActivityBadge = ({
  type,
  size,
  borderRadius,
  iconSize,
}: {
  readonly type: ActivityBadgeType;
  readonly size: number;
  readonly borderRadius: number;
  readonly iconSize: number;
}) => {
  const config = ACTIVITY_BADGE_CONFIG[type];

  return (
    <div
      aria-label={config.ariaLabel}
      style={{
        alignItems: "center",
        background: config.background,
        border: config.border,
        borderRadius,
        color: config.color,
        display: "flex",
        height: size,
        justifyContent: "center",
        width: size,
      }}
    >
      <svg
        height={iconSize}
        style={{
          display: "flex",
          height: iconSize,
          width: iconSize,
        }}
        viewBox={config.viewBox}
        width={iconSize}
      >
        <path d={config.iconPath} fill={config.color} />
      </svg>
    </div>
  );
};
