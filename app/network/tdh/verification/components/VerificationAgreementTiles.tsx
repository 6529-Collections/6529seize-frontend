import { CheckCircleIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { selectPluralCategory } from "@/i18n/format";
import type { VerificationAgreement } from "@/lib/tdh/verification/schema";
import { agreementShare } from "@/lib/tdh/verification/states";
import TdhSource from "../../shared/TdhSource";
import { TDH_CARD } from "../../shared/tdhStyles";
import { formatInteger, formatShare, formatSigned } from "./verificationFormat";

const TILE = `${TDH_CARD} tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-p-5`;
const TILE_LABEL = "tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400";
const TILE_VALUE =
  "tw-m-0 tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight";

/**
 * One agreement count. Agreement is usually above 99.9%, which no bar can
 * show honestly, so the tile leads with how many records differ and gives
 * the equal count and share in words.
 */
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
  if (equal === null || total === null) {
    return (
      <li className={TILE}>
        <p className={TILE_LABEL}>{label}</p>
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {missing}
        </p>
      </li>
    );
  }
  const differ = total - equal;
  const plural =
    selectPluralCategory(locale, differ) === "one" ? "one" : "other";
  return (
    <li className={TILE}>
      <p className={TILE_LABEL}>{label}</p>
      {differ === 0 ? (
        <p
          className={`${TILE_VALUE} tw-flex tw-items-center tw-gap-2 tw-text-success`}
        >
          <CheckCircleIcon aria-hidden="true" className="tw-size-6" />
          {t(locale, "network.tdh.verify.tiles.allEqual")}
        </p>
      ) : (
        <p className={`${TILE_VALUE} tw-text-amber-200`}>
          {t(
            locale,
            `network.tdh.verify.tiles.differ.${plural}` as MessageKey,
            { count: formatInteger(locale, differ) }
          )}
        </p>
      )}
      <p className="tw-m-0 tw-text-sm tw-tabular-nums tw-leading-5 tw-text-iron-300">
        {t(locale, "network.tdh.verify.tiles.equalOf", {
          equal: formatInteger(locale, equal),
          total: formatInteger(locale, total),
        })}
        {" · "}
        {formatShare(locale, agreementShare(equal, total) ?? 0)}
      </p>
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
  let deltaWords: string | null = null;
  if (totalDelta !== null) {
    if (totalDelta === 0) {
      deltaWords = t(locale, "network.tdh.verify.tiles.totalsEqual");
    } else {
      deltaWords = t(
        locale,
        totalDelta < 0
          ? "network.tdh.verify.tiles.liveHigher"
          : "network.tdh.verify.tiles.liveLower",
        { amount: formatInteger(locale, Math.abs(totalDelta)) }
      );
    }
  }
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
          <p
            className={`${TILE_VALUE} ${totalDelta === 0 ? "tw-text-success" : "tw-text-iron-50"}`}
          >
            {formatSigned(locale, totalDelta)}
          </p>
          <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-300">
            {deltaWords}
          </p>
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
