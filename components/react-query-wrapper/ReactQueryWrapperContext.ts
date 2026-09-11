import type { UserPageRepPropsRepRates } from "@/app/[user]/page";
import type {
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import type { SortDirection } from "@/entities/ISort";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import type { CountlessPage, Page } from "@/helpers/Types";
import type { ActivityLogParams } from "../profile-activity/ProfileActivityLogs";
import { type ProfileRatersParamsOrderBy, RateMatter } from "@/types/enums";
import { createContext } from "react";

export interface ProfileRatersParams {
  readonly page: number;
  readonly pageSize: number;
  readonly given: boolean;
  readonly order: SortDirection;
  readonly orderBy: ProfileRatersParamsOrderBy;
  readonly handleOrWallet: string;
  readonly matter: RateMatter;
}

export interface InitProfileRatersParamsAndData {
  readonly data: Page<RatingWithProfileInfoAndLevel>;
  readonly params: ProfileRatersParams;
}

export interface InitProfileActivityLogsParams {
  readonly params: ActivityLogParams;
  readonly data: CountlessPage<ProfileActivityLog>;
}

export interface InitProfileRepPageParams {
  readonly profile: ApiIdentity;
  readonly repRates: UserPageRepPropsRepRates;
  readonly repLogs: InitProfileActivityLogsParams;
  readonly repGivenToUsers: InitProfileRatersParamsAndData;
  readonly repReceivedFromUsers: InitProfileRatersParamsAndData;
  readonly handleOrWallet: string;
}

export type ReactQueryWrapperContextType = {
  readonly setProfile: (profile: ApiIdentity) => void;
  readonly setWave: (wave: ApiWave) => void;
  readonly setWavesOverviewPage: (wavesOverview: ApiWave[]) => void;
  readonly setWaveDrops: (params: {
    readonly waveDrops: ApiWaveDropsFeed;
    readonly waveId: string;
  }) => void;
  readonly setProfileProxy: (profileProxy: ApiProfileProxy) => void;
  readonly onProfileProxyModify: ({
    profileProxyId,
  }: {
    readonly profileProxyId: string;
  }) => void;
  onProfileCICModify: (params: {
    readonly targetProfile: ApiIdentity;
    readonly connectedProfile: ApiIdentity | null;
    readonly rater: string | null;
    readonly profileProxy: ApiProfileProxy | null;
  }) => void;
  onProfileRepModify: ({
    targetProfile,
    connectedProfile,
    profileProxy,
  }: {
    readonly targetProfile: ApiIdentity;
    readonly connectedProfile: ApiIdentity | null;
    readonly profileProxy: ApiProfileProxy | null;
  }) => void;
  onProfileEdit: ({
    profile,
    previousProfile,
  }: {
    readonly profile: ApiIdentity;
    readonly previousProfile: ApiIdentity | null;
  }) => void;
  onProfileStatementAdd: (params: { profile: ApiIdentity }) => void;
  onProfileStatementRemove: (params: { profile: ApiIdentity }) => void;
  onIdentityFollowChange: () => void;
  initProfileRepPage: (params: InitProfileRepPageParams) => void;
  initCommunityActivityPage: ({
    activityLogs,
  }: {
    activityLogs: InitProfileActivityLogsParams;
  }) => void;
  waitAndInvalidateDrops: () => Promise<void>;
  addOptimisticDrop: (params: { readonly drop: ApiDrop }) => Promise<void>;
  readonly invalidateDrops: () => void;
  onGroupRemoved: ({ groupId }: { readonly groupId: string }) => void;
  onGroupChanged: ({ groupId }: { readonly groupId: string }) => void;
  onGroupCreate: () => void;
  onIdentityBulkRate: () => void;
  onWaveCreated: () => void;
  onWaveFollowChange: (param: {
    readonly waveId: string;
    following: boolean;
  }) => void;
  invalidateAll: () => void;
  invalidateAuthSensitiveQueries: () => void;
  invalidateNotifications: () => void;
  invalidateIdentityTdhStats: (params: { identity: string }) => void;
};

export const ReactQueryWrapperContext =
  createContext<ReactQueryWrapperContextType>({
    setProfile: () => {},
    setWavesOverviewPage: () => {},
    setProfileProxy: () => {},
    setWave: () => {},
    setWaveDrops: () => {},
    onProfileProxyModify: () => {},
    onProfileCICModify: () => {},
    onProfileRepModify: () => {},
    onProfileEdit: () => {},
    onProfileStatementAdd: () => {},
    onProfileStatementRemove: () => {},
    onIdentityFollowChange: () => {},
    initProfileRepPage: () => {},
    initCommunityActivityPage: () => {},
    waitAndInvalidateDrops: async () => {},
    addOptimisticDrop: async () => {},
    invalidateDrops: () => {},
    onGroupRemoved: () => {},
    onGroupChanged: () => {},
    onGroupCreate: () => {},
    onIdentityBulkRate: () => {},
    onWaveCreated: () => {},
    onWaveFollowChange: () => {},
    invalidateAll: () => {},
    invalidateAuthSensitiveQueries: () => {},
    invalidateNotifications: () => {},
    invalidateIdentityTdhStats: () => {},
  });
