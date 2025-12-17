import Link from "next/link";
import { INotificationWaveCreated } from "@/types/feed.types";
import WaveHeaderFollow, {
  WaveFollowBtnSize,
} from "@/components/waves/header/WaveHeaderFollow";
import { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";

export default function NotificationWaveCreated({
  notification,
}: {
  readonly notification: INotificationWaveCreated;
}) {
  const { data: wave } = useQuery<ApiWave>({
    queryKey: [
      QueryKey.WAVE,
      { wave_id: notification.additional_context.wave_id },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${notification.additional_context.wave_id}`,
      }),
  });

  const { isApp } = useDeviceInfo();
  const invitationHref = getWaveRoute({
    waveId: notification.additional_context.wave_id,
    isDirectMessage: wave?.chat.scope.group?.is_direct_message ?? false,
    isApp,
  });

  return (
    <div className="tw-w-full">
      <NotificationHeader
        author={notification.related_identity}
        actions={
          <div className="tw-flex tw-gap-x-2 tw-items-center">
            {wave && (
              <WaveHeaderFollow
                wave={wave}
                subscribeToAllDrops={true}
                size={WaveFollowBtnSize.SMALL}
              />
            )}
            <NotificationsFollowBtn
              profile={notification.related_identity}
              size={UserFollowBtnSize.SMALL}
            />
          </div>
        }
      >
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          invited you to a wave:
        </span>
        <Link
          href={invitationHref}
          className="tw-text-sm tw-font-medium tw-no-underline tw-text-primary-400 hover:tw-text-primary-300"
        >
          {wave?.name}
        </Link>
        <NotificationTimestamp createdAt={notification.created_at} />
      </NotificationHeader>
    </div>
  );
}
