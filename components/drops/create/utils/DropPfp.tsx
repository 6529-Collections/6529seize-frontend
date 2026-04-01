import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import { DropPartSize } from "@/components/drops/view/part/DropPart.types";

const AVATAR_SIZE_MAP: Record<DropPartSize, ProfileBadgeSize> = {
  [DropPartSize.SMALL]: ProfileBadgeSize.SMALL,
  [DropPartSize.MEDIUM]: ProfileBadgeSize.MEDIUM,
  [DropPartSize.LARGE]: ProfileBadgeSize.LARGE,
};

export default function DropPfp({
  pfpUrl,
  size,
  profileSize,
}: {
  readonly pfpUrl: string | null | undefined;
  readonly size?: DropPartSize | undefined;
  readonly profileSize?: ProfileBadgeSize | undefined;
}) {
  const effectiveSize =
    profileSize ?? AVATAR_SIZE_MAP[size ?? DropPartSize.MEDIUM];
  return (
    <ProfileAvatar
      pfpUrl={pfpUrl}
      size={effectiveSize}
      alt="Create Drop Profile"
    />
  );
}
