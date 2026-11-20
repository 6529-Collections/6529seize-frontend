import Link from "next/link";
import { useEnsAddress, useEnsName } from "wagmi";
import { formatAddress, isValidEthAddress } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { tRich } from "@/i18n/messages";

export default function SettingsUpdatedBy({
  address,
}: Readonly<{ address: string }>) {
  const locale = useBrowserLocale();
  const { profile, isLoading } = useIdentity({
    handleOrWallet: address,
    initialProfile: null,
  });
  const handle = profile?.handle;
  const { data: ensName } = useEnsName({
    address: isValidEthAddress(address)
      ? (address as `0x${string}`)
      : undefined,
    chainId: 1,
    query: { enabled: !isLoading && !handle },
  });
  const { data: ensAddress } = useEnsAddress({
    name: ensName ?? undefined,
    chainId: 1,
    query: { enabled: !isLoading && !handle && !!ensName },
  });
  const verifiedEns =
    !!ensName && ensAddress?.toLowerCase() === address.toLowerCase();
  const identity = handle ? (
    <Link
      key="identity"
      href={`/${encodeURIComponent(handle)}`}
      className="tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline"
    >
      {handle}
    </Link>
  ) : (
    <span key="identity" title={address}>
      {verifiedEns ? `${ensName} — ${formatAddress(address)}` : address}
    </span>
  );

  return (
    <p className="tw-mb-0 tw-mt-4 tw-min-h-4 tw-break-all tw-text-xs tw-text-iron-400">
      {tRich(locale, "dropForge.settings.updated", { wallet: identity })}
    </p>
  );
}
