import ProfileAvatar, { ProfileBadgeSize } from "@/components/common/profile/ProfileAvatar";
import { DropPartSize } from "@/components/drops/view/part/DropPart.types";

const AVATAR_SIZE_MAP: Record<DropPartSize, ProfileBadgeSize> = {
  [DropPartSize.SMALL]: ProfileBadgeSize.SMALL,
  [DropPartSize.MEDIUM]: ProfileBadgeSize.MEDIUM,
  [DropPartSize.LARGE]: ProfileBadgeSize.LARGE,
};

export default function DropPfp({
  pfpUrl,
  size,
}: {
  readonly pfpUrl: string | null | undefined;
  readonly size?: DropPartSize | undefined;
}) {
  const effectiveSize = size ?? DropPartSize.MEDIUM;
  return (
    <ProfileAvatar
      pfpUrl={pfpUrl}
      size={AVATAR_SIZE_MAP[effectiveSize]}
      alt="Create Drop Profile"
    />
  );
}
