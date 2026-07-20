import Link from "next/link";
import type { ReactNode } from "react";
import type { INotificationWaveCreated } from "@/types/feed.types";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import {
  FOLLOW_BTN_BUTTON_CLASSES,
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";
import NotificationWaveFollowBtn from "./NotificationWaveFollowBtn";

export default function NotificationWaveCreated({
  notification,
}: {
  readonly notification: INotificationWaveCreated;
}) {
  const { isApp } = useDeviceInfo();
  const wave = notification.related_wave;
  const contextWaveId = notification.additional_context.wave_id || undefined;
  const waveId = wave?.id ?? contextWaveId;
  const isDirectMessage = wave?.is_direct_message ?? wave?.is_dm_wave ?? false;
  const waveHref = waveId
    ? getWaveRoute({
        waveId,
        isDirectMessage,
        isApp,
      })
    : null;
  const waveName = wave?.name ?? waveId ?? "Unknown wave";
  const notificationCopy = isDirectMessage
    ? t(DEFAULT_LOCALE, "notifications.waveCreated.dmCopy")
    : t(DEFAULT_LOCALE, "notifications.waveCreated.normalCopy");
  let waveAction: ReactNode = null;
  if (isDirectMessage && waveHref) {
    waveAction = (
      <Link
        href={waveHref}
        className={`${FOLLOW_BTN_BUTTON_CLASSES[UserFollowBtnSize.SMALL]} tw-flex tw-cursor-pointer tw-items-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-font-semibold tw-text-white tw-no-underline tw-ring-1 tw-ring-inset tw-ring-primary-500 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-primary-600 hover:tw-text-white hover:tw-ring-primary-600`}
      >
        {t(DEFAULT_LOCALE, "notifications.waveCreated.openDm")}
      </Link>
    );
  } else if (wave) {
    waveAction = (
      <NotificationWaveFollowBtn
        wave={wave}
        size={UserFollowBtnSize.SMALL}
        followLabel={t(DEFAULT_LOCALE, "notifications.waveCreated.joinWave")}
        followingLabel={t(
          DEFAULT_LOCALE,
          "notifications.waveCreated.joinedWave"
        )}
      />
    );
  }

  return (
    <div className="tw-w-full">
      <NotificationHeader
        author={notification.related_identity}
        actions={
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            {waveAction}
            <NotificationsFollowBtn
              profile={notification.related_identity}
              size={UserFollowBtnSize.SMALL}
              followLabel={t(
                DEFAULT_LOCALE,
                "notifications.waveCreated.followCreator"
              )}
              followingLabel={t(
                DEFAULT_LOCALE,
                "notifications.waveCreated.followingCreator"
              )}
            />
          </div>
        }
      >
        <span className="tw-text-sm tw-font-normal tw-text-iron-400">
          {notificationCopy}
        </span>
        {waveHref ? (
          <Link
            href={waveHref}
            className="tw-text-sm tw-font-medium tw-text-primary-400 tw-no-underline hover:tw-text-primary-300"
          >
            {waveName}
          </Link>
        ) : (
          <span className="tw-text-sm tw-font-medium tw-text-iron-300">
            {waveName}
          </span>
        )}
        <NotificationTimestamp createdAt={notification.created_at} />
      </NotificationHeader>
    </div>
  );
}
