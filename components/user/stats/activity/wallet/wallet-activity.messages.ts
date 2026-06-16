import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { UserPageStatsActivityWalletFilterType } from "./UserPageStatsActivityWallet.types";

type WalletActivityMessageKey = Extract<
  MessageKey,
  `user.collected.stats.walletActivity.${string}`
>;

const FILTER_LABEL_KEYS: Record<
  UserPageStatsActivityWalletFilterType,
  WalletActivityMessageKey
> = {
  [UserPageStatsActivityWalletFilterType.ALL]:
    "user.collected.stats.walletActivity.filters.all",
  [UserPageStatsActivityWalletFilterType.AIRDROPS]:
    "user.collected.stats.walletActivity.filters.airdrops",
  [UserPageStatsActivityWalletFilterType.MINTS]:
    "user.collected.stats.walletActivity.filters.mints",
  [UserPageStatsActivityWalletFilterType.SALES]:
    "user.collected.stats.walletActivity.filters.sales",
  [UserPageStatsActivityWalletFilterType.PURCHASES]:
    "user.collected.stats.walletActivity.filters.purchases",
  [UserPageStatsActivityWalletFilterType.TRANSFERS]:
    "user.collected.stats.walletActivity.filters.transfers",
  [UserPageStatsActivityWalletFilterType.BURNS]:
    "user.collected.stats.walletActivity.filters.burns",
};

const EMPTY_MESSAGE_KEYS: Record<
  UserPageStatsActivityWalletFilterType,
  WalletActivityMessageKey
> = {
  [UserPageStatsActivityWalletFilterType.ALL]:
    "user.collected.stats.walletActivity.empty.all",
  [UserPageStatsActivityWalletFilterType.AIRDROPS]:
    "user.collected.stats.walletActivity.empty.airdrops",
  [UserPageStatsActivityWalletFilterType.MINTS]:
    "user.collected.stats.walletActivity.empty.mints",
  [UserPageStatsActivityWalletFilterType.SALES]:
    "user.collected.stats.walletActivity.empty.sales",
  [UserPageStatsActivityWalletFilterType.PURCHASES]:
    "user.collected.stats.walletActivity.empty.purchases",
  [UserPageStatsActivityWalletFilterType.TRANSFERS]:
    "user.collected.stats.walletActivity.empty.transfers",
  [UserPageStatsActivityWalletFilterType.BURNS]:
    "user.collected.stats.walletActivity.empty.burns",
};

export const getWalletActivityMessage = (
  key: WalletActivityMessageKey,
  params?: Parameters<typeof t>[2]
) => t(DEFAULT_LOCALE, key, params);

export const getWalletActivityFilterLabel = (
  filter: UserPageStatsActivityWalletFilterType
) => getWalletActivityMessage(FILTER_LABEL_KEYS[filter]);

export const getWalletActivityFilterOptionLabel = (
  filter: UserPageStatsActivityWalletFilterType
) =>
  getWalletActivityMessage(
    "user.collected.stats.walletActivity.optionAriaLabel",
    {
      filter: getWalletActivityFilterLabel(filter),
    }
  );

export const getWalletActivityEmptyMessage = (
  filter: UserPageStatsActivityWalletFilterType
) => getWalletActivityMessage(EMPTY_MESSAGE_KEYS[filter]);
