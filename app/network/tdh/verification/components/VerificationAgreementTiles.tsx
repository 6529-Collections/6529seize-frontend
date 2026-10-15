import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { selectPluralCategory } from "@/i18n/format";
import type { VerificationAgreement } from "@/lib/tdh/verification/schema";
import { agreementShare } from "@/lib/tdh/verification/states";
import TdhSource from "../../shared/TdhSource";
import { TDH_CARD } from "../../shared/tdhStyles";
import { formatInteger, formatShare, formatSigned } from "./verificationFormat";

const TILE = `${TDH_CARD} tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-p-5`;
const TILE_LABEL = "tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400";
const TILE_VALUE =
  "tw-m-0 tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50";

/**
 * An agreement bar. Agreement is usually above 99.9%, which a plain bar
 * cannot show, so the differing part keeps a visible minimum width and is
 * counted in words beside it.
 */
export function AgreementBar({
  locale,
  equal,
  total,
}: {
  readonly locale: SupportedLocale;
  readonly equal: number;
  readonly total: number;
}) {
  const share = agreementShare(equal, total) ?? 0;
  const differ = total - equal;
  const differPercent = total > 0 ? (differ / total) * 100 : 0;
  const plural =
    selectPluralCategory(locale, differ) === "one" ? "one" : "other";
  return (
    <div>
      <div
        role="img"
        aria-label={t(locale, "network.tdh.verify.tiles.barLabel", {
          equal: formatInteger(locale, equal),
          total: formatInteger(locale, total),
          share: formatShare(locale, share),
        })}
        className="tw-flex tw-h-2.5 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
      >
        <span className="tw-h-full tw-flex-1 tw-bg-success/80" />
        {differ > 0 && (
          <span
            className="tw-h-full tw-min-w-[6px] tw-bg-amber-400"
            style={{ width: `${differPercent}%` }}
          />
        )}
      </div>
      <p className="tw-m-0 tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-text-xs tw-tabular-nums tw-text-iron-400">
        <span>{formatShare(locale, share)}</span>
        <span className={differ > 0 ? "tw-text-amber-200" : "tw-text-success"}>
          {differ > 0
            ? t(
                locale,
                `network.tdh.verify.tiles.differ.${plural}` as MessageKey,
                {
                  count: formatInteger(locale, differ),
                }
              )
            : t(locale, "network.tdh.verify.tiles.allEqual")}
        </span>
      </p>
    </div>
  );
}

function CountTile({
  locale,
  label,
  equal,
  total,
  missing,
}: {
  readonly locale: SupportedLocale;
  readonly label: string;
  readonly equal: number | null;
  readonly total: number | null;
  readonly missing: string;
}) {
  return (
    <li className={TILE}>
      <p className={TILE_LABEL}>{label}</p>
      {equal === null || total === null ? (
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {missing}
        </p>
      ) : (
        <>
          <p className={TILE_VALUE}>
            {t(locale, "network.tdh.verify.tiles.ofTotal", {
              equal: formatInteger(locale, equal),
              total: formatInteger(locale, total),
            })}
          </p>
          <AgreementBar locale={locale} equal={equal} total={total} />
        </>
      )}
    </li>
  );
}

export default function VerificationAgreementTiles({
  locale,
  rustVsLive,
  rustVsPython,
  pythonRan,
  totalDelta,
  afterCutover,
}: {
  readonly locale: SupportedLocale;
  readonly rustVsLive: VerificationAgreement | null;
  readonly rustVsPython: VerificationAgreement | null;
  readonly pythonRan: boolean;
  readonly totalDelta: number | null;
  readonly afterCutover: boolean;
}) {
  const liveMissing = t(locale, "network.tdh.verify.tiles.liveMissing");
  const liveTiles = [
    <CountTile
      key="identities-live"
      locale={locale}
      label={t(locale, "network.tdh.verify.tiles.identitiesLive")}
      equal={rustVsLive?.identitiesEqual ?? null}
      total={rustVsLive?.identitiesTotal ?? null}
      missing={liveMissing}
    />,
    <CountTile
      key="wallets-live"
      locale={locale}
      label={t(locale, "network.tdh.verify.tiles.walletsLive")}
      equal={rustVsLive?.walletsEqual ?? null}
      total={rustVsLive?.walletsTotal ?? null}
      missing={liveMissing}
    />,
  ];
  const pythonTile = (
    <CountTile
      key="identities-python"
      locale={locale}
      label={t(locale, "network.tdh.verify.tiles.identitiesPython")}
      equal={pythonRan ? (rustVsPython?.identitiesEqual ?? null) : null}
      total={pythonRan ? (rustVsPython?.identitiesTotal ?? null) : null}
      missing={t(locale, "network.tdh.verify.tiles.pythonNotRun")}
    />
  );
  const deltaTile = (
    <li key="delta" className={TILE}>
      <p className={TILE_LABEL}>
        {t(locale, "network.tdh.verify.tiles.totalDelta")}
      </p>
      {totalDelta === null ? (
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {liveMissing}
        </p>
      ) : (
        <>
          <p className={TILE_VALUE}>{formatSigned(locale, totalDelta)}</p>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "network.tdh.verify.tiles.deltaNote")}
          </p>
        </>
      )}
    </li>
  );
  const tiles = afterCutover
    ? [pythonTile, ...liveTiles, deltaTile]
    : [...liveTiles, pythonTile, deltaTile];

  return (
    <section aria-labelledby="tdh-verify-tiles-heading" className="tw-mt-8">
      <h2
        id="tdh-verify-tiles-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
      >
        {t(locale, "network.tdh.verify.tiles.heading")}
      </h2>
      {afterCutover && (
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "network.tdh.verify.tiles.publicationCheck")}
          <TdhSource refs={["P53 §4.5"]} locale={locale} />
        </p>
      )}
      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-gap-4 tw-p-0 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        {tiles}
      </ul>
    </section>
  );
}
