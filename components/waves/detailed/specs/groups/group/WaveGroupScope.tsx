import Link from "next/link";
import { Group } from "../../../../../../generated/models/Group";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../../helpers/image.helpers";

export default function WaveGroupScope({ group }: { readonly group: Group }) {
  if (group.is_hidden) {
    return (
      <span className="tw-font-medium tw-text-md tw-text-iron-400">Hidden</span>
    );
  }
  return (
    <Link
      href={`/community?page=1&group=${group.id}`}
      className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-gap-x-2"
    >
      {group.author?.pfp ? (
        <img
          className="tw-h-6 tw-w-6 tw-rounded-md tw-bg-iron-800"
          src={getScaledImageUri(group.author.pfp, ImageScale.W_AUTO_H_50)}
          alt="Profile Picture"
        />
      ) : (
        <div className="tw-h-6 tw-w-6 tw-rounded-md tw-bg-iron-800" />
      )}
      <span className="tw-font-medium tw-text-md tw-text-primary-300">
        {group.name}
      </span>
    </Link>
  );
}
