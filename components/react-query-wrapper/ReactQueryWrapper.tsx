import { createContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfileActivityLogRatingEdit,
  ProfileActivityLogRatingEditContentMatter,
  RatingWithProfileInfoAndLevel,
} from "../../entities/IProfile";
import { UserPageRepPropsRepRates } from "../../pages/[user]/rep";
import { Page } from "../../helpers/Types";
import {
  ActivityLogParams,
  convertActivityLogParams,
} from "../profile-activity/ProfileActivityLogs";

export enum QueryKey {
  PROFILE = "PROFILE",
  PROFILE_LOGS = "PROFILE_LOGS",
  PROFILE_RATER_CIC_STATE = "PROFILE_RATER_CIC_STATE",
  CIC_RATINGS = "CIC_RATINGS",
  PROFILE_CIC_STATEMENTS = "PROFILE_CIC_STATEMENTS",
  PROFILE_SEARCH = "PROFILE_SEARCH",
  PROFILE_REP_RATINGS = "PROFILE_REP_RATINGS",
  PROFILE_REP_RATERS = "PROFILE_REP_RATERS",
  REP_CATEGORIES_SEARCH = "REP_CATEGORIES_SEARCH",
}

type QueryType<T, U, V, W> = [T, U, V, W];
export type ProfileQuery = QueryType<
  IProfileAndConsolidations,
  string,
  IProfileAndConsolidations,
  [QueryKey.PROFILE, string]
>;

export interface InitProfileActivityLogsParamsAndData {
  data: Page<ProfileActivityLogRatingEdit>;
  page: number;
  pageSize: number;
  logType: string;
  matter: ProfileActivityLogRatingEditContentMatter | null;
  includeIncoming: boolean;
}

export interface InitProfileRepRatersParamsAndData {
  data: Page<RatingWithProfileInfoAndLevel>;
  page: number;
  pageSize: number;
  logType: string;
  given: boolean;
}

export interface InitProfileActivityLogsParams {
  readonly params: ActivityLogParams;
  readonly data: Page<ProfileActivityLog>;
}

export interface InitProfileRepPageParams {
  readonly profile: IProfileAndConsolidations;
  readonly repRates: UserPageRepPropsRepRates;
  readonly repLogs: InitProfileActivityLogsParams;
  readonly repGivenToUsers: InitProfileRepRatersParamsAndData;
  readonly repReceivedFromUsers: InitProfileRepRatersParamsAndData;
  readonly handleOrWallet: string;
}

export interface InitProfileIdentityPageParams {
  readonly profile: IProfileAndConsolidations;
  readonly activityLogs: InitProfileActivityLogsParams;
}

type ReactQueryWrapperContextType = {
  setProfile: (profile: IProfileAndConsolidations) => void;
  invalidateProfile: (profile: IProfileAndConsolidations) => void;
  invalidateHandles: (handles: string[]) => void;
  invalidateProfileLogs: (params: {
    profile: IProfileAndConsolidations;
    keys: Record<string, any>;
  }) => void;
  invalidateProfileLogsByHandles: (params: {
    handles: string[];
    keys: Record<string, any>;
  }) => void;
  invalidateProfileRaterCICState: (params: {
    profile: IProfileAndConsolidations;
    rater: string;
  }) => void;
  invalidateProfileCICRatings: (profile: IProfileAndConsolidations) => void;
  invalidateProfileCICStatements: (profile: IProfileAndConsolidations) => void;
  onProfileRepModify: (profile: IProfileAndConsolidations) => void;

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
    invalidateProfile: () => {},
    invalidateHandles: () => {},
    invalidateProfileLogs: () => {},
    invalidateProfileLogsByHandles: () => {},
    invalidateProfileRaterCICState: () => {},
    invalidateProfileCICRatings: () => {},
    invalidateProfileCICStatements: () => {},
    onProfileRepModify: () => {},

    initProfileRepPage: () => {},
    initProfileIdentityPage: () => {},
    initLandingPage: () => {},
    initCommunityActivityPage: () => {},
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

  const invalidateHandles = (handles: string[]) => {
    invalidateQueries({ key: QueryKey.PROFILE, values: handles });
  };

  const invalidateProfileLogs = ({
    profile,
    keys,
  }: {
    profile: IProfileAndConsolidations;
    keys: Record<string, any>;
  }) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({
      key: QueryKey.PROFILE_LOGS,
      values: handles.map((h) => ({
        profile: h,
        ...keys,
      })),
    });
  };

  const invalidateProfileLogsByHandles = ({
    handles,
    keys,
  }: {
    handles: string[];
    keys: Record<string, any>;
  }) => {
    invalidateQueries({
      key: QueryKey.PROFILE_LOGS,
      values: handles.map((h) => ({
        profile: h,
        ...keys,
      })),
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

  const invalidateProfileCICRatings = (profile: IProfileAndConsolidations) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({
      key: QueryKey.CIC_RATINGS,
      values: handles.map((h) => ({
        profile: h,
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
        rater_contribution: null,
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

  const setProfileRepRaters = ({
    params,
    handleOrWallet,
  }: {
    params: InitProfileRepRatersParamsAndData;
    handleOrWallet: string;
  }) => {
    const { data, page, pageSize, logType, given } = params;

    const paramsObj: Record<string, string> = {
      page: `${page}`,
      page_size: `${pageSize}`,
      log_type: logType,
      handle_or_wallet: handleOrWallet,
    };

    if (given) {
      paramsObj.given = `${given}`;
    }

    queryClient.setQueryData([QueryKey.PROFILE_REP_RATERS, paramsObj], data);
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

  const invalidateProfileRepRaters = (profile: IProfileAndConsolidations) => {
    const handles = getHandlesFromProfile(profile);
    invalidateQueries({
      key: QueryKey.PROFILE_REP_RATERS,
      values: handles.map((h) => ({
        handle_or_wallet: h,
      })),
    });
  };

  const onProfileRepModify = (profile: IProfileAndConsolidations) => {
    invalidateProfileRepRatings(profile);
    invalidateProfileRepRaters(profile);
    invalidateProfileLogs({ profile, keys: {} });
  };

  const initProfileActivityLogs = ({
    params,
    data,
  }: {
    params: ActivityLogParams;
    data: Page<ProfileActivityLog>;
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
    setProfileRepRaters({ params: repGivenToUsers, handleOrWallet });
    setProfileRepRaters({ params: repReceivedFromUsers, handleOrWallet });
  };

  const initProfileIdentityPage = (params: InitProfileIdentityPageParams) => {
    setProfile(params.profile);
    initProfileActivityLogs(params.activityLogs);
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
        invalidateProfile,
        invalidateHandles,
        invalidateProfileLogs,
        invalidateProfileLogsByHandles,
        setProfile,
        invalidateProfileRaterCICState,
        invalidateProfileCICRatings,
        invalidateProfileCICStatements,
        initProfileRepPage,
        onProfileRepModify,
        initProfileIdentityPage,
        initLandingPage,
        initCommunityActivityPage,
      }}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  );
}
