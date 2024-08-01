import { createContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfileActivityLogRatingEdit,
  RateMatter,
  RatingWithProfileInfoAndLevel,
} from "../../entities/IProfile";
import { UserPageRepPropsRepRates } from "../../pages/[user]/rep";
import { CountlessPage, Page } from "../../helpers/Types";
import {
  ActivityLogParams,
  convertActivityLogParams,
} from "../profile-activity/ProfileActivityLogs";
import { ProfileRatersParams } from "../user/utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { Drop } from "../../generated/models/Drop";
import { ProfileProxy } from "../../generated/models/ProfileProxy";

export enum QueryKey {
  PROFILE = "PROFILE",
  PROFILE_LOGS = "PROFILE_LOGS",
  PROFILE_RATER_CIC_STATE = "PROFILE_RATER_CIC_STATE",
  PROFILE_RATERS = "PROFILE_RATERS",
  PROFILE_CIC_STATEMENTS = "PROFILE_CIC_STATEMENTS",
  PROFILE_SEARCH = "PROFILE_SEARCH",
  PROFILE_REP_RATINGS = "PROFILE_REP_RATINGS",
  PROFILE_TRANSACTIONS = "PROFILE_TRANSACTIONS",
  PROFILE_DISTRIBUTIONS = "PROFILE_DISTRIBUTIONS",
  PROFILE_CONSOLIDATED_TDH = "PROFILE_CONSOLIDATED_TDH",
  PROFILE_COLLECTED = "PROFILE_COLLECTED",
  PROFILE_DROPS = "PROFILE_DROPS",
  PROFILE_AVAILABLE_DROP_RATE = "PROFILE_AVAILABLE_DROP_RATE",
  IDENTITY_AVAILABLE_CREDIT = "IDENTITY_AVAILABLE_CREDIT",
  IDENTITY_FOLLOWERS = "IDENTITY_FOLLOWERS",
  IDENTITY_NOTIFICATIONS = "IDENTITY_NOTIFICATIONS",
  WALLET_TDH = "WALLET_TDH",
  WALLET_TDH_HISTORY = "WALLET_TDH_HISTORY",
  REP_CATEGORIES_SEARCH = "REP_CATEGORIES_SEARCH",
  MEMES_LITE = "MEMES_LITE",
  WALLET_CONSOLIDATIONS_CHECK = "WALLET_CONSOLIDATIONS_CHECK",
  WALLET_DELEGATIONS = "WALLET_DELEGATIONS",
  WALLET_MINTING_DELEGATIONS = "WALLET_MINTING_DELEGATIONS",
  COLLECTION_ALLOWLIST_PHASES = "COLLECTION_ALLOWLIST_PHASES",
  COLLECTION_ALLOWLIST_PROOFS = "COLLECTION_ALLOWLIST_PROOFS",
  NEXTGEN_COLLECTIONS = "NEXTGEN_COLLECTIONS",
  COMMUNITY_MEMBERS_TOP = "COMMUNITY_MEMBERS_TOP",
  RESERVOIR_NFT = "RESERVOIR_NFT",
  DROPS = "DROPS",
  DROP = "DROP",
  DROP_DISCUSSION = "DROP_DISCUSSION",
  GROUPS = "GROUPS",
  GROUP = "GROUP",
  GROUP_WALLET_GROUP_WALLETS = "GROUP_WALLET_GROUP_WALLETS",
  NFTS_SEARCH = "NFTS_SEARCH",
  PROFILE_PROXY = "PROFILE_PROXY",
  PROFILE_PROFILE_PROXIES = "PROFILE_PROFILE_PROXIES",
  EMMA_IDENTITY_ALLOWLISTS = "EMMA_IDENTITY_ALLOWLISTS",
  EMMA_ALLOWLIST_RESULT = "EMMA_ALLOWLIST_RESULT",
  WAVES_OVERVIEW = "WAVES_OVERVIEW",
  WAVES_OVERVIEW_PUBLIC = "WAVES_OVERVIEW_PUBLIC",
  WAVES = "WAVES",
  WAVES_PUBLIC = "WAVES_PUBLIC",
  WAVE = "WAVE",
  FEED_ITEMS = "FEED_ITEMS",
}

