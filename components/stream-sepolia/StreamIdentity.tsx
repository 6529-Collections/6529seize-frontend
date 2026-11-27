"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import ProfileAvatar, { ProfileBadgeSize } from "@/components/common/profile/ProfileAvatar";
import { formatAddress } from "@/helpers/addressFormatting";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { sameAddress } from "@/lib/stream/state";
import { getIdentityQueryOptions } from "@/services/api/identity-query";

import { sepoliaAddressUrl } from "./format";
import { useStreamWallet } from "./WalletGate";

const NAME_CLASS =
  "tw-truncate tw-text-iron-100 tw-no-underline tw-decoration-white/20 tw-underline-offset-4 hover:tw-text-white hover:tw-underline";

/**
 * A person on the Stream pages, shown one way everywhere: "You" for the
 * connected wallet, the 6529 handle and avatar when the address has a profile,
 * else the shortened address linking to Sepolia Etherscan.
 */
export function StreamIdentity({ address }: { readonly address: string }) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const identity = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: address }),
    enabled: !!address,
    // Most test wallets have no profile; one miss is enough.
    retry: false,
    staleTime: 10 * 60_000,
  });
  const handle = identity.data?.handle?.trim();
  const isYou = sameAddress(address, wallet.address);
  return (
    <span className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2 tw-align-middle">
      {identity.data?.pfp ? (
        <ProfileAvatar pfpUrl={identity.data.pfp} size={ProfileBadgeSize.SMALL} shape="circle" alt="" />
      ) : null}
      {handle ? (
        <Link href={`/${encodeURIComponent(handle)}`} className={NAME_CLASS}>
          {isYou ? t(locale, "streamSepolia.youHandle", { handle }) : handle}
        </Link>
      ) : (
        <a href={sepoliaAddressUrl(address)} target="_blank" rel="noreferrer" className={NAME_CLASS} title={address}>
          {isYou ? t(locale, "streamSepolia.you") : formatAddress(address)}
        </a>
      )}
    </span>
  );
}
