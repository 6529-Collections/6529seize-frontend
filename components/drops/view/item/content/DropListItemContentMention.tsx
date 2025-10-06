import Link from "next/link";
import { MentionedUser } from "@/entities/IDrop";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";

export default function DropListItemContentMention({
  user,
}: {
  readonly user: MentionedUser;
}) {
  return (
    <UserProfileTooltipWrapper user={user.mentioned_profile_id}>
      <Link
        onClick={(e) => e.stopPropagation()}
        href={`/${user.handle_in_content}`}
        className="tw-align-middle tw-no-underline tw-font-medium tw-text-primary-400 desktop-hover:hover:tw-underline desktop-hover:hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out">
        @{user.handle_in_content}
      </Link>
    </UserProfileTooltipWrapper>
  );
}
