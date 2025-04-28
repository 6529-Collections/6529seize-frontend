import { useQuery } from "@tanstack/react-query";
import { ApiIdentity } from "../generated/models/ApiIdentity";
import { commonApiFetch } from "../services/api/common-api";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

interface UseIdentityProps {
  /** User handle or wallet address */
  readonly handleOrWallet: string | null | undefined;
  /** Initial profile data */
  readonly initialProfile: ApiIdentity | null;
}

/**
 * Hook to fetch profile data for a user
 * @param props - Hook properties
 * @returns Query result with profile data
 */
export function useIdentity({
  handleOrWallet,
  initialProfile,
}: Readonly<UseIdentityProps>) {
  const { data: profile, isLoading } = useQuery<ApiIdentity>({
    queryKey: [QueryKey.PROFILE, handleOrWallet?.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<ApiIdentity>({
        endpoint: `identities/${handleOrWallet?.toLowerCase()}`,
      }),
    enabled: !!handleOrWallet,
    initialData: initialProfile ?? undefined,
  });

  return { profile: profile ?? null, isLoading };
}
