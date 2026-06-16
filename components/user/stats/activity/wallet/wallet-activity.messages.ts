import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
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
  params?: Parameters<typeof t>[2],
  locale: SupportedLocale = DEFAULT_LOCALE
) => t(locale, key, params);

export const getWalletActivityFilterLabel = (
  filter: UserPageStatsActivityWalletFilterType,
  locale: SupportedLocale = DEFAULT_LOCALE
) => getWalletActivityMessage(FILTER_LABEL_KEYS[filter], undefined, locale);

export const getWalletActivityFilterOptionLabel = (
  filter: UserPageStatsActivityWalletFilterType,
  locale: SupportedLocale = DEFAULT_LOCALE
) =>
  getWalletActivityMessage(
    "user.collected.stats.walletActivity.optionAriaLabel",
    {
      filter: getWalletActivityFilterLabel(filter, locale),
    },
    locale
  );

export const getWalletActivityEmptyMessage = (
  filter: UserPageStatsActivityWalletFilterType,
  locale: SupportedLocale = DEFAULT_LOCALE
) => getWalletActivityMessage(EMPTY_MESSAGE_KEYS[filter], undefined, locale);
