import { createContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../entities/IProfile";

export enum QueryKey {
  PROFILE = "PROFILE",
  PROFILE_LOGS = "PROFILE_LOGS",
  PROFILE_RATER_CIC_STATE = "PROFILE_RATER_CIC_STATE",
  CIC_RATINGS = "CIC_RATINGS",
  PROFILE_CIC_STATEMENTS = "PROFILE_CIC_STATEMENTS",
}

type QueryType<T, U, V, W> = [T, U, V, W];
export type ProfileQuery = QueryType<
  IProfileAndConsolidations,
  string,
  IProfileAndConsolidations,
  [QueryKey.PROFILE, string]
>;

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
      }}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  );
}
