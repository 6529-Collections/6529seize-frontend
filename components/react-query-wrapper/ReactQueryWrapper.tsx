import { createContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApiProfileRepRatesState,
  CommunityMemberOverview,
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
import { CommunityMembersQuery } from "../../pages/community";

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
    initCommunityActivityPage: () => { },
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
    data,
  }: {
    readonly params: ActivityLogParams;
    readonly data: Page<ProfileActivityLog>;
  }) => {
    queryClient.setQueryData(
      [QueryKey.PROFILE_LOGS, convertActivityLogParams(params)],
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
    initProfileActivityLogs(repLogs);
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
    initProfileActivityLogs(activityLogs);
    setProfileRaters(cicGivenToUsers);
    setProfileRaters(cicReceivedFromUsers);
  };

  const initLandingPage = ({
    activityLogs,
  }: {
    activityLogs: InitProfileActivityLogsParams;
  }) => {
    initProfileActivityLogs(activityLogs);
  };

  const initCommunityActivityPage = ({
    activityLogs,
  }: {
    activityLogs: InitProfileActivityLogsParams;
  }) => {
    initProfileActivityLogs(activityLogs);
  };

  return (
    <ReactQueryWrapperContext.Provider
      value={{
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
      }}>
      {children}
    </ReactQueryWrapperContext.Provider>
  );
}
