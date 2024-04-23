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
import { Page } from "../../helpers/Types";
import {
  ActivityLogParams,
  convertActivityLogParams,
} from "../profile-activity/ProfileActivityLogs";
import { ProfileRatersParams } from "../user/utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { Drop } from "../../entities/IDrop";

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
  COMMUNITY_DROPS = "COMMUNITY_DROPS",
  CURATION_FILTERS = "CURATION_FILTERS",
  CURATION_FILTER = "CURATION_FILTER",
  RESERVOIR_NFT = "RESERVOIR_NFT",
  DROP = "DROP",
  DROP_DISCUSSION = "DROP_DISCUSSION",
  NFTS_SEARCH = "NFTS_SEARCH",
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
  readonly data: Page<ProfileActivityLog>;
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
  setProfile: (profile: IProfileAndConsolidations) => void;
  onProfileCICModify: (params: {
    readonly targetProfile: IProfileAndConsolidations;
    readonly connectedProfile: IProfileAndConsolidations | null;
    readonly rater: string | null;
  }) => void;
  onProfileRepModify: ({
    targetProfile,
    connectedProfile,
  }: {
    readonly targetProfile: IProfileAndConsolidations;
    readonly connectedProfile: IProfileAndConsolidations | null;
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
  onCurationFilterRemoved: ({
    filterId,
  }: {
    readonly filterId: string;
  }) => void;
  onCurationFilterChanged: ({
    filterId,
  }: {
    readonly filterId: string;
  }) => void;
  onDropCreate: (params: { profile: IProfileAndConsolidations }) => void;
  onDropChange: (params: {
    readonly drop: Drop;
    readonly giverHandle: string | null;
  }) => void;
  onDropDiscussionChange: (params: {
    readonly dropId: string;
    readonly dropAuthorHandle: string;
  }) => void;
};

export const ReactQueryWrapperContext =
  createContext<ReactQueryWrapperContextType>({
    setProfile: () => {},
    onProfileCICModify: () => {},
    onProfileRepModify: () => {},
    onProfileEdit: () => {},
    onProfileStatementAdd: () => {},
    onProfileStatementRemove: () => {},
    initProfileRepPage: () => {},
    initProfileIdentityPage: () => {},
    initLandingPage: () => {},
    initCommunityActivityPage: () => {},
    onCurationFilterRemoved: () => {},
    onCurationFilterChanged: () => {},
    onDropCreate: () => {},
    onDropChange: () => {},
    onDropDiscussionChange: () => {},
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

  const inValidateCurationFilter = ({
    filterId,
  }: {
    readonly filterId: string;
  }) => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.CURATION_FILTERS],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.CURATION_FILTER, filterId],
    });
    queryClient.invalidateQueries({
      queryKey: [QueryKey.PROFILE_LOGS, { curation_criteria_id: filterId }],
    });
    queryClient.invalidateQueries({
      queryKey: [
        QueryKey.COMMUNITY_MEMBERS_TOP,
        { curation_criteria_id: filterId },
      ],
    });
  };

  const onCurationFilterRemoved = ({
    filterId,
  }: {
    readonly filterId: string;
  }) => inValidateCurationFilter({ filterId });

  const onCurationFilterChanged = ({
    filterId,
  }: {
    readonly filterId: string;
  }) => inValidateCurationFilter({ filterId });

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

  const onProfileCICModify = ({
    targetProfile,
    connectedProfile,
    rater,
  }: {
    readonly targetProfile: IProfileAndConsolidations;
    readonly connectedProfile: IProfileAndConsolidations | null;
    readonly rater: string | null;
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
  };

  const onProfileRepModify = ({
    targetProfile,
    connectedProfile,
  }: {
    targetProfile: IProfileAndConsolidations;
    connectedProfile: IProfileAndConsolidations | null;
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
    disableActiveCurationFilter,
    data,
  }: {
    readonly params: ActivityLogParams;
    readonly disableActiveCurationFilter: boolean;
    readonly data: Page<ProfileActivityLog>;
  }) => {
    queryClient.setQueryData(
      [
        QueryKey.PROFILE_LOGS,
        convertActivityLogParams({ params, disableActiveCurationFilter }),
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
      disableActiveCurationFilter: true,
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
      disableActiveCurationFilter: true,
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
      disableActiveCurationFilter: true,
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
      disableActiveCurationFilter: false,
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
      queryKey: [QueryKey.COMMUNITY_DROPS],
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
          inputProfile: giverHandle,
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
        queryKey: [QueryKey.COMMUNITY_DROPS],
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
      queryKey: [QueryKey.COMMUNITY_DROPS],
    });
    queryClient.invalidateQueries({
      queryKey: [
        QueryKey.PROFILE_DROPS,
        {
          handleOrWallet: dropAuthorHandle.toLowerCase(),
        },
      ],
    });
  };

  const value = useMemo(
    () => ({
      setProfile,
      onProfileCICModify,
      onProfileRepModify,
      onProfileEdit,
      onProfileStatementAdd,
      onProfileStatementRemove,
      initProfileRepPage,
      initProfileIdentityPage,
      initLandingPage,
      initCommunityActivityPage,
      onCurationFilterRemoved,
      onCurationFilterChanged,
      onDropCreate,
      onDropChange,
      onDropDiscussionChange,
    }),
    [
      setProfile,
      onProfileCICModify,
      onProfileRepModify,
      onProfileEdit,
      onProfileStatementAdd,
      onProfileStatementRemove,
      initProfileRepPage,
      initProfileIdentityPage,
      initLandingPage,
      initCommunityActivityPage,
      onCurationFilterRemoved,
      onCurationFilterChanged,
      onDropCreate,
      onDropChange,
      onDropDiscussionChange,
    ]
  );

  return (
    <ReactQueryWrapperContext.Provider value={value}>
      {children}
    </ReactQueryWrapperContext.Provider>
  );
}
