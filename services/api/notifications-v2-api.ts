import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiNotificationAdditionalContextV2 } from "@/generated/models/ApiNotificationAdditionalContextV2";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiNotificationDropReactedReactor } from "@/generated/models/ApiNotificationDropReactedReactor";
import type { ApiNotificationV2 } from "@/generated/models/ApiNotificationV2";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import { commonApiFetch } from "@/services/api/common-api";
import {
  mapApiWaveOverviewToApiWaveMin,
  mapIdentityOverviewToProfileMin,
} from "@/services/api/drop-v2-mappers";
import { mapLeaderboardDropV2 } from "@/services/api/wave-drops-v2-api";
import type {
  INotificationDropReacted,
  TypedNotification,
  TypedNotificationsResponse,
} from "@/types/feed.types";

type NotificationWaveMin = ApiWaveMin & {
  readonly is_direct_message?: boolean;
};

const knownNotificationCauses = new Set<string>(
  Object.values(ApiNotificationCause)
);

type FetchNotificationsV2Params = {
  readonly limit: string;
  readonly cause?: ApiNotificationCause[] | null | undefined;
  readonly pageParam?: number | null | undefined;
  readonly signal?: AbortSignal | undefined;
  readonly headers?: Record<string, string> | undefined;
};

const toStringValue = (value: string | number | undefined): string =>
  value === undefined ? "" : String(value);

const mapWaveOverviewToNotificationWaveMin = (
  wave: ApiWaveOverview
): NotificationWaveMin => ({
  ...mapApiWaveOverviewToApiWaveMin(wave),
  is_direct_message: wave.is_dm_wave,
});

const mapWaveOverviewToNotificationRelatedWave = (
  wave: ApiWaveOverview
): ApiWaveOverview & NotificationWaveMin => ({
  ...wave,
  ...mapWaveOverviewToNotificationWaveMin(wave),
});

const mapDropV2ToApiDrop = ({
  drop,
  wave,
}: {
  readonly drop: ApiDropV2;
  readonly wave: NotificationWaveMin;
}): ApiDrop => ({
  ...mapLeaderboardDropV2({ drop, wave }),
  wave,
});

const mapRelatedDrops = (notification: ApiNotificationV2): ApiDrop[] => {
  if (!notification.related_wave) {
    return [];
  }

  const wave = mapWaveOverviewToNotificationWaveMin(notification.related_wave);

  return notification.related_drops.map((drop) =>
    mapDropV2ToApiDrop({ drop, wave })
  );
};

const emptyProfile = ({
  id,
  handle,
  pfp,
}: {
  readonly id: string;
  readonly handle: string | null;
  readonly pfp: string | null;
}): ApiProfileMin => ({
  id,
  handle,
  pfp,
  banner1_color: null,
  banner2_color: null,
  cic: 0,
  rep: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  level: 0,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  primary_address: "",
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
});

const mapReactorToProfileMin = (
  reactor: ApiNotificationDropReactedReactor,
  fallbackIndex: number,
  fallbackProfile: ApiProfileMin
): ApiProfileMin => {
  const trimmedHandle = reactor.handle?.trim();
  const handle =
    trimmedHandle === undefined || trimmedHandle === "" ? null : trimmedHandle;

  if (
    fallbackProfile.handle?.toLowerCase() === handle?.toLowerCase() &&
    handle !== null
  ) {
    return {
      ...fallbackProfile,
      pfp: reactor.pfp ?? fallbackProfile.pfp,
    };
  }

  return emptyProfile({
    id: handle ?? `reactor-${fallbackIndex}`,
    handle,
    pfp: reactor.pfp ?? null,
  });
};

const mapBaseNotification = (notification: ApiNotificationV2) => ({
  id: notification.id,
  cause: notification.cause,
  created_at: notification.created_at,
  read_at: notification.read_at,
  related_identity: mapIdentityOverviewToProfileMin(
    notification.related_identity
  ),
});

const mapDropReactedNotification = (
  notification: ApiNotificationV2,
  relatedDrops: ApiDrop[]
): INotificationDropReacted[] => {
  const reaction = notification.additional_context.reaction ?? "";
  const reactors = notification.additional_context.reactors ?? [];
  const base = {
    ...mapBaseNotification(notification),
    cause: ApiNotificationCause.DropReacted,
    related_drops: relatedDrops,
    additional_context: {
      reaction,
    },
  } satisfies INotificationDropReacted;

  if (!reactors.length) {
    return [base];
  }

  return reactors.map((reactor, index) => ({
    ...base,
    related_identity: mapReactorToProfileMin(
      reactor,
      index,
      base.related_identity
    ),
  }));
};

const handleUnknownNotificationCause = (
  notification: ApiNotificationV2
): TypedNotification[] => {
  const cause = String(notification.cause);
  const knownCauses = [...knownNotificationCauses].join(", ");
  console.error(
    `Unsupported notification cause "${cause}". Known ApiNotificationCause values: ${knownCauses}`
  );
  return [];
};

