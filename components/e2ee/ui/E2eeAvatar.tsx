import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

const SIZE_CLASSES = {
  xs: "tw-size-6 tw-text-[10px]",
  duo: "tw-size-7 tw-text-[11px]",
  sm: "tw-size-8 tw-text-xs",
  md: "tw-size-10 tw-text-sm",
  lg: "tw-size-14 tw-text-lg",
} as const;

interface E2eeAvatarProps {
  readonly pfp: string | null;
  /** Used for the initial fallback; the avatar itself is decorative. */
  readonly name: string;
  readonly size?: keyof typeof SIZE_CLASSES | undefined;
  readonly className?: string | undefined;
}

/** Decorative round avatar; pair it with visible or accessible text. */
export function E2eeAvatar({
  pfp,
  name,
  size = "md",
  className = "",
}: E2eeAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className={`tw-relative tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-800 tw-font-semibold tw-text-iron-200 tw-ring-1 tw-ring-white/10 ${SIZE_CLASSES[size]} ${className}`}
    >
      {pfp ? (
        // eslint-disable-next-line @next/next/no-img-element -- profile pictures come from arbitrary remote hosts, as in ProfileAvatar; keep them unoptimized.
        <img
          src={getScaledImageUri(pfp, ImageScale.W_AUTO_H_50)}
          alt=""
          className="tw-h-full tw-w-full tw-object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
}

interface E2eeAvatarStackProps {
  readonly people: readonly {
    readonly key: string;
    readonly pfp: string | null;
    readonly name: string;
  }[];
  readonly max?: number | undefined;
  readonly size?: keyof typeof SIZE_CLASSES | undefined;
}

/** Overlapping decorative avatars for a chat's members. */
export function E2eeAvatarStack({
  people,
  max = 3,
  size = "sm",
}: E2eeAvatarStackProps) {
  const visible = people.slice(0, max);
  return (
    <span aria-hidden="true" className="tw-flex tw-flex-shrink-0 -tw-space-x-2">
      {visible.map((person) => (
        <E2eeAvatar
          key={person.key}
          pfp={person.pfp}
          name={person.name}
          size={size}
          className="tw-ring-2 tw-ring-black"
        />
      ))}
    </span>
  );
}
