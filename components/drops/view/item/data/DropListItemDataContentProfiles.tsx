import Link from "next/link";
import { DropMentionedUser } from "../../../../../generated/models/DropMentionedUser";

export default function DropListItemDataContentProfiles({
  profiles,
}: {
  readonly profiles: DropMentionedUser[];
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-xxs tw-text-iron-500 tw-font-normal">
        Identities mentioned
      </p>
      <ul className="tw-pl-0 tw-mb-0 tw-inline-flex tw-list-none tw-gap-x-1 tw-text-xxs tw-text-iron-50 tw-font-medium">
        {profiles.map((profile, i) => (
          <li key={profile.mentioned_profile_id}>
            <Link
              href={`/${profile.handle_in_content}`}
              className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
            >
              {profile.handle_in_content}
            </Link>{" "}
            <span className="tw-text-iron-400">
              {i < profiles.length - 1 ? "•" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
