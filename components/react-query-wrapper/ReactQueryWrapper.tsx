import { createContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../entities/IProfile";

export enum QueryKey {
  PROFILE = "PROFILE",
  PROFILE_LOGS = "PROFILE_LOGS",
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
};

export const ReactQueryWrapperContext =
  createContext<ReactQueryWrapperContextType>({
    setProfile: () => {},
    invalidateProfile: () => {},
    invalidateHandles: () => {},
    invalidateProfileLogs: () => {},
    invalidateProfileLogsByHandles: () => {},
  });

export default function ReactQueryWrapper({
  children,
}: {
  children: React.ReactNode;
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
  }

  return (
    <ReactQueryWrapperContext.Provider
      value={{
        invalidateProfile,
        invalidateHandles,
        invalidateProfileLogs,
        invalidateProfileLogsByHandles,
        setProfile,
      }}
    >
      {children}
    </ReactQueryWrapperContext.Provider>
  );
}
