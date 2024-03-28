import Link from "next/link";
import { MentionedUser } from "../../../../../entities/IDrop";

export default function DropListItemDataContentProfiles({
  profiles,
}: {
  readonly profiles: MentionedUser[];
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-xxs tw-text-iron-500 tw-font-normal">
        Profiles mentioned
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
            {i < profiles.length - 1 ? "•" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
