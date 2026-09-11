import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { commonApiFetch } from "@/services/api/common-api";

type IdentityQueryOptionsParams = {
  readonly handleOrWallet: string | null | undefined;
  readonly headers?: Record<string, string> | undefined;
};

export const getIdentityQueryKey = (
  handleOrWallet: string | null | undefined
) => [QueryKey.PROFILE, handleOrWallet?.toLowerCase()] as const;

export const getIdentityQueryOptions = ({
  handleOrWallet,
  headers,
}: IdentityQueryOptionsParams) => {
  const normalizedHandleOrWallet = handleOrWallet?.toLowerCase();

  return {
    queryKey: getIdentityQueryKey(handleOrWallet),
    queryFn: async () => {
      if (normalizedHandleOrWallet === undefined) {
        throw new Error("Cannot fetch identity without a handle or wallet");
      }

      return await commonApiFetch<ApiIdentity>({
        endpoint: `identities/${normalizedHandleOrWallet}`,
        ...(headers === undefined ? {} : { headers }),
      });
    },
  };
};
