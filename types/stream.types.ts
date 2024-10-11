import { ApiDrop } from "../generated/models/ApiDrop";
import { ApiDropVote } from "../generated/models/ApiDropVote";
import { ApiProfileMin } from "../generated/models/ApiProfileMin";
import { ApiWave } from "../generated/models/ApiWave";

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
  readonly data: ApiWave;
  readonly type: StreamType.WAVE_CREATED;
};

export type DropCreatedStream = {
  readonly id: string;
  readonly data: ApiDrop;
  readonly type: StreamType.DROP_CREATED;
};

export type DropRepliedDataStream = {
  readonly drop: ApiDrop;
  readonly reply: ApiDrop;
};

export type DropRepliedStream = {
  readonly id: string;
  readonly data: DropRepliedDataStream;
  readonly type: StreamType.DROP_REPLIED;
};

export type DropVotedDataStream = {
  readonly drop: ApiDrop;
  readonly vote: ApiDropVote;
};

export type DropVotedStream = {
  readonly id: string;
  readonly data: DropVotedDataStream;
  readonly type: StreamType.DROP_VOTED;
};

export type IdentitySubscribedDataStream = {
  readonly createdAt: number;
  readonly readAt: number | null;
  readonly relatedIdentity: ApiProfileMin;
};

export type IdentitySubscribedStream = {
  readonly id: string;
  readonly data: IdentitySubscribedDataStream;
  readonly type: StreamType.IDENTITY_SUBSCRIBED;
};

export type IdentityMentionedDataStream = {
  readonly createdAt: number;
  readonly readAt: number | null;
  readonly relatedIdentity: ApiProfileMin;
  readonly relatedDrops: Array<ApiDrop>;
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
