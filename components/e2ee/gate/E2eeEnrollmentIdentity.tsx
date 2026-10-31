"use client";

import {
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { useContext } from "react";
import { getAddress, isAddress } from "viem";
import { useAuth } from "@/components/auth/Auth";
import { SeizeConnectContext } from "@/components/auth/seizeConnectContextValue";
import { shortenAddress } from "@/helpers/address.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

/**
 * Before the wallet opens: which profile and wallet sign the device grant,
 * and where this device can be turned off later. Shown with the enrollment
 * card without changing its owner-approved grant wording.
 */
export function E2eeEnrollmentIdentity() {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  // Optional read: the gate renders in tests and shells without a provider.
  const address = useContext(SeizeConnectContext)?.address;
  if (!address) {
    return null;
  }
  // Never echo unvalidated input: an unexpected value gets neutral copy.
  const checksummed = isAddress(address) ? getAddress(address) : null;
  const shortWallet = checksummed ? shortenAddress(checksummed) : null;
  const handle = connectedProfile?.handle ?? null;
  let identity: string;
  if (shortWallet) {
    identity = t(locale, "e2ee.enroll.identity", {
      name: handle ?? shortWallet,
      wallet: shortWallet,
    });
  } else {
    identity = t(locale, "e2ee.enroll.identityUnknown");
  }
  return (
    <ul className="tw-m-0 tw-mt-4 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-rounded-lg tw-bg-white/[0.03] tw-p-3 tw-text-xs tw-leading-5 tw-text-iron-300">
      <li
        className="tw-flex tw-items-start tw-gap-2"
        title={checksummed ?? undefined}
      >
        <UserCircleIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-text-iron-400"
        />
        <span>{identity}</span>
      </li>
      <li className="tw-flex tw-items-start tw-gap-2">
        <WrenchScrewdriverIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-text-iron-400"
        />
        <span>{t(locale, "e2ee.enroll.manage")}</span>
      </li>
    </ul>
  );
}
