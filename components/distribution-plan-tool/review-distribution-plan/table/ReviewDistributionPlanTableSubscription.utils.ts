import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";

export const isSubscriptionsAdmin = (
  connectedProfile: ApiIdentity | null,
  distributionAdminWallets: string[] = []
) => {
  const connectedWallets =
    connectedProfile?.wallets?.map((wallet) => wallet.wallet) ?? [];
  return connectedWallets.some((wallet) =>
    distributionAdminWallets.some((adminWallet) =>
      areEqualAddresses(adminWallet, wallet)
    )
  );
};
