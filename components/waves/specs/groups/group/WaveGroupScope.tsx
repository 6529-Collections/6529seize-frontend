import Link from "next/link";
import { ApiGroup } from "@/generated/models/ApiGroup";
import {
  getScaledImageUri,
  ImageScale,
} from "@/helpers/image.helpers";

export default function WaveGroupScope({
  group,
}: {
  readonly group: ApiGroup;
}) {
  if (group.is_hidden) {
    return <span className="tw-font-medium tw-text-iron-400">Hidden</span>;
  }
  return (
    <Link
      href={`/network?page=1&group=${group.id}`}
      className="tw-no-underline desktop-hover:hover:tw-underline hover:tw-text-iron-300 tw-flex tw-items-center tw-gap-x-1.5"
    >
      {group.author?.pfp ? (
        <img
          className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800/80 tw-shadow-sm"
          src={getScaledImageUri(group.author.pfp, ImageScale.W_AUTO_H_50)}
          alt={group.author.handle ?? ""}
        />
      ) : (
        <div className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800/80" />
      )}
      <div className="tw-truncate tw-max-w-40 tw-font-medium tw-text-primary-300 desktop-hover:hover:tw-text-primary-300/80 tw-underline tw-transition tw-duration-300 tw-ease-out">
        {group.name}
      </div>
    </Link>
  );
}
