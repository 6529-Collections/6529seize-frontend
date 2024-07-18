import { Drop } from "../generated/models/Drop";
import { DropComment } from "../generated/models/DropComment";
import { DropVote } from "../generated/models/DropVote";
import { FeedItemType } from "../generated/models/FeedItemType";
import { Wave } from "../generated/models/Wave";

export type FeedItemWaveCreated = {
  readonly serial_no: number;
  readonly item: Wave;
  readonly type: FeedItemType.WaveCreated;
};

export type FeedItemDropCreated = {
  readonly serial_no: number;
  readonly item: Drop;
  readonly type: FeedItemType.DropCreated;
};

export type FeedItemDropCommentedItem = {
  readonly drop: Drop;
  readonly comment: DropComment;
};

export type FeedItemDropCommented = {
  readonly serial_no: number;
  readonly item: FeedItemDropCommentedItem;
  readonly type: FeedItemType.DropCommented;
};

export type FeedItemDropVotedItem = {
  readonly drop: Drop;
  readonly vote: DropVote;
};

export type FeedItemDropVoted = {
  readonly serial_no: number;
  readonly item: FeedItemDropVotedItem;
  readonly type: FeedItemType.DropVoted;
};

export type TypedFeedItem =
  | FeedItemWaveCreated
  | FeedItemDropCreated
  | FeedItemDropCommented
  | FeedItemDropVoted;
