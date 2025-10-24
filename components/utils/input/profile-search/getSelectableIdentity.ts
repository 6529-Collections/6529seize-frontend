import { CommunityMemberMinimal } from "@/entities/IProfile";

export const getSelectableIdentity = (
  profile: CommunityMemberMinimal | null | undefined
): string | null => {
  if (!profile) {
    return null;
  }

  return (
    profile.primary_wallet ??
    profile.wallet ??
    profile.handle ??
    null
  );
};
