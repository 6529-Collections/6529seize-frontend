import Button from "@/components/utils/button/Button";
import { normalizeDistributionPhase } from "@/components/drop-forge/craft/craft-claim-helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/emma";
import {
  getMemesMintingAirdrops,
  getMemesMintingAllowlists,
} from "@/services/api/memes-minting-claims-api";
import { useQuery } from "@tanstack/react-query";

const phases = [
  { key: "phase0", number: 0, aliases: ["phase0", "0"] },
  { key: "phase1", number: 1, aliases: ["phase1", "1"] },
  { key: "phase2", number: 2, aliases: ["phase2", "2"] },
  { key: "public", number: null, aliases: ["public", "publicphase"] },
] as const;

export function FinalizedDistributionCounts({
  claim,
}: Readonly<{ claim: number }>) {
  const locale = useBrowserLocale();
  const totals = useQuery({
    queryKey: ["emma-finalized-distribution-counts", claim],
    queryFn: async () => {
      const [airdrops, allowlists] = await Promise.all([
        getMemesMintingAirdrops(claim),
        getMemesMintingAllowlists(claim),
      ]);
      return { airdrops, allowlists };
    },
    refetchOnMount: "always",
  });

  function count(value: number, unit: "card" | "spot" | "wallet") {
    const suffix =
      selectPluralCategory(locale, value) === "one" ? "One" : "Other";
    return t(locale, `emma.review.${unit}${suffix}`, {
      count: formatInteger(locale, value),
    });
  }

  const heading = t(locale, "emma.review.finalizedCounts");
  const data = totals.data;
  const cell = "tw-min-w-0 tw-break-words tw-py-1.5 tw-pr-2 tw-align-top";
  let content;
  if (totals.isError) {
    content = (
      <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
          {t(locale, "emma.review.finalCountsError")}
        </p>
        <Button
          variant="secondary"
          size="sm"
          loading={totals.isFetching}
          onClick={() => void totals.refetch()}
        >
          {t(locale, "emma.review.retryFinalCounts")}
        </Button>
      </div>
    );
  } else if (totals.isFetching || !data) {
    content = (
      <output className="tw-text-sm tw-text-iron-400">
        {t(locale, "emma.review.loadingFinalCounts")}
      </output>
    );
  } else {
    content = (
      <table
        aria-label={heading}
        className="tw-mt-1 tw-w-full tw-table-fixed tw-text-left tw-text-xs"
      >
        <thead className="tw-text-iron-300">
          <tr>
            <th scope="col" className={`${cell} tw-w-1/5 tw-font-medium`}>
              {t(locale, "emma.review.countPhase")}
            </th>
            <th scope="col" className={`${cell} tw-font-medium`}>
              {t(locale, "emma.review.countAirdrops")}
            </th>
            <th scope="col" className={`${cell} tw-font-medium`}>
              {t(locale, "emma.review.countAllowlist")}
            </th>
          </tr>
        </thead>
        <tbody className="tw-divide-y tw-divide-white/10">
          {phases.map(({ key, number, aliases }) => {
            const phaseNames: readonly string[] = aliases;
            const airdrop = data.airdrops.find(({ phase }) =>
              phaseNames.includes(normalizeDistributionPhase(phase))
            );
            const allowlist = data.allowlists.find(({ phase }) =>
              phaseNames.includes(normalizeDistributionPhase(phase))
            );
            return (
              <tr key={key}>
                <th
                  scope="row"
                  className={`${cell} tw-font-medium tw-text-iron-100`}
                >
                  {number === null
                    ? t(locale, "emma.review.countPublic")
                    : t(locale, "emma.review.countPhaseNumber", {
                        number: formatInteger(locale, number),
                      })}
                </th>
                <td className={cell}>
                  <strong className="tw-font-semibold tw-text-iron-100">
                    {count(airdrop?.total ?? 0, "card")}
                  </strong>
                  <span className="tw-block tw-text-iron-300">
                    {count(airdrop?.addresses ?? 0, "wallet")}
                  </span>
                </td>
                <td className={cell}>
                  {number === null && !allowlist ? (
                    "—"
                  ) : (
                    <>
                      <strong className="tw-font-semibold tw-text-iron-100">
                        {count(allowlist?.total ?? 0, "spot")}
                      </strong>
                      <span className="tw-block tw-text-iron-300">
                        {count(allowlist?.addresses ?? 0, "wallet")}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  return (
    <section
      aria-label={heading}
      className="tw-my-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/30 tw-px-3 tw-py-2.5 sm:tw-px-4"
    >
      <h4 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
        {heading}
      </h4>
      {content}
    </section>
  );
}
