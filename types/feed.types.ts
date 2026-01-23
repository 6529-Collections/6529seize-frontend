import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiFeedItemType } from "@/generated/models/ApiFeedItemType";
import type { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiNotificationsResponse } from "@/generated/models/ApiNotificationsResponse";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWave } from "@/generated/models/ApiWave";

type IFeedItemWaveCreated = {
  readonly serial_no: number;
  readonly item: ApiWave;
  readonly type: ApiFeedItemType.WaveCreated;
};

type IFeedItemDropCreated = {
  readonly serial_no: number;
  readonly item: ApiDrop;
  readonly type: ApiFeedItemType.DropCreated;
};

type IFeedItemDropRepliedItem = {
  readonly drop: ApiDrop;
  readonly reply: ApiDrop;
};

type IFeedItemDropReplied = {
  readonly serial_no: number;
  readonly item: IFeedItemDropRepliedItem;
  readonly type: ApiFeedItemType.DropReplied;
};

export type TypedFeedItem =
  | IFeedItemWaveCreated
  | IFeedItemDropCreated
  | IFeedItemDropReplied;

/**
 * Base notification fields shared by all notification types.
 */
type NotificationBase = {
  readonly id: number;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ApiProfileMin;
};

type WithDrops = {
  readonly related_drops: Array<ApiDrop>;
};

export type INotificationIdentitySubscribed = NotificationBase & {
  readonly cause: ApiNotificationCause.IdentitySubscribed;
};

export type INotificationIdentityRep = NotificationBase & {
  readonly cause: ApiNotificationCause.IdentityRep;
  readonly additional_context: {
    readonly amount: number;
    readonly total: number;
    readonly category: string;
  };
};

export type INotificationIdentityNic = NotificationBase & {
  readonly cause: ApiNotificationCause.IdentityNic;
  readonly additional_context: {
    readonly amount: number;
    readonly total: number;
  };
};

export type INotificationIdentityMentioned = NotificationBase &
  WithDrops & {
    readonly cause: ApiNotificationCause.IdentityMentioned;
  };

export type INotificationDropVoted = NotificationBase &
  WithDrops & {
    readonly cause: ApiNotificationCause.DropVoted;
    readonly additional_context: {
      readonly vote: number;
    };
  };

export type INotificationDropReacted = NotificationBase &
  WithDrops & {
    readonly cause: ApiNotificationCause.DropReacted;
    readonly additional_context: {
      readonly reaction: string;
    };
  };

export type INotificationDropBoosted = NotificationBase &
  WithDrops & {
    readonly cause: ApiNotificationCause.DropBoosted;
    readonly additional_context: Record<string, unknown>;
  };

export type INotificationDropQuoted = NotificationBase &
  WithDrops & {
    readonly cause: ApiNotificationCause.DropQuoted;
    readonly additional_context: {
      readonly quote_drop_id: string;
      readonly quote_drop_part: string;
      readonly quoted_drop_id: string;
      readonly quoted_drop_part: string;
    };
  };

export type INotificationDropReplied = NotificationBase &
  WithDrops & {
    readonly cause: ApiNotificationCause.DropReplied;
    readonly additional_context: {
      readonly reply_drop_id: string;
      readonly replied_drop_id: string;
      readonly replied_drop_part: string;
    };
  };

export type INotificationWaveCreated = NotificationBase & {
  readonly cause: ApiNotificationCause.WaveCreated;
  readonly additional_context: {
    readonly wave_id: string;
  };
};

export type INotificationAllDrops = NotificationBase &
  WithDrops & {
    readonly cause: ApiNotificationCause.AllDrops;
    readonly additional_context: {
      readonly vote: number;
    };
  };

export type INotificationPriorityAlert = NotificationBase &
  WithDrops & {
    readonly cause: ApiNotificationCause.PriorityAlert;
    readonly additional_context: Record<string, unknown>;
  };

export type TypedNotification =
  | INotificationIdentitySubscribed
  | INotificationIdentityMentioned
  | INotificationIdentityRep
  | INotificationIdentityNic
  | INotificationDropVoted
  | INotificationDropReacted
  | INotificationDropBoosted
  | INotificationDropQuoted
  | INotificationDropReplied
  | INotificationWaveCreated
  | INotificationAllDrops
  | INotificationPriorityAlert;

/**
 * Fallback type for unknown/unsupported notification causes.
 * Used to render generic notifications that don't match known causes.
 */
export type INotificationGeneric = {
  readonly id: number;
  readonly cause: string;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity?: ApiProfileMin;
  readonly related_drops?: Array<ApiDrop>;
  readonly additional_context?: Record<string, unknown>;
};

export interface TypedNotificationsResponse extends Omit<
  ApiNotificationsResponse,
  "notifications"
> {
  readonly notifications: TypedNotification[];
}