const mapNotificationV2 = (
  notification: ApiNotificationV2
): TypedNotification[] => {
  const base = mapBaseNotification(notification);
  const relatedDrops = mapRelatedDrops(notification);
  const context: ApiNotificationAdditionalContextV2 =
    notification.additional_context;

  switch (notification.cause) {
    case ApiNotificationCause.IdentitySubscribed:
      return [
        {
          ...base,
          cause: ApiNotificationCause.IdentitySubscribed,
        },
      ];
    case ApiNotificationCause.IdentityRep:
      return [
        {
          ...base,
          cause: ApiNotificationCause.IdentityRep,
          additional_context: {
            amount: context.amount ?? 0,
            total: context.total ?? 0,
            category: context.category ?? "",
          },
        },
      ];
    case ApiNotificationCause.IdentityNic:
      return [
        {
          ...base,
          cause: ApiNotificationCause.IdentityNic,
          additional_context: {
            amount: context.amount ?? 0,
            total: context.total ?? 0,
          },
        },
      ];
    case ApiNotificationCause.IdentityMentioned:
      return [
        {
          ...base,
          cause: ApiNotificationCause.IdentityMentioned,
          related_drops: relatedDrops,
        },
      ];
    case ApiNotificationCause.DropVoted:
      return [
        {
          ...base,
          cause: ApiNotificationCause.DropVoted,
          related_drops: relatedDrops,
          additional_context: {
            vote: context.vote ?? 0,
          },
        },
      ];
    case ApiNotificationCause.DropReacted:
      return mapDropReactedNotification(notification, relatedDrops);
    case ApiNotificationCause.DropBoosted:
      return [
        {
          ...base,
          cause: ApiNotificationCause.DropBoosted,
          related_drops: relatedDrops,
          additional_context: { ...context },
        },
      ];
    case ApiNotificationCause.DropQuoted:
      return [
        {
          ...base,
          cause: ApiNotificationCause.DropQuoted,
          related_drops: relatedDrops,
          additional_context: {
            quote_drop_id: context.quote_drop_id ?? "",
            quote_drop_part: toStringValue(context.quote_drop_part),
            quoted_drop_id: context.quoted_drop_id ?? "",
            quoted_drop_part: toStringValue(context.quoted_drop_part),
          },
        },
      ];
    case ApiNotificationCause.DropReplied:
      return [
        {
          ...base,
          cause: ApiNotificationCause.DropReplied,
          related_drops: relatedDrops,
          additional_context: {
            reply_drop_id: context.reply_drop_id ?? "",
            replied_drop_id: context.replied_drop_id ?? "",
            replied_drop_part: toStringValue(context.replied_drop_part),
          },
        },
      ];
    case ApiNotificationCause.WaveCreated:
      return [
        {
          ...base,
          cause: ApiNotificationCause.WaveCreated,
          ...(notification.related_wave
            ? {
                related_wave: mapWaveOverviewToNotificationRelatedWave(
                  notification.related_wave
                ),
              }
            : {}),
          additional_context: {
            wave_id:
              notification.related_wave?.id ??
              notification.additional_context.wave_id ??
              "",
          },
        },
      ];
    case ApiNotificationCause.AllDrops:
      return [
        {
          ...base,
          cause: ApiNotificationCause.AllDrops,
          related_drops: relatedDrops,
          additional_context: {
            vote: context.vote ?? 0,
          },
        },
      ];
    case ApiNotificationCause.PriorityAlert:
      return [
        {
          ...base,
          cause: ApiNotificationCause.PriorityAlert,
          related_drops: relatedDrops,
          additional_context: { ...context },
        },
      ];
    default:
      return handleUnknownNotificationCause(notification);
  }
};

const mapNotificationsV2Response = (
  response: ApiNotificationsResponseV2
): TypedNotificationsResponse => ({
  unread_count: response.unread_count,
  notifications: response.notifications.flatMap(mapNotificationV2),
});

const buildNotificationsV2Params = ({
  limit,
  cause,
  pageParam,
}: Pick<FetchNotificationsV2Params, "limit" | "cause" | "pageParam">): Record<
  string,
  string
> => {
  const params: Record<string, string> = { limit };

  if (pageParam !== null && pageParam !== undefined) {
    params["id_less_than"] = String(pageParam);
  }

  if (cause !== null && cause !== undefined && cause.length > 0) {
    params["cause"] = cause.join(",");
  }

  return params;
};

export const fetchNotificationsV2 = async ({
  limit,
  cause,
  pageParam,
  signal,
  headers,
}: FetchNotificationsV2Params): Promise<TypedNotificationsResponse> => {
  const response = await commonApiFetch<ApiNotificationsResponseV2>({
    endpoint: "v2/notifications",
    params: buildNotificationsV2Params({ limit, cause, pageParam }),
    signal,
    headers,
  });

  return mapNotificationsV2Response(response);
};