type QueryType<T, U, V, W> = [T, U, V, W];
export type ProfileQuery = QueryType<
  IProfileAndConsolidations,
  string,
  IProfileAndConsolidations,
  [QueryKey.PROFILE, string]
>;

export interface InitProfileActivityLogsParamsAndData {
  readonly data: Page<ProfileActivityLogRatingEdit>;
  readonly page: number;
  readonly pageSize: number;
  readonly logType: string;
  readonly matter: RateMatter | null;
  readonly includeIncoming: boolean;
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
  readonly profile: IProfileAndConsolidations;
  readonly repRates: UserPageRepPropsRepRates;
  readonly repLogs: InitProfileActivityLogsParams;
  readonly repGivenToUsers: InitProfileRatersParamsAndData;
  readonly repReceivedFromUsers: InitProfileRatersParamsAndData;
  readonly handleOrWallet: string;
}

export interface InitProfileIdentityPageParams {
  readonly profile: IProfileAndConsolidations;
  readonly activityLogs: InitProfileActivityLogsParams;
  readonly cicGivenToUsers: InitProfileRatersParamsAndData;
  readonly cicReceivedFromUsers: InitProfileRatersParamsAndData;
}

type ReactQueryWrapperContextType = {
  readonly setProfile: (profile: IProfileAndConsolidations) => void;
  readonly setProfileProxy: (profileProxy: ProfileProxy) => void;
  readonly onProfileProxyModify: ({
    profileProxyId,
    createdByHandle,
    grantedToHandle,
  }: {
    readonly profileProxyId: string;
    readonly createdByHandle: string;
    readonly grantedToHandle: string;
  }) => void;
  onProfileCICModify: (params: {
    readonly targetProfile: IProfileAndConsolidations;
    readonly connectedProfile: IProfileAndConsolidations | null;
    readonly rater: string | null;
    readonly profileProxy: ProfileProxy | null;
  }) => void;
  onProfileRepModify: ({
    targetProfile,
    connectedProfile,
    profileProxy,
  }: {
    readonly targetProfile: IProfileAndConsolidations;
    readonly connectedProfile: IProfileAndConsolidations | null;
    readonly profileProxy: ProfileProxy | null;
  }) => void;
  onProfileEdit: ({
    profile,
    previousProfile,
  }: {
    readonly profile: IProfileAndConsolidations;
    readonly previousProfile: IProfileAndConsolidations | null;
  }) => void;
  onProfileStatementAdd: (params: {
    profile: IProfileAndConsolidations;
  }) => void;
  onProfileStatementRemove: (params: {
    profile: IProfileAndConsolidations;
  }) => void;
  onIdentityFollowChange: () => void;
  initProfileRepPage: (params: InitProfileRepPageParams) => void;
  initProfileIdentityPage: (params: InitProfileIdentityPageParams) => void;
  initLandingPage: ({
    activityLogs,
  }: {
    activityLogs: InitProfileActivityLogsParams;
  }) => void;
  initCommunityActivityPage: ({
    activityLogs,
  }: {
    activityLogs: InitProfileActivityLogsParams;
  }) => void;
  onDropCreate: (params: { profile: IProfileAndConsolidations }) => void;
  onRedrop: (params: { readonly reDropId: string }) => void;
  onDropChange: (params: {
    readonly drop: Drop;
    readonly giverHandle: string | null;
  }) => void;
  readonly invalidateDrops: () => void;
  onDropDiscussionChange: (params: {
    readonly dropId: string;
    readonly dropAuthorHandle: string;
  }) => void;
  onGroupRemoved: ({ groupId }: { readonly groupId: string }) => void;
  onGroupChanged: ({ groupId }: { readonly groupId: string }) => void;
  onGroupCreate: () => void;
  onIdentityBulkRate: () => void;
  onWaveCreated: () => void;
  onWaveFollowChange: () => void;
  invalidateAll: () => void;
};

