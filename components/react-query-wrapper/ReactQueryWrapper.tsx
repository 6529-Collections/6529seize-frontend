import { createContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfileActivityLogRatingEdit,
  RateMatter,
  RatingWithProfileInfoAndLevel,
} from "../../entities/IProfile";
import { UserPageRepPropsRepRates } from "../../pages/[user]";
import { Page } from "../../helpers/Types";
import {
  ActivityLogParams,
  convertActivityLogParams,
} from "../profile-activity/ProfileActivityLogs";
import { ProfileRatersParams } from "../user/utils/raters-table/wrapper/ProfileRatersTableWrapper";
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
  CURATION_FILTERS = "CURATION_FILTERS",
  CURATION_FILTER = "CURATION_FILTER",
  NFTS_SEARCH = "NFTS_SEARCH",
  PROFILE_PROXY = "PROFILE_PROXY",
  PROFILE_PROFILE_PROXIES = "PROFILE_PROFILE_PROXIES",
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
    initProfileRepPage: () => {},
    initProfileIdentityPage: () => {},
    initLandingPage: () => {},
    initCommunityActivityPage: () => {},
    onCurationFilterRemoved: () => {},
    onCurationFilterChanged: () => {},
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

  return (
    <ReactQueryWrapperContext.Provider
      value={{
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
        onCurationFilterRemoved,
        onCurationFilterChanged,
      }}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  );
}
