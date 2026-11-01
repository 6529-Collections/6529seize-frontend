"use client";

import {
  useStream,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { Address, WorkParty } from "@/lib/stream/types";

/** A known name for an address, or undefined to show it shortened. */
export type AddressLabeler = (address: Address) => string | undefined;

const NO_PARTIES: readonly WorkParty[] = [];

/**
 * Names for the addresses a work page shows: the connected account ("You"),
 * the work's artists, the 6529 Network Museum, the 1/1 auction's custody and,
 * on the mock, the dev accounts.
 */
export function useAddressLabels(
  locale: SupportedLocale,
  parties: readonly WorkParty[] = NO_PARTIES
): AddressLabeler {
  const { client, account } = useStream();
  const dev = client?.dev ?? null;
  const { data: devAccounts = [] } = useStreamQuery("dev-accounts", [], () =>
    Promise.resolve(dev === null ? [] : dev.accounts())
  );
  const contracts = client?.dataSource.source().contracts ?? null;
  const labels = new Map<string, string>();
  for (const party of parties) {
    labels.set(party.account.toLowerCase(), party.displayName);
  }
  for (const entry of devAccounts) {
    labels.set(entry.address.toLowerCase(), entry.label);
  }
  if (contracts !== null) {
    labels.set(
      contracts.museum.toLowerCase(),
      t(locale, "stream.workAddress.museum")
    );
    labels.set(
      contracts.englishAuction.toLowerCase(),
      t(locale, "stream.workAddress.auction")
    );
  }
  if (account !== null) {
    const known = labels.get(account.toLowerCase());
    labels.set(
      account.toLowerCase(),
      known === undefined
        ? t(locale, "stream.workAddress.you")
        : t(locale, "stream.workAddress.youAs", { name: known })
    );
  }
  return (address) => labels.get(address.toLowerCase());
}
