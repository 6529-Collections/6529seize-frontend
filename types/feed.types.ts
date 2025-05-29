import { ApiDrop } from "../generated/models/ApiDrop";
import { ApiDropVote } from "../generated/models/ApiDropVote";
import { ApiFeedItemType } from "../generated/models/ApiFeedItemType";
import { ApiNotificationCause } from "../generated/models/ApiNotificationCause";
import { ApiNotificationsResponse } from "../generated/models/ApiNotificationsResponse";
import { ApiProfileMin } from "../generated/models/ApiProfileMin";
import { ApiWave } from "../generated/models/ApiWave";

export type IFeedItemWaveCreated = {
  readonly serial_no: number;
  readonly item: ApiWave;
  readonly type: ApiFeedItemType.WaveCreated;
};

export type IFeedItemDropCreated = {
  readonly serial_no: number;
  readonly item: ApiDrop;
  readonly type: ApiFeedItemType.DropCreated;
};

type IFeedItemDropRepliedItem = {
  readonly drop: ApiDrop;
  readonly reply: ApiDrop;
};

export type IFeedItemDropReplied = {
  readonly serial_no: number;
  readonly item: IFeedItemDropRepliedItem;
  readonly type: ApiFeedItemType.DropReplied;
};

type IFeedItemDropVotedItem = {
  readonly drop: ApiDrop;
  readonly vote: ApiDropVote;
};

export type TypedFeedItem =
  | IFeedItemWaveCreated
  | IFeedItemDropCreated
  | IFeedItemDropReplied;

export type INotificationIdentitySubscribed = {
  readonly id: number;
  readonly cause: ApiNotificationCause.IdentitySubscribed;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ApiProfileMin;
};

export type INotificationIdentityMentioned = {
  readonly id: number;
  readonly cause: ApiNotificationCause.IdentityMentioned;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ApiProfileMin;
  readonly related_drops: Array<ApiDrop>;
};

export type INotificationDropVoted = {
  readonly id: number;
  readonly cause: ApiNotificationCause.DropVoted;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ApiProfileMin;
  readonly related_drops: Array<ApiDrop>;
  readonly additional_context: {
    readonly vote: number;
  };
};

export type INotificationDropReacted = {
  readonly id: number;
  readonly cause: ApiNotificationCause.DropReacted;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ApiProfileMin;
  readonly related_drops: Array<ApiDrop>;
  readonly additional_context: {
    readonly reaction: string;
  };
};

export type INotificationDropQuoted = {
  readonly id: number;
  readonly cause: ApiNotificationCause.DropQuoted;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ApiProfileMin;
  readonly related_drops: Array<ApiDrop>;
  readonly additional_context: {
    readonly quote_drop_id: string;
    readonly quote_drop_part: string;
    readonly quoted_drop_id: string;
    readonly quoted_drop_part: string;
  };
};

export type INotificationDropReplied = {
  readonly id: number;
  readonly cause: ApiNotificationCause.DropReplied;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ApiProfileMin;
  readonly related_drops: Array<ApiDrop>;
  readonly additional_context: {
    readonly reply_drop_id: string;
    readonly replied_drop_id: string;
    readonly replied_drop_part: string;
  };
};

export type INotificationWaveCreated = {
  readonly id: number;
  readonly cause: ApiNotificationCause.WaveCreated;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ApiProfileMin;
  readonly additional_context: {
    readonly wave_id: string;
  };
};

export type INotificationAllDrops = {
  readonly id: number;
  readonly cause: ApiNotificationCause.AllDrops;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ApiProfileMin;
  readonly related_drops: Array<ApiDrop>;
  readonly additional_context: {
    readonly vote: number;
  };
};

export type TypedNotification =
  | INotificationIdentitySubscribed
  | INotificationIdentityMentioned
  | INotificationDropVoted
  | INotificationDropReacted
  | INotificationDropQuoted
  | INotificationDropReplied
  | INotificationWaveCreated
  | INotificationAllDrops;

export interface TypedNotificationsResponse
  extends Omit<ApiNotificationsResponse, "notifications"> {
  readonly notifications: TypedNotification[];
}
