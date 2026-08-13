"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { MEMES_CONTRACT } from "@/constants/constants";
import { ApiWalletDistributionAllocationPhaseEnum } from "@/generated/models/ApiWalletDistributionAllocation";
import type { ApiWalletDistributionAllocation } from "@/generated/models/ApiWalletDistributionAllocation";
import type { ApiWalletDistributionAllocations } from "@/generated/models/ApiWalletDistributionAllocations";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

const PHASE_ORDER = [
  ApiWalletDistributionAllocationPhaseEnum.Phase0,
  ApiWalletDistributionAllocationPhaseEnum.Phase1,
  ApiWalletDistributionAllocationPhaseEnum.Phase2,
  ApiWalletDistributionAllocationPhaseEnum.Public,
] as const;

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

function formatAllocation(
  locale: ReturnType<typeof useBrowserLocale>,
  allocation: ApiWalletDistributionAllocation
): string | null {
  const airdrop = Math.max(0, allocation.spots_airdrop);
  const allowlist =
    allocation.phase === ApiWalletDistributionAllocationPhaseEnum.Public
      ? 0
      : Math.max(0, allocation.spots_allowlist);
  const params = {
    phase: allocation.phase,
    airdrop: formatNumber(locale, airdrop, { maximumFractionDigits: 0 }),
    allowlist: formatNumber(locale, allowlist, { maximumFractionDigits: 0 }),
  };

  if (airdrop > 0 && allowlist > 0) {
    return t(locale, "home.mintAllowlist.pill.mixed", params);
  }
  if (airdrop > 0) {
    return t(locale, "home.mintAllowlist.pill.airdrop", params);
  }
  if (allowlist > 0) {
    return t(locale, "home.mintAllowlist.pill.allowlist", params);
  }
  return null;
}

export default function LatestDropAllowlistStatus({
  tokenId,
}: Readonly<{ tokenId: number }>) {
  const { address, connectionState } = useSeizeConnectContext();
  const locale = useBrowserLocale();
  const normalizedAddress = address ? normalizeAddress(address) : "";
  const hasTokenId = Number.isInteger(tokenId) && tokenId > 0;

  const { data, isError, isPending } =
    useQuery<ApiWalletDistributionAllocations>({
      queryKey: [QueryKey.MEMES_WALLET_ALLOCATIONS, tokenId, normalizedAddress],
      queryFn: async ({ signal }) =>
        await commonApiFetch<ApiWalletDistributionAllocations>({
          endpoint: `distributions/${MEMES_CONTRACT}/${tokenId}/wallet-allocations`,
          params: { wallet: normalizedAddress },
          signal,
          includeWalletAuth: false,
        }),
      enabled: hasTokenId && normalizedAddress.length > 0,
      retry: false,
    });

  if (!hasTokenId || !address) {
    return null;
  }

  const labels = [...(data?.allocations ?? [])]
    .sort(
      (left, right) =>
        PHASE_ORDER.indexOf(left.phase) - PHASE_ORDER.indexOf(right.phase)
    )
    .map((allocation) => ({
      phase: allocation.phase,
      label: formatAllocation(locale, allocation),
    }))
    .filter(
      (allocation): allocation is { phase: string; label: string } =>
        allocation.label !== null
    );

  let status = t(locale, "home.mintAllowlist.checking");
  if (connectionState === "error" || isError) {
    status = t(locale, "home.mintAllowlist.unavailable");
  } else if (!isPending && data.has_distribution === false) {
    status = t(locale, "home.mintAllowlist.notPublished");
  } else if (!isPending && labels.length === 0) {
    status = t(locale, "home.mintAllowlist.notFound");
  }

  const showAllocations =
    connectionState !== "error" && !isPending && !isError && labels.length > 0;

  return (
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-px-4 tw-py-3">
      <h3 className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
        {t(locale, "home.mintAllowlist.label")}
      </h3>
      <div
        className="tw-mt-2 tw-min-h-7 tw-min-w-0"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {showAllocations ? (
          <ul
            className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-1.5 tw-p-0"
            aria-label={t(locale, "home.mintAllowlist.allocationsAriaLabel")}
          >
            {labels.map(({ phase, label }) => (
              <li
                key={phase}
                className="tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-success/30 tw-bg-success/10 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-success"
              >
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <span className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300">
            {status}
          </span>
        )}
      </div>
    </section>
  );
}
