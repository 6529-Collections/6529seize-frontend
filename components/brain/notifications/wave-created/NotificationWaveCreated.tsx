import Link from "next/link";
import type { INotificationWaveCreated } from "@/types/feed.types";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";
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
  const invitationHref = waveId
    ? getWaveRoute({
        waveId,
        isDirectMessage: wave?.is_direct_message ?? wave?.is_dm_wave ?? false,
        isApp,
      })
    : null;
  const waveName = wave?.name ?? waveId ?? "Unknown wave";

  return (
    <div className="tw-w-full">
      <NotificationHeader
        author={notification.related_identity}
        actions={
          <div className="tw-flex tw-items-center tw-gap-x-2">
            {wave && (
              <NotificationWaveFollowBtn
                wave={wave}
                size={UserFollowBtnSize.SMALL}
              />
            )}
            <NotificationsFollowBtn
              profile={notification.related_identity}
              size={UserFollowBtnSize.SMALL}
            />
          </div>
        }
      >
        <span className="tw-text-sm tw-font-normal tw-text-iron-400">
          invited you to a wave:
        </span>
        {invitationHref ? (
          <Link
            href={invitationHref}
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
