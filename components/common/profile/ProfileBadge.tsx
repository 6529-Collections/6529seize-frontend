import type { ReactNode } from "react";

import ProfileAvatar, { ProfileBadgeSize } from "./ProfileAvatar";
import ProfileHandle from "./ProfileHandle";
import ProfileLevel, { ProfileLevelSize } from "./ProfileLevel";
import type { CICType } from "@/entities/IProfile";

interface ProfileBadgeProps {
  readonly handle?: string | null | undefined;
  readonly href?: string | undefined;
  readonly pfpUrl?: string | null | undefined;
  readonly level: number;
  readonly cicType: CICType;
  readonly size?: ProfileBadgeSize | undefined;
  readonly className?: string | undefined;
  readonly children?: ReactNode | undefined;
  readonly avatarAlt?: string | undefined;
  readonly avatarFallback?: ReactNode | undefined;
  readonly highlightSearchParam?: string | undefined;
  readonly asLink?: boolean | undefined;
}

const LEVEL_SIZE_MAP: Record<ProfileBadgeSize, ProfileLevelSize> = {
  [ProfileBadgeSize.SMALL]: ProfileLevelSize.SMALL,
  [ProfileBadgeSize.MEDIUM]: ProfileLevelSize.MEDIUM,
  [ProfileBadgeSize.LARGE]: ProfileLevelSize.LARGE,
};

export default function ProfileBadge({
  handle,
  href,
  pfpUrl,
  level,
  cicType,
  size = ProfileBadgeSize.MEDIUM,
  className,
  children,
  avatarAlt,
  avatarFallback,
  highlightSearchParam,
  asLink = true,
}: ProfileBadgeProps) {
  return (
    <div className={`tw-flex tw-items-center tw-gap-x-2 ${className ?? ""}`}>
      <ProfileAvatar
        pfpUrl={pfpUrl}
        alt={avatarAlt}
        fallbackContent={avatarFallback}
        size={size}
      />
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-center">
        <ProfileLevel
          level={level}
          cicType={cicType}
          size={LEVEL_SIZE_MAP[size]}
        />
        <ProfileHandle
          handle={handle}
          href={href}
          asLink={asLink}
          size={size}
          highlightSearchParam={highlightSearchParam}
        />
      </div>
      {children}
    </div>
  );
}

export { ProfileBadgeSize } from "./ProfileAvatar";
export type { ProfileBadgeProps };
