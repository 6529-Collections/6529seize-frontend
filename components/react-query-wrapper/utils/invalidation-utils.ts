import { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "./query-keys";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { getHandlesFromProfile } from "./profileUtils";

/**
 * Helper function to invalidate multiple queries with the same key but different values
 * 
 * @param param0 Object containing the key and values to invalidate
 * @param queryClient The QueryClient instance to use for invalidation
 */
export const invalidateQueries = ({
  key,
  values,
  queryClient,
}: {
  key: QueryKey;
  values: (string | Record<string, any>)[];
  queryClient: QueryClient;
}) => {
  for (const value of values) {
    queryClient.invalidateQueries({
      queryKey: [key, value],
    });
  }
};

/**
 * Invalidates all queries related to a profile
 * This includes queries for the profile handle and all associated wallet addresses
 * 
 * @param profile The profile to invalidate
 * @param queryClient The QueryClient instance
 */
export const invalidateProfile = (
  profile: IProfileAndConsolidations,
  queryClient: QueryClient
) => {
  const handles = getHandlesFromProfile(profile);
  invalidateQueries({ key: QueryKey.PROFILE, values: handles, queryClient });
};