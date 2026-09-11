import type { MentionAliasMember } from "@/entities/IMentionAlias";
import type { CommunityMemberMinimal } from "@/entities/IProfile";

export function getAvailableMentionIdentities(
  identities: CommunityMemberMinimal[],
  members: MentionAliasMember[],
  ownerProfileId: string | null
) {
  const selectedProfileIds = new Set(
    members.map((member) => member.profile_id)
  );

  return identities.filter(
    (identity) =>
      !!identity.profile_id &&
      !!identity.handle &&
      identity.profile_id !== ownerProfileId &&
      !selectedProfileIds.has(identity.profile_id)
  );
}
