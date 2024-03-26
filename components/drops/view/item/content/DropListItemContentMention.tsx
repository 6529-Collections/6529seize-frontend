import { MentionedUser } from "../../../../../entities/IDrop";
import UserProfileTooltip from "../../../../user/utils/profile/UserProfileTooltip";
import Link from "next/link";
import { LazyTippy } from "../../../../utils/tooltip/LazyTippy";

export default function DropListItemContentMention({
  user,
}: {
  readonly user: MentionedUser;
}) {
  return (
    <LazyTippy
      placement={"top"}
      interactive={true}
      content={<UserProfileTooltip user={user.mentioned_profile_id} />}
    >
      <Link
        href={`/${user.handle_in_content}`}
        target="_blank"
        className="tw-no-underline tw-text-blue-500 hover:tw-text-blue-600 tw-transition tw-duration-300 tw-ease-out"
      >
        @{user.handle_in_content}
      </Link>
    </LazyTippy>
  );
}
