import { MentionedUser } from "../../../../../entities/IDrop";
import UserProfileTooltip from "../../../../user/utils/profile/UserProfileTooltip";
import Link from "next/link";
import LazyTippy from "../../../../utils/tooltip/LazyTippy";

export default function DropListItemContentMention({
  user,
}: {
  readonly user: MentionedUser;
}) {
  return (
    <LazyTippy
      placement="bottom"
      interactive={false}
      delay={[500, 200]}
      content={<UserProfileTooltip user={user.mentioned_profile_id} />}>
      <Link
        onClick={(e) => e.stopPropagation()}
        href={`/${user.handle_in_content}`}
        target="_blank"
        className="tw-align-middle tw-no-underline tw-font-medium tw-text-primary-400 desktop-hover:hover:tw-underline desktop-hover:hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out">
        @{user.handle_in_content}
      </Link>
    </LazyTippy>
  );
}
