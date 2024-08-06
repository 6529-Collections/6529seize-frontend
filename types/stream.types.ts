import { Drop } from "../generated/models/Drop";
import { DropVote } from "../generated/models/DropVote";
import { ProfileMin } from "../generated/models/ProfileMin";
import { Wave } from "../generated/models/Wave";

export enum StreamType {
  WAVE_CREATED = "WAVE_CREATED",
  DROP_CREATED = "DROP_CREATED",
  DROP_REPLIED = "DROP_REPLIED",
  DROP_VOTED = "DROP_VOTED",
  IDENTITY_SUBSCRIBED = "IDENTITY_SUBSCRIBED",
  IDENTITY_MENTIONED = "IDENTITY_MENTIONED",
}

export type WaveCreatedStream = {
  readonly id: string;
  readonly data: Wave;
  readonly type: StreamType.WAVE_CREATED;
};

export type DropCreatedStream = {
  readonly id: string;
  readonly data: Drop;
  readonly type: StreamType.DROP_CREATED;
};

export type DropRepliedDataStream = {
  readonly drop: Drop;
  readonly reply: Drop;
};

export type DropRepliedStream = {
  readonly id: string;
  readonly data: DropRepliedDataStream;
  readonly type: StreamType.DROP_REPLIED;
};

export type DropVotedDataStream = {
  readonly drop: Drop;
  readonly vote: DropVote;
};

export type DropVotedStream = {
  readonly id: string;
  readonly data: DropVotedDataStream;
  readonly type: StreamType.DROP_VOTED;
};

export type IdentitySubscribedDataStream = {
  readonly createdAt: number;
  readonly readAt: number | null;
  readonly relatedIdentity: ProfileMin;
};

export type IdentitySubscribedStream = {
  readonly id: string;
  readonly data: IdentitySubscribedDataStream;
  readonly type: StreamType.IDENTITY_SUBSCRIBED;
};

export type IdentityMentionedDataStream = {
  readonly createdAt: number;
  readonly readAt: number | null;
  readonly relatedIdentity: ProfileMin;
  readonly relatedDrops: Array<Drop>;
};

export type IdentityMentionedStream = {
  readonly id: string;
  readonly data: IdentityMentionedDataStream;
  readonly type: StreamType.IDENTITY_MENTIONED;
};

export type MyStreamItem =
  | WaveCreatedStream
  | DropCreatedStream
  | DropRepliedStream
  | DropVotedStream
  | IdentitySubscribedStream
  | IdentityMentionedStream;
