"use client";

import { UserPageRepPropsRepRates } from "@/app/[user]/rep/page";
import {
  ApiProfileRepRatesState,
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import { RateMatter } from "@/enums";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiFeedItemType } from "@/generated/models/ApiFeedItemType";
import { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { wait } from "@/helpers/Helpers";
import { convertActivityLogParams } from "@/helpers/profile-logs.helpers";
import { Time } from "@/helpers/time";
import { CountlessPage, Page } from "@/helpers/Types";
import { useQueryKeyListener } from "@/hooks/useQueryKeyListener";
import { TypedFeedItem } from "@/types/feed.types";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { createContext, useMemo } from "react";
import { ActivityLogParams } from "../profile-activity/ProfileActivityLogs";
import { ProfileRatersParams } from "../user/utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { addDropToDrops } from "./utils/addDropsToDrops";
import { increaseWavesOverviewDropsCount } from "./utils/increaseWavesOverviewDropsCount";
import {
  WAVE_DROPS_PARAMS,
  WAVE_FOLLOWING_WAVES_PARAMS,
} from "./utils/query-utils";
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
  IDENTITY_SEARCH = "IDENTITY_SEARCH",
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
  DROPS_LEADERBOARD = "DROPS_LEADERBOARD",
  DROP = "DROP",
  DROP_DISCUSSION = "DROP_DISCUSSION",
  GROUPS = "GROUPS",
  GROUPS_INFINITE = "GROUPS_INFINITE",
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
  WAVE_LOGS = "WAVE_LOGS",
  WAVE_VOTERS = "WAVE_VOTERS",
  WAVE_FOLLOWERS = "WAVE_FOLLOWERS",
  FOLLOWING_WAVES = "FOLLOWING_WAVES",
  FEED_ITEMS = "FEED_ITEMS",
  WAVE_DECISIONS = "WAVE_DECISIONS",
}

interface InitProfileRatersParamsAndData {
  readonly data: Page<RatingWithProfileInfoAndLevel>;
  readonly params: ProfileRatersParams;
}

interface InitProfileActivityLogsParams {
  readonly params: ActivityLogParams;
  readonly data: CountlessPage<ProfileActivityLog>;
}

interface InitProfileRepPageParams {
  readonly profile: ApiIdentity;
  readonly repRates: UserPageRepPropsRepRates;
  readonly repLogs: InitProfileActivityLogsParams;
  readonly repGivenToUsers: InitProfileRatersParamsAndData;
  readonly repReceivedFromUsers: InitProfileRatersParamsAndData;
  readonly handleOrWallet: string;
}

interface InitProfileIdentityPageParams {
  readonly profile: ApiIdentity;
  readonly activityLogs: InitProfileActivityLogsParams;
  readonly cicGivenToUsers: InitProfileRatersParamsAndData;
  readonly cicReceivedFromUsers: InitProfileRatersParamsAndData;
}

type ReactQueryWrapperContextType = {
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
    createdByHandle,
    grantedToHandle,
  }: {
    readonly profileProxyId: string;
    readonly createdByHandle: string;
    readonly grantedToHandle: string;
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
  initProfileIdentityPage: (params: InitProfileIdentityPageParams) => void;
  initCommunityActivityPage: ({
    activityLogs,
  }: {
    activityLogs: InitProfileActivityLogsParams;
  }) => void;
  waitAndInvalidateDrops: () => void;
  addOptimisticDrop: (params: { readonly drop: ApiDrop }) => void;
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
    initCommunityActivityPage: () => {},
    waitAndInvalidateDrops: () => {},
    addOptimisticDrop: () => {},
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

  const getHandlesFromProfile = (profile: ApiIdentity): string[] => {
    const handles: string[] = [];
    if (profile.handle) {
      handles.push(profile.handle.toLowerCase());
    }

    profile.wallets?.forEach((wallet) => {
      if (wallet.display) {
        handles.push(wallet.display.toLowerCase());
      }
      handles.push(wallet.wallet.toLowerCase());
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

  const invalidateProfile = (profile: ApiIdentity) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({ key: QueryKey.PROFILE, values: handles });
  };

  const invalidateLogs = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_LOGS],
    });
  };

  const setProfile = (profile: ApiIdentity) => {
    const handles = getHandlesFromProfile(profile);
    for (const handle of handles) {
      queryClient.setQueryData<ApiIdentity>(
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
    profile: ApiIdentity;
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

  const invalidateProfileCICStatements = (profile: ApiIdentity) => {
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

  const invalidateProfileRepRatings = (profile: ApiIdentity) => {
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
    profile: ApiIdentity;
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
    readonly targetProfile: ApiIdentity;
    readonly connectedProfile: ApiIdentity | null;
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
    if (profileProxy?.created_by?.handle && profileProxy.granted_to?.handle) {
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
            handleOrWallet: profileProxy.created_by?.handle,
            matter: RateMatter.NIC,
            given: false,
          },
          {
            handleOrWallet: profileProxy.granted_to?.handle,
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
      profileProxy?.created_by.handle ?? connectedProfile?.handle ?? null;
    const raterRepresentative = profileProxy
      ? connectedProfile?.handle ?? null
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
    readonly targetProfile: ApiIdentity;
    readonly connectedProfile: ApiIdentity | null;
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
            rater: connectedProfile.handle,
            handleOrWallet: targetProfile.handle,
          },
        ],
      });
    }

    if (profileProxy?.created_by?.handle && profileProxy.granted_to?.handle) {
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
            handleOrWallet: targetProfile.handle,
          },
          {
            rater: profileProxy.granted_to.handle,
            handleOrWallet: targetProfile.handle,
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
      profileProxy?.created_by.handle ?? connectedProfile?.handle ?? null;
    const raterRepresentative = profileProxy
      ? connectedProfile?.handle ?? null
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
    readonly profile: ApiIdentity;
    readonly previousProfile: ApiIdentity | null;
  }) => {
    setProfile(profile);
    invalidateLogs();

    if (previousProfile) {
      invalidateProfile(previousProfile);
    }
  };

  const onProfileStatementAdd = ({ profile }: { profile: ApiIdentity }) => {
    invalidateProfileCICStatements(profile);
    invalidateLogs();
  };

  const onProfileStatementRemove = ({ profile }: { profile: ApiIdentity }) => {
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

                  return part;
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

                  return part;
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
                return part;
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

                  return part;
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

                  return part;
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
      queryKey: [QueryKey.DROPS_LEADERBOARD],
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
    queryClient.invalidateQueries({
      queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
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

  useQueryKeyListener([QueryKey.FEED_ITEMS], () => {
    Cookies.set([QueryKey.FEED_ITEMS].toString(), `${Time.now().toMillis()}`);
  });

  useQueryKeyListener([QueryKey.FEED_ITEMS], () => {
    Cookies.set(
      [QueryKey.IDENTITY_NOTIFICATIONS].toString(),
      `${Time.now().toMillis()}`
    );
  });

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
      initCommunityActivityPage,
      onGroupRemoved,
      onGroupChanged,
      waitAndInvalidateDrops,
      addOptimisticDrop,
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
      initCommunityActivityPage,
      onGroupRemoved,
      onGroupChanged,
      waitAndInvalidateDrops,
      addOptimisticDrop,
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
