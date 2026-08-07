"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { DistributionNormalizedPage } from "@/generated/models/DistributionNormalizedPage";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

const ALLOWLIST_PHASES = ["Phase 0", "Phase 1", "Phase 2"] as const;

type AllowlistPhase = (typeof ALLOWLIST_PHASES)[number];

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAllowlistPhase(value: string): AllowlistPhase | undefined {
  const normalized = value.trim().replaceAll(/\s+/g, " ").toLowerCase();
  return ALLOWLIST_PHASES.find((phase) => phase.toLowerCase() === normalized);
}

export function getConnectedWalletAllowlistPhases({
  address,
  data,
  tokenId,
}: Readonly<{
  address: string;
  data: DistributionNormalizedPage | undefined;
  tokenId: number;
}>): AllowlistPhase[] {
  const normalizedAddress = normalizeAddress(address);
  const normalizedContract = normalizeAddress(MEMES_CONTRACT);
  const phases = new Set<AllowlistPhase>();

  for (const distribution of data?.data ?? []) {
    if (
      distribution.card_id !== tokenId ||
      normalizeAddress(distribution.contract) !== normalizedContract ||
      normalizeAddress(distribution.wallet) !== normalizedAddress
    ) {
      continue;
    }

    for (const entry of distribution.allowlist ?? []) {
      if (
        !Number.isFinite(entry.spots_allowlist) ||
        entry.spots_allowlist <= 0
      ) {
        continue;
      }

      const phase = normalizeAllowlistPhase(entry.phase);
      if (phase) {
        phases.add(phase);
      }
    }
  }

  return ALLOWLIST_PHASES.filter((phase) => phases.has(phase));
}

export default function LatestDropAllowlistStatus({
  tokenId,
}: Readonly<{ tokenId: number }>) {
  const { address, connectionState } = useSeizeConnectContext();
  const locale = useBrowserLocale();
  const normalizedAddress = address ? normalizeAddress(address) : "";
  const hasTokenId = Number.isInteger(tokenId) && tokenId > 0;

  const { data, isError, isPending } = useQuery<DistributionNormalizedPage>({
    queryKey: [QueryKey.MEMES_ALLOWLIST_STATUS, tokenId, normalizedAddress],
    queryFn: async ({ signal }) =>
      await commonApiFetch<DistributionNormalizedPage>({
        endpoint: "distributions",
        params: {
          card_id: String(tokenId),
          contract: MEMES_CONTRACT,
          wallet: normalizedAddress,
          page: "1",
          page_size: "10",
        },
        signal,
        includeWalletAuth: false,
      }),
    enabled: hasTokenId && normalizedAddress.length > 0,
    retry: false,
  });

  if (!hasTokenId) {
    return null;
  }

  const phases = address
    ? getConnectedWalletAllowlistPhases({ address, data, tokenId })
    : [];
  const walletIsLoading =
    connectionState === "initializing" || connectionState === "connecting";
  const showLoading = walletIsLoading || (!!address && isPending);

  let status = t(locale, "home.mintAllowlist.connectWallet");
  if (showLoading) {
    status = t(locale, "home.mintAllowlist.checking");
  } else if (connectionState === "error" || (address && isError)) {
    status = t(locale, "home.mintAllowlist.unavailable");
  } else if (address && phases.length === 0) {
    status = t(locale, "home.mintAllowlist.notFound");
  }

  const showPhases =
    !showLoading &&
    connectionState !== "error" &&
    !isError &&
    phases.length > 0;

  return (
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-px-4 tw-py-3">
      <h3 className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
        {t(locale, "home.mintAllowlist.label")}
      </h3>
      <div
        className="tw-mt-2 tw-flex tw-min-h-7 tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {showPhases ? (
          <>
            <span className="tw-text-sm tw-font-medium tw-text-iron-200">
              {t(locale, "home.mintAllowlist.connectedWallet")}
            </span>
            <ul
              className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-1.5 tw-p-0"
              aria-label={t(locale, "home.mintAllowlist.phasesAriaLabel")}
            >
              {phases.map((phase) => (
                <li
                  key={phase}
                  className="tw-rounded-full tw-border tw-border-solid tw-border-success/30 tw-bg-success/10 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-success"
                >
                  {phase}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <span className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300">
            {status}
          </span>
        )}
      </div>
    </section>
  );
}
