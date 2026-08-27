import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import type { ApiGroupDescription } from "@/generated/models/ApiGroupDescription";
import { isEthereumAddress } from "@/helpers/AllowlistToolHelpers";
import type { GroupCriteriaIdentityLabels } from "@/helpers/groups/group-criteria-summary";
import { getIdentityQueryOptions } from "@/services/api/identity-query";

type GroupCriteria = ApiCreateGroupDescription | ApiGroupDescription;

const getIdentityWallets = ({
  repIdentity,
  cicIdentity,
}: {
  readonly repIdentity: string | null;
  readonly cicIdentity: string | null;
}): readonly string[] => {
  const identities = [repIdentity?.trim() ?? "", cicIdentity?.trim() ?? ""];

  return Array.from(
    new Set(
      identities
        .filter(isEthereumAddress)
        .map((identity) => identity.toLowerCase())
    )
  );
};

export function useGroupCriteriaIdentityLabels(
  group: GroupCriteria | null | undefined
): GroupCriteriaIdentityLabels {
  const repIdentity = group?.rep.user_identity ?? null;
  const cicIdentity = group?.cic.user_identity ?? null;
  const identityWallets = useMemo(
    () => getIdentityWallets({ repIdentity, cicIdentity }),
    [cicIdentity, repIdentity]
  );
  const identityQueries = useQueries({
    // Criteria have exactly two identity-backed fields: REP and NIC.
    queries: identityWallets.map((wallet) => ({
      ...getIdentityQueryOptions({ handleOrWallet: wallet }),
      retry: false,
      staleTime: 5 * 60 * 1000,
    })),
  });

  return useMemo(() => {
    const labels: Record<string, string> = {};
    identityWallets.forEach((wallet, index) => {
      const handle = identityQueries[index]?.data?.handle?.trim();
      if (handle) {
        labels[wallet] = handle;
      }
    });
    return labels;
  }, [identityQueries, identityWallets]);
}
