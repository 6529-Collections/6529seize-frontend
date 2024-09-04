import { Drop } from "../generated/models/Drop";
import { DropVote } from "../generated/models/DropVote";
import { FeedItemType } from "../generated/models/FeedItemType";
import { NotificationCause } from "../generated/models/NotificationCause";
import { NotificationsResponse } from "../generated/models/NotificationsResponse";
import { ProfileMin } from "../generated/models/ProfileMin";
import { Wave } from "../generated/models/Wave";

export type IFeedItemWaveCreated = {
  readonly serial_no: number;
  readonly item: Wave;
  readonly type: FeedItemType.WaveCreated;
};

export type IFeedItemDropCreated = {
  readonly serial_no: number;
  readonly item: Drop;
  readonly type: FeedItemType.DropCreated;
};

export type IFeedItemDropRepliedItem = {
  readonly drop: Drop;
  readonly reply: Drop;
};

export type IFeedItemDropReplied = {
  readonly serial_no: number;
  readonly item: IFeedItemDropRepliedItem;
  readonly type: FeedItemType.DropReplied;
};

export type IFeedItemDropVotedItem = {
  readonly drop: Drop;
  readonly vote: DropVote;
};


export type TypedFeedItem =
  | IFeedItemWaveCreated
  | IFeedItemDropCreated
  | IFeedItemDropReplied

export type INotificationIdentitySubscribed = {
  readonly id: number;
  readonly cause: NotificationCause.IdentitySubscribed;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ProfileMin;
};

export type INotificationIdentityMentioned = {
  readonly id: number;
  readonly cause: NotificationCause.IdentityMentioned;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ProfileMin;
  readonly related_drops: Array<Drop>;
};

export type INotificationDropVoted = {
  readonly id: number;
  readonly cause: NotificationCause.DropVoted;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ProfileMin;
  readonly related_drops: Array<Drop>;
  readonly additional_context: {
    readonly vote: number;
  };
};

export type INotificationDropQuoted = {
  readonly id: number;
  readonly cause: NotificationCause.DropQuoted;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ProfileMin;
  readonly related_drops: Array<Drop>;
  readonly additional_context: {
    readonly quote_drop_id: string;
    readonly quote_drop_part: string;
    readonly quoted_drop_id: string;
    readonly quoted_drop_part: string;
  };
};

export type INotificationDropReplied = {
  readonly id: number;
  readonly cause: NotificationCause.DropReplied;
  readonly created_at: number;
  readonly read_at: number | null;
  readonly related_identity: ProfileMin;
  readonly related_drops: Array<Drop>;
  readonly additional_context: {
    readonly reply_drop_id: string;
    readonly replied_drop_id: string;
    readonly replied_drop_part: string;
  };
};

export type TypedNotification =
  | INotificationIdentitySubscribed
  | INotificationIdentityMentioned
  | INotificationDropVoted
  | INotificationDropQuoted
  | INotificationDropReplied;

export interface TypedNotificationsResponse
  extends Omit<NotificationsResponse, "notifications"> {
  readonly notifications: TypedNotification[];
}
