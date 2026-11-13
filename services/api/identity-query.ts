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

/**
 * A handle or wallet as one lowercase path segment. Route params can arrive
 * percent-encoded or raw, so the value is decoded once (kept as is when it is
 * not valid encoding) and then encoded: both forms give the same segment, and
 * no value can add a path separator. Null for a dot segment, which URLs
 * resolve against the path even when encoded.
 */
const toIdentityPathSegment = (handleOrWallet: string): string | null => {
  let decoded = handleOrWallet;
  try {
    decoded = decodeURIComponent(handleOrWallet);
  } catch {
    // Not percent-encoded; use the value as it is.
  }
  const normalized = decoded.toLowerCase();
  return normalized === "." || normalized === ".."
    ? null
    : encodeURIComponent(normalized);
};

export const getIdentityQueryOptions = ({
  handleOrWallet,
  headers,
}: IdentityQueryOptionsParams) => ({
  queryKey: getIdentityQueryKey(handleOrWallet),
  queryFn: async () => {
    if (handleOrWallet === null || handleOrWallet === undefined) {
      throw new Error("Cannot fetch identity without a handle or wallet");
    }
    const segment = toIdentityPathSegment(handleOrWallet);
    if (segment === null) {
      throw new Error("Cannot fetch identity for a dot segment");
    }

    return await commonApiFetch<ApiIdentity>({
      endpoint: `identities/${segment}`,
      ...(headers === undefined ? {} : { headers }),
    });
  },
});
