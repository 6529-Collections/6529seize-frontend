import { createContext, useMemo } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
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
import { ApiDrop } from "../../generated/models/ApiDrop";
import { ApiProfileProxy } from "../../generated/models/ApiProfileProxy";
import { wait } from "../../helpers/Helpers";
import { IFeedItemDropCreated, TypedFeedItem } from "../../types/feed.types";
import { ApiFeedItemType } from "../../generated/models/ApiFeedItemType";
import { ApiWaveDropsFeed } from "../../generated/models/ApiWaveDropsFeed";
import { addDropToDrops } from "./utils/addDropsToDrops";
import { ApiWave } from "../../generated/models/ApiWave";
import {
  WAVE_DROPS_PARAMS,
  WAVE_FOLLOWING_WAVES_PARAMS,
} from "./utils/query-utils";
import { increaseWavesOverviewDropsCount } from "./utils/increaseWavesOverviewDropsCount";
import { toggleWaveFollowing } from "./utils/toggleWaveFollowing";

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
  IDENTITY_AVAILABLE_CREDIT = "IDENTITY_AVAILABLE_CREDIT",
  IDENTITY_FOLLOWING_ACTIONS = "IDENTITY_FOLLOWING_ACTIONS",
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
  NFTS = "NFTS",
  PROFILE_PROXY = "PROFILE_PROXY",
  PROFILE_PROFILE_PROXIES = "PROFILE_PROFILE_PROXIES",
  EMMA_IDENTITY_ALLOWLISTS = "EMMA_IDENTITY_ALLOWLISTS",
  EMMA_ALLOWLIST_RESULT = "EMMA_ALLOWLIST_RESULT",
  WAVES_OVERVIEW = "WAVES_OVERVIEW",
  WAVES_OVERVIEW_PUBLIC = "WAVES_OVERVIEW_PUBLIC",
  WAVES = "WAVES",
  WAVES_PUBLIC = "WAVES_PUBLIC",
  WAVE = "WAVE",
  WAVE_FOLLOWERS = "WAVE_FOLLOWERS",
  FOLLOWING_WAVES = "FOLLOWING_WAVES",
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
  readonly setWave: (wave: ApiWave) => void;
  readonly setWavesOverviewPage: (wavesOverview: ApiWave[]) => void;
  readonly setWaveDrops: (params: {
    readonly waveDrops: ApiWaveDropsFeed;
    readonly waveId: string;
  }) => void;
  readonly setProfileProxy: (profileProxy: ApiProfileProxy) => void;
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
    readonly profileProxy: ApiProfileProxy | null;
  }) => void;
  onProfileRepModify: ({
    targetProfile,
    connectedProfile,
    profileProxy,
  }: {
    readonly targetProfile: IProfileAndConsolidations;
    readonly connectedProfile: IProfileAndConsolidations | null;
    readonly profileProxy: ApiProfileProxy | null;
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
  waitAndInvalidateDrops: () => void;
  addOptimisticDrop: (params: { readonly drop: ApiDrop }) => void;
  onDropChange: (params: {
    readonly drop: ApiDrop;
    readonly giverHandle: string | null;
  }) => void;
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
  invalidateNotifications: () => void;
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
    initProfileIdentityPage: () => {},
    initLandingPage: () => {},
    initCommunityActivityPage: () => {},
    waitAndInvalidateDrops: () => {},
    addOptimisticDrop: () => {},
    onDropChange: () => {},
    invalidateDrops: () => {},
    onGroupRemoved: () => {},
    onGroupChanged: () => {},
    onGroupCreate: () => {},
    onIdentityBulkRate: () => {},
    onWaveCreated: () => {},
    onWaveFollowChange: () => {},
    invalidateAll: () => {},
    invalidateNotifications: () => {},
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

  const setWave = (wave: ApiWave) => {
    queryClient.setQueryData<ApiWave>(
      [QueryKey.WAVE, { wave_id: wave.id }],
      wave
    );
  };

  const setWavesOverviewPage = (wavesOverview: ApiWave[]) => {
    const queryKey = [
      QueryKey.WAVES_OVERVIEW,
      {
        limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
        type: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
        only_waves_followed_by_authenticated_user:
          WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
      },
    ];

    // Check if there's existing data
    const existingData = queryClient.getQueryData(queryKey);
    if (existingData) {
      return;
    } else {
      // If there's no existing data, set the initial data
      queryClient.setQueryData<InfiniteData<ApiWave[]>>(queryKey, {
        pages: [wavesOverview],
        pageParams: [undefined],
      });
    }
  };

  const setWaveDrops = ({
    waveDrops,
    waveId,
  }: {
    readonly waveDrops: ApiWaveDropsFeed;
    readonly waveId: string;
  }) => {
    const queryKey = [
      QueryKey.DROPS,
      {
        waveId,
        limit: WAVE_DROPS_PARAMS.limit,
        dropId: null,
      },
    ];

    // Check if there's existing data
    const existingData = queryClient.getQueryData(queryKey);
    if (existingData) {
      return;
    } else {
      // If there's no existing data, set the initial data
      queryClient.setQueryData<InfiniteData<ApiWaveDropsFeed>>(queryKey, {
        pages: [waveDrops],
        pageParams: [undefined],
      });
    }
  };

  const setProfileProxy = (profileProxy: ApiProfileProxy) => {
    queryClient.setQueryData<ApiProfileProxy>(
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
    readonly profileProxy: ApiProfileProxy | null;
  }) => {
    invalidateProfile(targetProfile);
    invalidateLogs();
    invalidateProfileRaters({
      profile: targetProfile,
      matter: RateMatter.NIC,
      given: false,
    });

    if (connectedProfile) {
      invalidateProfileRaters({
        profile: connectedProfile,
        matter: RateMatter.NIC,
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
            matter: RateMatter.NIC,
            given: false,
          },
          {
            handleOrWallet: profileProxy.granted_to.handle,
            matter: RateMatter.NIC,
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
    readonly profileProxy: ApiProfileProxy | null;
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

  const addDropToFeedItems = ({ drop }: { readonly drop: ApiDrop }): void => {
    queryClient.setQueryData(
      [QueryKey.FEED_ITEMS],
      (
        oldData:
          | {
              pages: TypedFeedItem[][];
            }
          | undefined
      ) => {
        if (!oldData?.pages.length) {
          return oldData;
        }
        const pages = JSON.parse(JSON.stringify(oldData.pages));
        const feedItem: IFeedItemDropCreated = {
          serial_no: Math.floor(Math.random() * (1000000 - 100000) + 100000),
          item: drop,
          type: ApiFeedItemType.DropCreated,
        };
        pages.at(0)?.unshift(feedItem);
        return {
          ...oldData,
          pages,
        };
      }
    );
  };

  const increaseFeedItemsDropRedropCount = ({
    drop,
  }: {
    readonly drop: ApiDrop;
  }): void => {
    queryClient.setQueryData(
      [QueryKey.FEED_ITEMS],
      (
        oldData:
          | {
              pages: TypedFeedItem[][];
            }
          | undefined
      ) => {
        if (!oldData?.pages.length) {
          return oldData;
        }
        const pages: TypedFeedItem[][] = JSON.parse(
          JSON.stringify(oldData.pages)
        );
        const quotedDrops = drop.parts
          .map((part) => part.quoted_drop)
          .filter((quotedDrop) => !!quotedDrop);
        if (quotedDrops.length) {
          const modifiedPages = pages.map((items) => {
            const modifiedItems = items.map((item) => {
              if (item.type === ApiFeedItemType.DropCreated) {
                const modifiedParts = item.item.parts.map((part) => {
                  const isQuoted = quotedDrops.find(
                    (qd) =>
                      qd &&
                      item.item.id === qd.drop_id &&
                      part.part_id === qd.drop_part_id
                  );
                  if (isQuoted) {
                    return {
                      ...part,
                      quotes_count: part.quotes_count + 1,
                      context_profile_context: {
                        replies_count:
                          part.context_profile_context?.replies_count ?? 0,
                        quotes_count:
                          (part.context_profile_context?.quotes_count ?? 0) + 1,
                      },
                    };
                  } else {
                    return part;
                  }
                });
                return {
                  ...item,
                  item: {
                    ...item.item,
                    parts: modifiedParts,
                  },
                };
              }
              if (item.type === ApiFeedItemType.DropReplied) {
                const modifiedParts = item.item.reply.parts.map((part) => {
                  const isQuoted = quotedDrops.find(
                    (qd) =>
                      qd &&
                      item.item.reply.id === qd.drop_id &&
                      part.part_id === qd.drop_part_id
                  );

                  if (isQuoted) {
                    return {
                      ...part,
                      quotes_count: part.quotes_count + 1,
                      context_profile_context: {
                        replies_count:
                          part.context_profile_context?.replies_count ?? 0,
                        quotes_count:
                          (part.context_profile_context?.quotes_count ?? 0) + 1,
                      },
                    };
                  } else {
                    return part;
                  }
                });
                return {
                  ...item,
                  item: {
                    ...item.item,
                    reply: {
                      ...item.item.reply,
                      parts: modifiedParts,
                    },
                  },
                };
              }
              return item;
            });
            return modifiedItems;
          });
          return {
            ...oldData,
            pages: modifiedPages,
          };
        }
        return {
          ...oldData,
          pages,
        };
      }
    );
  };

  const increaseDropsDropRedropCount = ({
    drop,
  }: {
    readonly drop: ApiDrop;
  }): void => {
    queryClient.setQueryData(
      [
        QueryKey.DROPS,
        {
          limit: `10`,
          context_profile: drop.author.handle,
          wave_id: drop.wave.id,
          include_replies: "true",
        },
      ],
      (
        oldData:
          | {
              pages: ApiDrop[][];
            }
          | undefined
      ) => {
        if (!oldData?.pages.length) {
          return oldData;
        }
        const pages: ApiDrop[][] = JSON.parse(JSON.stringify(oldData.pages));
        const quotedDrops = drop.parts
          .map((part) => part.quoted_drop)
          .filter((quotedDrop) => !!quotedDrop);
        if (quotedDrops.length) {
          const modifiedPages = pages.map((items) => {
            const modifiedItems = items.map((item) => {
              const modifiedParts = item.parts.map((part) => {
                const isQuoted = quotedDrops.find(
                  (qd) =>
                    qd &&
                    item.id === qd.drop_id &&
                    part.part_id === qd.drop_part_id
                );
                if (isQuoted) {
                  return {
                    ...part,
                    quotes_count: part.quotes_count + 1,
                    context_profile_context: {
                      replies_count:
                        part.context_profile_context?.replies_count ?? 0,
                      quotes_count:
                        (part.context_profile_context?.quotes_count ?? 0) + 1,
                    },
                  };
                } else {
                  return part;
                }
              });

              return {
                ...item,
                parts: modifiedParts,
              };
            });
            return modifiedItems;
          });
          return {
            ...oldData,
            pages: modifiedPages,
          };
        }
        return {
          ...oldData,
          pages,
        };
      }
    );
  };

  const addReplyToDropDiscussion = ({
    drop,
  }: {
    readonly drop: ApiDrop;
  }): void => {
    queryClient.setQueryData(
      [
        QueryKey.DROP_DISCUSSION,
        {
          drop_id: drop.reply_to?.drop_id,
          drop_part_id: drop.reply_to?.drop_part_id,
          sort_direction: "ASC",
        },
      ],
      (
        oldData: { pages: Page<ApiDrop>[]; pageParams: number[] } | undefined
      ): { pages: Page<ApiDrop>[]; pageParams: number[] } => {
        if (!oldData?.pages.length) {
          return {
            pageParams: [1],
            pages: [
              {
                count: 1,
                page: 1,
                next: false,
                data: [drop],
              },
            ],
          };
        }

        const pages: Page<ApiDrop>[] = JSON.parse(
          JSON.stringify(oldData.pages)
        );
        pages.at(-1)?.data.push(drop);

        return {
          ...oldData,
          pages,
        };
      }
    );
  };

  const increaseFeedItemsDropDiscussionCount = ({
    drop,
  }: {
    readonly drop: ApiDrop;
  }): void => {
    queryClient.setQueryData(
      [QueryKey.FEED_ITEMS],
      (
        oldData:
          | {
              pages: TypedFeedItem[][];
            }
          | undefined
      ) => {
        if (!oldData?.pages.length) {
          return oldData;
        }
        const pages: TypedFeedItem[][] = JSON.parse(
          JSON.stringify(oldData.pages)
        );
        const repliedDrop = drop.reply_to;
        if (repliedDrop) {
          const modifiedPages = pages.map((items) => {
            const modifiedItems = items.map((item) => {
              if (item.type === ApiFeedItemType.DropCreated) {
                const modifiedParts = item.item.parts.map((part) => {
                  const isReplied =
                    item.item.id === repliedDrop.drop_id &&
                    part.part_id === repliedDrop.drop_part_id;
                  if (isReplied) {
                    return {
                      ...part,
                      replies_count: part.replies_count + 1,
                      context_profile_context: {
                        replies_count:
                          (part.context_profile_context?.replies_count ?? 0) +
                          1,
                        quotes_count:
                          part.context_profile_context?.quotes_count ?? 0,
                      },
                    };
                  } else {
                    return part;
                  }
                });
                return {
                  ...item,
                  item: {
                    ...item.item,
                    parts: modifiedParts,
                  },
                };
              }
              if (item.type === ApiFeedItemType.DropReplied) {
                const modifiedParts = item.item.reply.parts.map((part) => {
                  const isReplied =
                    item.item.reply.id === repliedDrop.drop_id &&
                    part.part_id === repliedDrop.drop_part_id;

                  if (isReplied) {
                    return {
                      ...part,
                      replies_count: part.replies_count + 1,
                      context_profile_context: {
                        replies_count:
                          (part.context_profile_context?.replies_count ?? 0) +
                          1,
                        quotes_count:
                          part.context_profile_context?.quotes_count ?? 0,
                      },
                    };
                  } else {
                    return part;
                  }
                });
                return {
                  ...item,
                  item: {
                    ...item.item,
                    reply: {
                      ...item.item.reply,
                      parts: modifiedParts,
                    },
                  },
                };
              }
              return item;
            });
            return modifiedItems;
          });
          return {
            ...oldData,
            pages: modifiedPages,
          };
        }
        return {
          ...oldData,
          pages,
        };
      }
    );
  };

  const addOptimisticDrop = async ({
    drop,
  }: {
    readonly drop: ApiDrop;
  }): Promise<void> => {
    addDropToDrops(queryClient, { drop });
    increaseWavesOverviewDropsCount(queryClient, drop.wave.id);
    increaseFeedItemsDropRedropCount({ drop });
    increaseDropsDropRedropCount({ drop });
    if (drop.reply_to) {
      addReplyToDropDiscussion({ drop });
      increaseFeedItemsDropDiscussionCount({ drop });
    }
  };

  const waitAndInvalidateDrops = async (): Promise<void> => {
    await wait(500);
    invalidateDrops();
  };

  const profileDropChangeMutation = ({
    oldData,
    drop,
  }: {
    oldData:
      | {
          pages: ApiDrop[][];
        }
      | undefined;
    drop: ApiDrop;
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

  const dropsDropChangeMutation = ({
    oldData,
    drop,
  }: {
    oldData:
      | {
          pages: ApiWaveDropsFeed[];
        }
      | ApiWaveDropsFeed
      | undefined;
    drop: ApiDrop;
  }) => {
    if (!oldData) {
      return oldData;
    }

    // Handle infinite query data structure
    if ("pages" in oldData) {
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          drops: page.drops.map((d) => (d.id === drop.id ? drop : d)),
        })),
      };
    }

    // Handle regular query data structure
    return {
      ...oldData,
      drops: oldData.drops.map((d) => (d.id === drop.id ? drop : d)),
    };
  };

  const onDropChange = ({
    drop,
    giverHandle,
  }: {
    readonly drop: ApiDrop;
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
              pages: ApiDrop[][];
            }
          | undefined
      ) => profileDropChangeMutation({ oldData, drop })
    );
    queryClient.setQueriesData(
      {
        queryKey: [QueryKey.DROPS],
      },
      (oldData: any) => dropsDropChangeMutation({ oldData, drop })
    );
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
      queryKey: [QueryKey.DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.FEED_ITEMS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
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
    queryClient.invalidateQueries({
      queryKey: [QueryKey.DROP_DISCUSSION],
    });
  };

  const onWaveCreated = () => invalidateAllWaves();

  const onWaveFollowChange = ({
    waveId,
    following,
  }: {
    readonly waveId: string;
    readonly following: boolean;
  }) => {
    toggleWaveFollowing({ waveId, following, queryClient });
    setTimeout(() => {
      invalidateAllWaves();
    }, 1000);
  };
  const onIdentityFollowChange = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_FOLLOWING_ACTIONS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_FOLLOWERS],
    });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
    });
  };

  const value = useMemo(
    () => ({
      setProfile,
      setWave,
      setWavesOverviewPage,
      setWaveDrops,
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
      waitAndInvalidateDrops,
      addOptimisticDrop,
      onDropChange,
      onIdentityBulkRate,
      onGroupCreate,
      onWaveCreated,
      onWaveFollowChange,
      invalidateAll,
      onIdentityFollowChange,
      invalidateDrops,
      invalidateNotifications,
    }),
    [
      setProfile,
      setWave,
      setWavesOverviewPage,
      setWaveDrops,
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
      waitAndInvalidateDrops,
      addOptimisticDrop,
      onDropChange,
      onIdentityBulkRate,
      onGroupCreate,
      onWaveCreated,
      onWaveFollowChange,
      invalidateAll,
      onIdentityFollowChange,
      invalidateDrops,
      invalidateNotifications,
    ]
  );

  return (
    <ReactQueryWrapperContext.Provider value={value}>
      {children}
    </ReactQueryWrapperContext.Provider>
  );
}
