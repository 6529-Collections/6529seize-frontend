import { Drop } from "../generated/models/Drop";
import { DropComment } from "../generated/models/DropComment";
import { DropVote } from "../generated/models/DropVote";
import { FeedItemType } from "../generated/models/FeedItemType";
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

export type IFeedItemDropCommentedItem = {
  readonly drop: Drop;
  readonly comment: DropComment;
};

export type IFeedItemDropCommented = {
  readonly serial_no: number;
  readonly item: IFeedItemDropCommentedItem;
  readonly type: FeedItemType.DropCommented;
};

export type IFeedItemDropVotedItem = {
  readonly drop: Drop;
  readonly vote: DropVote;
};

export type IFeedItemDropVoted = {
  readonly serial_no: number;
  readonly item: IFeedItemDropVotedItem;
  readonly type: FeedItemType.DropVoted;
};

export type TypedFeedItem =
  | IFeedItemWaveCreated
  | IFeedItemDropCreated
  | IFeedItemDropCommented
  | IFeedItemDropVoted;
