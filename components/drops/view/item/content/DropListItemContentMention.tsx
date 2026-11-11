import Link from "next/link";
import type { MentionedUser } from "@/entities/IDrop";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";

const MENTION_TEXT_CLASS_NAME = "tw-font-medium tw-text-primary-400";
const MENTION_CLASS_NAME = `tw-no-underline ${MENTION_TEXT_CLASS_NAME} desktop-hover:hover:tw-underline desktop-hover:hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out`;

/**
 * The profile path for a mentioned handle: one encoded path segment, so the
 * handle text can never add segments, a query or a fragment. Dot segments
 * have no profile and get no link.
 */
function getMentionProfileHref(handle: string): string | null {
  const segment = encodeURIComponent(handle);
  if (segment === "" || segment === "." || segment === "..") {
    return null;
  }
  return `/${segment}`;
}

export default function DropListItemContentMention({
  user,
}: {
  readonly user: MentionedUser;
}) {
  const href = getMentionProfileHref(user.handle_in_content);
  const label = `@${user.handle_in_content}`;

  return (
    <UserProfileTooltipWrapper user={user.mentioned_profile_id}>
      {href ? (
        <Link
          onClick={(e) => e.stopPropagation()}
          href={href}
          className={MENTION_CLASS_NAME}
        >
          {label}
        </Link>
      ) : (
        // Mention colour and weight, but plain text: it opens nothing, so it
        // has no hover affordance and no click handling.
        <span className={MENTION_TEXT_CLASS_NAME}>{label}</span>
      )}
    </UserProfileTooltipWrapper>
  );
}
