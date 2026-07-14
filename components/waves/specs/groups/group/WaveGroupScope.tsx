import Link from "next/link";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

export default function WaveGroupScope({
  group,
}: {
  readonly group: ApiGroup;
}) {
  if (group.is_hidden) {
    return <span className="tw-font-medium tw-text-iron-50">Hidden</span>;
  }

  return (
    <Link
      href={`/network?page=1&group=${group.id}`}
      title={group.name}
      className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-1.5 tw-py-0.5 tw-text-iron-50 tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-200 desktop-hover:hover:tw-underline"
    >
      {group.author?.pfp ? (
        <img
          className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-800/80 tw-shadow-sm"
          src={getScaledImageUri(group.author.pfp, ImageScale.W_AUTO_H_50)}
          alt={group.author.handle ?? ""}
        />
      ) : (
        <div className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-800/80" />
      )}
      <div className="tw-min-w-0 tw-truncate tw-font-medium tw-leading-5 tw-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:group-hover:tw-text-iron-400">
        {group.name}
      </div>
    </Link>
  );
}
