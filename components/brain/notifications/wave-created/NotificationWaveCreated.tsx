import Link from "next/link";
import { INotificationWaveCreated } from "../../../../types/feed.types";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { getTimeAgoShort } from "../../../../helpers/Helpers";
import WaveHeaderFollow, {
  WaveFollowBtnSize,
} from "../../../waves/header/WaveHeaderFollow";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";

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

  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between gap-2">
      <div className="tw-flex tw-gap-x-2 tw-items-center">
        <div className="tw-h-7 tw-w-7">
          {notification.related_identity.pfp ? (
            <img
              src={getScaledImageUri(
                notification.related_identity.pfp,
                ImageScale.W_AUTO_H_50
              )}
              alt="#"
              className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
            />
          ) : (
            <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
          )}
        </div>
        <span className="tw-text-sm tw-font-normal tw-text-iron-50">
          <Link
            href={`/${notification.related_identity.handle}`}
            className="tw-no-underline tw-font-semibold">
            {notification.related_identity.handle}
          </Link>{" "}
          invited you to a wave:{" "}
          <Link
            href={`/my-stream?wave=${notification.additional_context.wave_id}`}
            className="tw-text-md tw-font-medium tw-no-underline tw-text-primary-400 hover:tw-text-primary-300">
            {wave?.name}
          </Link>{" "}
          <span className="tw-text-sm tw-text-iron-500 tw-font-normal tw-whitespace-nowrap">
            <span className="tw-font-bold tw-mx-0.5">&#8226;</span>{" "}
            {getTimeAgoShort(notification.created_at)}
          </span>
        </span>
      </div>
      {wave && (
        <WaveHeaderFollow
          wave={wave}
          subscribeToAllDrops={true}
          size={WaveFollowBtnSize.SMALL}
        />
      )}
    </div>
  );
}