export const ReactQueryWrapperContext =
  createContext<ReactQueryWrapperContextType>({
    setProfile: () => {},
    setProfileProxy: () => {},
    onProfileProxyModify: () => {},
    onProfileCICModify: () => {},
    onProfileRepModify: () => {},
    onProfileEdit: () => {},
    onProfileStatementAdd: () => {},
    onProfileStatementRemove: () => {},
    onIdentityFollowChange: () => {},
    initProfileRepPage: () => {},
    initProfileIdentityPage: () => {},
    initLandingPage: () => {},
    initCommunityActivityPage: () => {},
    onDropCreate: () => {},
    onRedrop: () => {},
    onDropChange: () => {},
    invalidateDrops: () => {},
    onDropDiscussionChange: () => {},
    onGroupRemoved: () => {},
    onGroupChanged: () => {},
    onGroupCreate: () => {},
    onIdentityBulkRate: () => {},
    onWaveCreated: () => {},
    onWaveFollowChange: () => {},
    invalidateAll: () => {},
  });

export default function ReactQueryWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  const getHandlesFromProfile = (
    profile: IProfileAndConsolidations
  ): string[] => {
    const handles: string[] = [];
    if (profile.profile?.handle) {
      handles.push(profile.profile?.handle.toLowerCase());
    }

    profile.consolidation.wallets.forEach((wallet) => {
      if (wallet.wallet.ens) {
        handles.push(wallet.wallet.ens.toLowerCase());
      }
      handles.push(wallet.wallet.address.toLowerCase());
    });

    return handles;
  };

  const invalidateQueries = ({
    key,
    values,
  }: {
    key: QueryKey;
    values: (string | Record<string, any>)[];
  }) => {
    for (const value of values) {
      queryClient.invalidateQueries({
        queryKey: [key, value],
      });
    }
  };

  const invalidateProfile = (profile: IProfileAndConsolidations) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({ key: QueryKey.PROFILE, values: handles });
  };

  const invalidateLogs = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_LOGS],
    });
  };

  const setProfile = (profile: IProfileAndConsolidations) => {
    const handles = getHandlesFromProfile(profile);
    for (const handle of handles) {
      queryClient.setQueryData<IProfileAndConsolidations>(
        [QueryKey.PROFILE, handle],
        profile
      );
    }
  };

  const setProfileProxy = (profileProxy: ProfileProxy) => {
    queryClient.setQueryData<ProfileProxy>(
      [QueryKey.PROFILE_PROXY, { id: profileProxy.id }],
      profileProxy
    );
  };

  const onProfileProxyModify = ({
    profileProxyId,
    createdByHandle,
    grantedToHandle,
  }: {
    readonly profileProxyId: string;
    readonly createdByHandle: string;
    readonly grantedToHandle: string;
  }): void => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_PROXY, { id: profileProxyId }],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_PROFILE_PROXIES],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_PROFILE_PROXIES],
    });
  };

  const invalidateProfileRaterCICState = ({
    profile,
    rater,
  }: {
    profile: IProfileAndConsolidations;
    rater: string;
  }) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({
      key: QueryKey.PROFILE_RATER_CIC_STATE,
      values: handles.map((h) => ({
        handle: h,
        rater,
      })),
    });
  };

  const invalidateProfileCICStatements = (
    profile: IProfileAndConsolidations
  ) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({
      key: QueryKey.PROFILE_CIC_STATEMENTS,
      values: handles,
    });
  };

  const invalidateGroup = ({ groupId }: { readonly groupId: string }) => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.GROUPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.GROUP, groupId],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_LOGS, { groupId }],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.COMMUNITY_MEMBERS_TOP, { groupId }],
    });
  };

  const onGroupRemoved = ({ groupId }: { readonly groupId: string }) =>
    invalidateGroup({ groupId });

  const onGroupChanged = ({ groupId }: { readonly groupId: string }) =>
    invalidateGroup({ groupId });

  const onGroupCreate = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.GROUPS],
    });
  };

  const setRepRates = ({
    data,
    handleOrWallet,
  }: {
    data: UserPageRepPropsRepRates;
    handleOrWallet: string;
  }) => {
    const { ratings, rater } = data;
    const initialEmptyRepRates: ApiProfileRepRatesState = {
      total_rep_rating: ratings.total_rep_rating,
      number_of_raters: ratings.number_of_raters,
      total_rep_rating_by_rater: null,
      rep_rates_left_for_rater: null,
      rating_stats: ratings.rating_stats.map((rating) => ({
        category: rating.category,
        rating: rating.rating,
        contributor_count: rating.contributor_count,
        rater_contribution: 0,
      })),
    };
    queryClient.setQueryData(
      [
        QueryKey.PROFILE_REP_RATINGS,
        {
          handleOrWallet,
          rater: undefined,
        },
      ],
      initialEmptyRepRates
    );
    if (rater) {
      queryClient.setQueryData(
        [
          QueryKey.PROFILE_REP_RATINGS,
          {
            handleOrWallet: handleOrWallet,
            rater: rater.toLowerCase(),
          },
        ],
        ratings
      );
    }
  };

  const setProfileRaters = ({
    data,
    params,
  }: InitProfileRatersParamsAndData) => {
    const { page, pageSize, given, order, orderBy, handleOrWallet, matter } =
      params;

    queryClient.setQueryData(
      [
        QueryKey.PROFILE_RATERS,
        {
          handleOrWallet,
          matter,
          page: `${page}`,
          pageSize: `${pageSize}`,
          order,
          orderBy,
          given,
        },
      ],
      data
    );
  };

  const invalidateProfileRepRatings = (profile: IProfileAndConsolidations) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({
      key: QueryKey.PROFILE_REP_RATINGS,
      values: handles.map((h) => ({
        handleOrWallet: h,
      })),
    });
  };

  const invalidateProfileRaters = ({
    profile,
    matter,
    given,
  }: {
    profile: IProfileAndConsolidations;
    matter: RateMatter;
    given: boolean;
  }) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({
      key: QueryKey.PROFILE_RATERS,
      values: handles.map((h) => ({
        handleOrWallet: h,
        matter,
        given,
      })),
    });
  };

  const invalidateIdentityAvailableCredit = ({
    rater,
    rater_representative,
  }: {
    rater: string;
    rater_representative: string | null;
  }) => {
    queryClient.invalidateQueries({
      queryKey: [
        QueryKey.IDENTITY_AVAILABLE_CREDIT,
        {
          rater,
          rater_representative,
        },
      ],
    });
  };

  const onProfileCICModify = ({
    targetProfile,
    connectedProfile,
    rater,
    profileProxy,
  }: {
    readonly targetProfile: IProfileAndConsolidations;
    readonly connectedProfile: IProfileAndConsolidations | null;
    readonly rater: string | null;
    readonly profileProxy: ProfileProxy | null;
  }) => {
    invalidateProfile(targetProfile);
    invalidateLogs();
    invalidateProfileRaters({
      profile: targetProfile,
      matter: RateMatter.CIC,
      given: false,
    });

    if (connectedProfile) {
      invalidateProfileRaters({
        profile: connectedProfile,
        matter: RateMatter.CIC,
        given: true,
      });
    }
    if (rater) {
      invalidateProfileRaterCICState({
        profile: targetProfile,
        rater: rater.toLowerCase(),
      });
    }
    if (profileProxy) {
      invalidateQueries({
        key: QueryKey.PROFILE,
        values: [
          profileProxy.created_by.handle,
          profileProxy.granted_to.handle,
        ],
      });
      invalidateQueries({
        key: QueryKey.PROFILE_RATERS,
        values: [
          {
            handleOrWallet: profileProxy.created_by.handle,
            matter: RateMatter.CIC,
            given: false,
          },
          {
            handleOrWallet: profileProxy.granted_to.handle,
            matter: RateMatter.CIC,
            given: false,
          },
        ],
      });
      invalidateQueries({
        key: QueryKey.PROFILE_PROFILE_PROXIES,
        values: [
          {
            handleOrWallet: profileProxy.created_by.handle,
          },
          {
            handleOrWallet: profileProxy.granted_to.handle,
          },
        ],
      });
    }
    const raterTarget =
      profileProxy?.created_by.handle ??
      connectedProfile?.profile?.handle ??
      null;
    const raterRepresentative = profileProxy
      ? connectedProfile?.profile?.handle ?? null
      : null;

    if (raterTarget) {
      invalidateIdentityAvailableCredit({
        rater: raterTarget,
        rater_representative: raterRepresentative,
      });
    }
  };

  const onProfileRepModify = ({
    targetProfile,
    connectedProfile,
    profileProxy,
  }: {
    readonly targetProfile: IProfileAndConsolidations;
    readonly connectedProfile: IProfileAndConsolidations | null;
    readonly profileProxy: ProfileProxy | null;
  }) => {
    invalidateProfile(targetProfile);
    invalidateProfileRepRatings(targetProfile);
    invalidateLogs();
    invalidateProfileRaters({
      profile: targetProfile,
      matter: RateMatter.REP,
      given: false,
    });

    if (connectedProfile) {
      invalidateProfileRaters({
        profile: connectedProfile,
        matter: RateMatter.REP,
        given: true,
      });
      invalidateQueries({
        key: QueryKey.PROFILE_REP_RATINGS,
        values: [
          {
            rater: connectedProfile.profile?.handle,
            handleOrWallet: targetProfile.profile?.handle,
          },
        ],
      });
    }

    if (profileProxy) {
      invalidateQueries({
        key: QueryKey.PROFILE,
        values: [
          profileProxy.created_by.handle,
          profileProxy.granted_to.handle,
        ],
      });
      invalidateQueries({
        key: QueryKey.PROFILE_RATERS,
        values: [
          {
            handleOrWallet: profileProxy.created_by.handle,
            matter: RateMatter.REP,
            given: false,
          },
          {
            handleOrWallet: profileProxy.granted_to.handle,
            matter: RateMatter.REP,
            given: false,
          },
        ],
      });
      invalidateQueries({
        key: QueryKey.PROFILE_REP_RATINGS,
        values: [
          {
            rater: profileProxy.created_by.handle,
            handleOrWallet: targetProfile.profile?.handle,
          },
          {
            rater: profileProxy.granted_to.handle,
            handleOrWallet: targetProfile.profile?.handle,
          },
        ],
      });
      invalidateQueries({
        key: QueryKey.PROFILE_PROFILE_PROXIES,
        values: [
          {
            handleOrWallet: profileProxy.created_by.handle,
          },
          {
            handleOrWallet: profileProxy.granted_to.handle,
          },
        ],
      });
    }

    const raterTarget =
      profileProxy?.created_by.handle ??
      connectedProfile?.profile?.handle ??
      null;
    const raterRepresentative = profileProxy
      ? connectedProfile?.profile?.handle ?? null
      : null;

    if (raterTarget) {
      invalidateIdentityAvailableCredit({
        rater: raterTarget,
        rater_representative: raterRepresentative,
      });
    }
  };

  const onProfileEdit = ({
    profile,
    previousProfile,
  }: {
    readonly profile: IProfileAndConsolidations;
    readonly previousProfile: IProfileAndConsolidations | null;
  }) => {
    setProfile(profile);
    invalidateLogs();

    if (previousProfile) {
      invalidateProfile(previousProfile);
    }
  };

  const onProfileStatementAdd = ({
    profile,
  }: {
    profile: IProfileAndConsolidations;
  }) => {
    invalidateProfileCICStatements(profile);
    invalidateLogs();
  };

  const onProfileStatementRemove = ({
    profile,
  }: {
    profile: IProfileAndConsolidations;
  }) => {
    invalidateProfileCICStatements(profile);
    invalidateLogs();
  };

  const initProfileActivityLogs = ({
    params,
    disableActiveGroup,
    data,
  }: {
    readonly params: ActivityLogParams;
    readonly disableActiveGroup: boolean;
    readonly data: CountlessPage<ProfileActivityLog>;
  }) => {
    queryClient.setQueryData(
      [
        QueryKey.PROFILE_LOGS,
        convertActivityLogParams({ params, disableActiveGroup }),
      ],
      data
    );
  };

  const initProfileRepPage = ({
    profile,
    repRates,
    repLogs,
    repGivenToUsers,
    repReceivedFromUsers,
    handleOrWallet,
  }: InitProfileRepPageParams) => {
    setProfile(profile);
    setRepRates({ data: repRates, handleOrWallet });
    initProfileActivityLogs({
      params: repLogs.params,
      data: repLogs.data,
      disableActiveGroup: true,
    });
    setProfileRaters(repGivenToUsers);
    setProfileRaters(repReceivedFromUsers);
  };

  const initProfileIdentityPage = ({
    profile,
    activityLogs,
    cicGivenToUsers,
    cicReceivedFromUsers,
  }: InitProfileIdentityPageParams) => {
    setProfile(profile);
    initProfileActivityLogs({
      params: activityLogs.params,
      data: activityLogs.data,
      disableActiveGroup: true,
    });
    setProfileRaters(cicGivenToUsers);
    setProfileRaters(cicReceivedFromUsers);
  };

  const initLandingPage = ({
    activityLogs,
  }: {
    activityLogs: InitProfileActivityLogsParams;
  }) => {
    initProfileActivityLogs({
      params: activityLogs.params,
      data: activityLogs.data,
      disableActiveGroup: true,
    });
  };

  const initCommunityActivityPage = ({
    activityLogs,
  }: {
    activityLogs: InitProfileActivityLogsParams;
  }) => {
    initProfileActivityLogs({
      params: activityLogs.params,
      data: activityLogs.data,
      disableActiveGroup: false,
    });
  };

  const onDropCreate = ({
    profile,
  }: {
    profile: IProfileAndConsolidations;
  }) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({
      key: QueryKey.PROFILE_DROPS,
      values: handles.map((handle) => ({ handleOrWallet: handle })),
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.FEED_ITEMS],
    });
  };

  const dropChangeMutation = ({
    oldData,
    drop,
  }: {
    oldData:
      | {
          pages: Drop[][];
        }
      | undefined;
    drop: Drop;
  }) => {
    if (!oldData) {
      return oldData;
    }
    return {
      ...oldData,
      pages: oldData.pages.map((page) => {
        return page.map((d) => {
          if (d.id === drop.id) {
            return drop;
          }
          return d;
        });
      }),
    };
  };

  const onDropChange = ({
    drop,
    giverHandle,
  }: {
    readonly drop: Drop;
    readonly giverHandle: string | null;
  }) => {
    queryClient.setQueryData(
      [
        QueryKey.PROFILE_DROPS,
        {
          handleOrWallet: drop.author.handle.toLowerCase(),
          context_profile: giverHandle,
        },
      ],
      (
        oldData:
          | {
              pages: Drop[][];
            }
          | undefined
      ) => dropChangeMutation({ oldData, drop })
    );
    queryClient.setQueriesData(
      {
        queryKey: [QueryKey.DROPS],
      },
      (
        oldData:
          | {
              pages: Drop[][];
            }
          | undefined
      ) => dropChangeMutation({ oldData, drop })
    );
    if (giverHandle) {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.PROFILE_AVAILABLE_DROP_RATE, giverHandle],
      });
    }
    invalidateQueries({
      key: QueryKey.DROP_DISCUSSION,
      values: [{ drop_id: drop.id }],
    });

    invalidateQueries({
      key: QueryKey.WAVE,
      values: [{ wave_id: drop.wave.id }],
    });
    invalidateQueries({
      key: QueryKey.DROP,
      values: [{ drop_id: drop.id }],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.FEED_ITEMS],
    });
  };

  const onRedrop = ({ reDropId }: { readonly reDropId: string }) => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP, { drop_id: reDropId }],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.FEED_ITEMS],
    });
  };

  const onDropDiscussionChange = ({
    dropId,
    dropAuthorHandle,
  }: {
    readonly dropId: string;
    dropAuthorHandle: string;
  }) => {
    invalidateQueries({
      key: QueryKey.DROP_DISCUSSION,
      values: [{ drop_id: dropId }],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP, { drop_id: dropId }],
    });
    queryClient.invalidateQueries({
      queryKey: [
        QueryKey.PROFILE_DROPS,
        {
          handleOrWallet: dropAuthorHandle.toLowerCase(),
        },
      ],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.FEED_ITEMS],
    });
  };

  const onIdentityBulkRate = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_LOGS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_RATERS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_RATER_CIC_STATE],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_AVAILABLE_CREDIT],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_PROFILE_PROXIES],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_PROXY],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_REP_RATINGS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.COMMUNITY_MEMBERS_TOP],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.GROUP],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.GROUPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_PROFILE_PROXIES],
    });
  };

  const invalidateAllWaves = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES_OVERVIEW],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES_OVERVIEW_PUBLIC],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVES_PUBLIC],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.WAVE],
    });
  };

  const invalidateDrops = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.FEED_ITEMS],
    });
  };

  const onWaveCreated = () => invalidateAllWaves();

  const onWaveFollowChange = () => invalidateAllWaves();
  const onIdentityFollowChange = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_FOLLOWERS],
    });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  const value = useMemo(
    () => ({
      setProfile,
      setProfileProxy,
      onProfileProxyModify,
      onProfileCICModify,
      onProfileRepModify,
      onProfileEdit,
      onProfileStatementAdd,
      onProfileStatementRemove,
      initProfileRepPage,
      initProfileIdentityPage,
      initLandingPage,
      initCommunityActivityPage,
      onGroupRemoved,
      onGroupChanged,
      onDropCreate,
      onRedrop,
      onDropChange,
      onDropDiscussionChange,
      onIdentityBulkRate,
      onGroupCreate,
      onWaveCreated,
      onWaveFollowChange,
      invalidateAll,
      onIdentityFollowChange,
      invalidateDrops,
    }),
    [
      setProfile,
      setProfileProxy,
      onProfileProxyModify,
      onProfileCICModify,
      onProfileRepModify,
      onProfileEdit,
      onProfileStatementAdd,
      onProfileStatementRemove,
      initProfileRepPage,
      initProfileIdentityPage,
      initLandingPage,
      initCommunityActivityPage,
      onGroupRemoved,
      onGroupChanged,
      onDropCreate,
      onRedrop,
      onDropChange,
      onDropDiscussionChange,
      onIdentityBulkRate,
      onGroupCreate,
      onWaveCreated,
      onWaveFollowChange,
      invalidateAll,
      onIdentityFollowChange,
      invalidateDrops,
    ]
  );

  return (
    <ReactQueryWrapperContext.Provider value={value}>
      {children}
    </ReactQueryWrapperContext.Provider>
  );
}
