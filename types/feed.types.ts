import { Drop } from "../generated/models/Drop";
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

export type IFeedItemDropVoted = {
  readonly serial_no: number;
  readonly item: IFeedItemDropVotedItem;
  readonly type: FeedItemType.DropVoted;
};

export type TypedFeedItem =
  | IFeedItemWaveCreated
  | IFeedItemDropCreated
  | IFeedItemDropReplied
  | IFeedItemDropVoted;
