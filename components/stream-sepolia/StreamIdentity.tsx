"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { isAddress } from "viem";

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

function useIdentity(address: string) {
  return useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: address }),
    enabled: !!address,
    // Most test wallets have no profile; one miss is enough.
    retry: false,
    staleTime: 10 * 60_000,
  });
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed !== undefined && trimmed.length > 0 ? trimmed : null;
}

/** The identity's ENS-style display name, when it is a name and not an address. */
function displayNameOf(display: string | undefined): string | null {
  const name = display?.trim();
  return name && !isAddress(name) && !name.startsWith("0x") ? name : null;
}

/**
 * The name the rest of 6529.io shows for an address: the 6529 profile handle,
 * else its ENS name, else null (the caller shows the shortened address).
 */
export function useStreamHandle(address: string | undefined): string | null {
  const identity = useIdentity(address ?? "");
  if (!address) return null;
  return nonEmpty(identity.data?.handle) ?? displayNameOf(identity.data?.display);
}

/**
 * A person's name as plain text, for places that are already a link (a card):
 * "You", the 6529 handle, the ENS name, or the shortened address.
 */
export function useStreamName(address: string | undefined): string | null {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const handle = useStreamHandle(address);
  if (!address) return null;
  if (sameAddress(address, wallet.address)) return handle ? t(locale, "streamSepolia.youHandle", { handle }) : t(locale, "streamSepolia.you");
  return handle ?? formatAddress(address);
}

/**
 * A person on the Stream pages, shown one way everywhere: "You" for the
 * connected wallet, the 6529 handle and avatar when the address has a profile,
 * else its ENS name or the shortened address, linking to Sepolia Etherscan.
 */
export function StreamIdentity({ address }: { readonly address: string }) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const identity = useIdentity(address);
  const handle = identity.data?.handle?.trim();
  const ens = handle ? null : displayNameOf(identity.data?.display);
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
          {isYou ? t(locale, "streamSepolia.you") : (ens ?? formatAddress(address))}
        </a>
      )}
    </span>
  );
}
