import Link from "next/link";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function WaveGroupScope({
  group,
}: {
  readonly group: ApiGroup;
}) {
  if (group.is_hidden || group.is_direct_message) {
    return (
      <span className="tw-py-0.5 tw-font-medium tw-text-iron-50">
        {t(DEFAULT_LOCALE, "waves.chatSettings.access.privateGroup")}
      </span>
    );
  }

  const groupId = group.id?.trim();
  const groupName = group.name?.trim();
  if (!groupId || !groupName) {
    return (
      <span className="tw-py-0.5 tw-font-medium tw-text-iron-50">
        {t(DEFAULT_LOCALE, "waves.chatSettings.access.unavailableGroup")}
      </span>
    );
  }

  return (
    <Link
      href={`/network?page=1&group=${encodeURIComponent(groupId)}`}
      aria-label={t(DEFAULT_LOCALE, "waves.chatSettings.access.inspectGroup", {
        groupName,
      })}
      title={groupName}
      className="tw-inline-flex tw-min-h-11 tw-w-fit tw-min-w-0 tw-max-w-full tw-cursor-pointer tw-items-center tw-justify-end tw-rounded-md tw-text-iron-50 tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-underline desktop-hover:hover:tw-decoration-2 sm:tw-min-h-9"
    >
      <span className="tw-min-w-0 tw-break-words tw-text-right tw-font-medium tw-leading-5">
        {group.author?.pfp ? (
          // Profile images can come from arbitrary remote hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="tw-mr-2 tw-inline-block tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800/80 tw-align-middle tw-shadow-sm"
            src={getScaledImageUri(group.author.pfp, ImageScale.W_AUTO_H_50)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="tw-mr-2 tw-inline-block tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800/80 tw-align-middle" />
        )}
        <span className="tw-underline tw-underline-offset-2 tw-transition tw-duration-300 tw-ease-out">
          {groupName}
        </span>
      </span>
    </Link>
  );
}
