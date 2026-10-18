"use client";

import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import type { ApiConsolidatedTdh } from "@/generated/models/ApiConsolidatedTdh";
import { formatDate, formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { VerificationSummary } from "@/lib/tdh/verification/summary.server";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import TdhDisclosure from "./shared/TdhDisclosure";
import { TDH_LINK } from "./shared/tdhStyles";
import TDHProfileHoldings from "./TDHProfileHoldings";
import TdhCopyButton from "./shared/TdhCopyButton";
import {
  formatCycleDate,
  middleTruncate,
} from "./verification/components/verificationFormat";
import TDHSection, { TDH_FOCUS, TDH_PANEL, TDH_TEXT } from "./TDHSection";
import {
  getBoostLabel,
  reconcileTdhProfile,
  tdhProfileSchema,
  type TdhProfile,
} from "./tdh-profile.helpers";

/**
 * The registry's sinks in tdh-v1.4 (P26 §3.4, §10): the zero address and
 * 0x…dead. Their records count in the total but never as participants.
 */
const SINK_ADDRESSES: ReadonlySet<string> = new Set([
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dead",
]);

export default function TDHProfile({
  locale,
  verification = null,
}: {
  readonly locale: SupportedLocale;
  /** The latest daily comparison, to say when this record was reproduced. */
  readonly verification?: VerificationSummary | null;
}) {
  const [input, setInput] = useState("");
  const normalizedInput = input.trim().replace(/^@/, "");
  const [identity, setIdentity] = useState("");
  const query = useQuery({
    queryKey: [QueryKey.TDH_PROFILE_SNAPSHOT, identity],
    queryFn: async ({ signal }) =>
      tdhProfileSchema.parse(
        await commonApiFetch<ApiConsolidatedTdh>({
          endpoint: `tdh/consolidation/${encodeURIComponent(identity)}`,
          signal,
          errorMode: "structured",
          includeWalletAuth: false,
        })
      ),
    enabled: identity.length > 0,
    staleTime: 60_000,
    retry: false,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = normalizedInput;
    if (!value) return;
    if (value === identity) void query.refetch();
    else setIdentity(value);
  }

  return (
    <TDHSection
      id="tdh-profile"
      title={t(locale, "network.tdh.profile.title")}
      description={t(locale, "network.tdh.profile.intro")}
    >
      <div className={`${TDH_PANEL} tw-p-4 sm:tw-p-6`}>
        <form onSubmit={submit}>
          <label
            htmlFor="tdh-profile-input"
            className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {t(locale, "network.tdh.profile.input")}
          </label>
          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-stretch">
            <input
              id="tdh-profile-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              required
              maxLength={200}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t(locale, "network.tdh.profile.placeholder")}
              className={`tw-h-11 tw-min-w-0 tw-flex-none tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-px-3 tw-text-base tw-text-iron-100 placeholder:tw-text-iron-500 sm:tw-flex-1 ${TDH_FOCUS}`}
            />
            <Button
              type="submit"
              size="md"
              className="tw-h-11 tw-shrink-0"
              loading={query.isFetching}
            >
              {t(locale, "network.tdh.profile.submit")}
            </Button>
          </div>
        </form>
        <div aria-live="polite" aria-atomic="true" className="tw-mt-4">
          {!identity && (
            <p className={TDH_TEXT}>{t(locale, "network.tdh.profile.empty")}</p>
          )}
          {query.isFetching && (
            <p className={TDH_TEXT}>
              {t(
                locale,
                query.data && !query.isError
                  ? "network.tdh.profile.refreshing"
                  : "network.tdh.profile.loading"
              )}
            </p>
          )}
          {query.isError && !query.isFetching && (
            <div>
              <p className={TDH_TEXT}>
                {t(
                  locale,
                  getStructuredApiErrorStatus(query.error) === 404
                    ? "network.tdh.profile.notFound"
                    : "network.tdh.profile.error"
                )}
              </p>
              <Button
                variant="tertiary"
                size="sm"
                className="tw-mt-3"
                onClick={() => void query.refetch()}
              >
                {t(locale, "network.tdh.profile.retry")}
              </Button>
            </div>
          )}
          {query.data && !query.isFetching && !query.isError && (
            <p className="tw-sr-only">
              {t(locale, "network.tdh.profile.result", { identity })}:{" "}
              {formatInteger(locale, query.data.boosted_tdh)}
            </p>
          )}
        </div>
        {query.data && !query.isError && (
          <Snapshot
            key={identity}
            profile={query.data}
            identity={identity}
            locale={locale}
            verification={verification}
          />
        )}
      </div>
    </TDHSection>
  );
}

/**
 * Whether the latest daily comparison reproduced this snapshot: the same
 * snapshot block, and every record equal in all three computations.
 */
function reproducedBy(
  profile: TdhProfile,
  verification: VerificationSummary | null
): Extract<VerificationSummary, { kind: "data" }> | null {
  if (
    verification?.kind !== "data" ||
    verification.cutoffBlock !== profile.block ||
    verification.sentence !== "none" ||
    verification.totalsEqual !== true ||
    verification.pythonEqual === null ||
    verification.pythonEqual !== verification.pythonTotal ||
    verification.liveEqual === null ||
    verification.liveEqual !== verification.liveTotal
  ) {
    return null;
  }
  return verification;
}

const ADDRESS = /^0x[0-9a-f]{40}$/i;

/**
 * "TDH for …": a wallet address is shortened in the middle on phones, with a
 * button that copies it in full, so the heading keeps to one line.
 */
function ResultHeading({
  identity,
  locale,
}: {
  readonly identity: string;
  readonly locale: SupportedLocale;
}) {
  const heading = "tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100";
  if (!ADDRESS.test(identity)) {
    return (
      <h3 className={`${heading} tw-break-words`}>
        {t(locale, "network.tdh.profile.result", { identity })}
      </h3>
    );
  }
  return (
    <h3 className={`${heading} tw-flex tw-items-center tw-gap-2`}>
      <span className="tw-min-w-0 sm:tw-hidden">
        {t(locale, "network.tdh.profile.result", {
          identity: middleTruncate(identity, 6),
        })}
      </span>
      <span className="tw-hidden tw-min-w-0 tw-break-all sm:tw-inline">
        {t(locale, "network.tdh.profile.result", { identity })}
      </span>
      <TdhCopyButton
        value={identity}
        label={t(locale, "network.tdh.shared.copyNamed", { name: identity })}
        copiedLabel={t(locale, "network.tdh.shared.copied")}
        failedLabel={t(locale, "network.tdh.shared.copyFailed")}
      />
    </h3>
  );
}

function Snapshot({
  profile,
  identity,
  locale,
  verification,
}: {
  readonly profile: TdhProfile;
  readonly identity: string;
  readonly locale: SupportedLocale;
  readonly verification: VerificationSummary | null;
}) {
  const reconciliation = reconcileTdhProfile(profile);
  const reproduced = reproducedBy(profile, verification);
  const metrics = [
    { key: "raw", value: formatInteger(locale, profile.tdh__raw) },
    { key: "base", value: formatInteger(locale, profile.tdh) },
    {
      key: "boost",
      value: t(locale, "network.tdh.profile.multiplier", {
        value: formatNumber(locale, profile.boost, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }),
    },
  ] as const;
  return (
    <div className="tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-5">
      <ResultHeading identity={identity} locale={locale} />
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-5 tw-text-iron-400">
        {t(locale, "network.tdh.profile.calculated", {
          date: t(locale, "network.tdh.value.utcTime", {
            time: formatDate(locale, profile.date, {
              dateStyle: "medium",
              timeStyle: "short",
              hourCycle: "h23",
              timeZone: "UTC",
            }),
          }),
          block: formatInteger(locale, profile.block),
        })}
      </p>
      <dl className="tw-m-0 tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-3">
        {metrics.map(({ key, value }) => (
          <div key={key}>
            <dt className="tw-text-sm tw-leading-5 tw-text-iron-400">
              {t(locale, `network.tdh.profile.${key}`)}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-break-words tw-font-mono tw-text-lg tw-font-medium tw-text-iron-100">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="tw-mt-5 tw-rounded-lg tw-bg-iron-950 tw-p-4">
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "network.tdh.profile.final")}
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-break-words tw-text-3xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
          {formatInteger(locale, profile.boosted_tdh)}
        </p>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "network.tdh.profile.rate", {
            rate: formatNumber(locale, profile.boosted_tdh_rate, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          })}
        </p>
      </div>
      <p className={`${TDH_TEXT} tw-mt-4`}>
        {t(
          locale,
          reconciliation.matches
            ? "network.tdh.profile.matched"
            : "network.tdh.profile.mismatch"
        )}
      </p>
      {profile.wallets.some((wallet) =>
        SINK_ADDRESSES.has(wallet.toLowerCase())
      ) && (
        <p className={`${TDH_TEXT} tw-mt-3`}>
          {t(locale, "network.tdh.profile.sink")}
        </p>
      )}
      {profile.boosted_tdh === 0 && (
        <p className={`${TDH_TEXT} tw-mt-3`}>
          {t(locale, "network.tdh.profile.zero")}
        </p>
      )}
      {reproduced && (
        <p className="tw-mb-0 tw-mt-3 tw-flex tw-items-start tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-success/30 tw-bg-success/[0.05] tw-px-3 tw-py-2 tw-text-sm tw-leading-6 tw-text-iron-100">
          <CheckBadgeIcon
            aria-hidden="true"
            className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-success"
          />
          <span>
            {t(locale, "network.tdh.profile.reproduced", {
              date: formatCycleDate(locale, reproduced.date),
              identities: formatInteger(locale, reproduced.total ?? 0),
              wallets: formatInteger(locale, reproduced.walletsTotal ?? 0),
            })}{" "}
            <Link
              href={`/network/tdh/verification/${reproduced.cycleDay}`}
              className={TDH_LINK}
            >
              {t(locale, "network.tdh.profile.reproducedLink")}
            </Link>
          </span>
        </p>
      )}
      <TdhDisclosure
        className="tw-mt-4"
        tone="strong"
        summary={t(
          locale,
          profile.wallets.length > 1
            ? "network.tdh.profile.wallets"
            : "network.tdh.profile.walletsOne",
          { count: formatInteger(locale, profile.wallets.length) }
        )}
      >
        <ul className="tw-mb-0 tw-mt-1 tw-space-y-2 tw-pl-6 tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-300">
          {profile.wallets.map((wallet) => (
            <li key={wallet} className="tw-break-all">
              <bdi>{wallet}</bdi>
            </li>
          ))}
        </ul>
      </TdhDisclosure>
      <BoostBreakdown profile={profile} locale={locale} />
      <TDHProfileHoldings profile={profile} locale={locale} />
      <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-leading-5 tw-text-iron-400">
        {t(locale, "network.tdh.profile.storedNote")}{" "}
        {t(locale, "network.tdh.profile.dateNote")}
      </p>
    </div>
  );
}

function BoostBreakdown({
  profile,
  locale,
}: {
  readonly profile: TdhProfile;
  readonly locale: SupportedLocale;
}) {
  const bonuses = Object.entries(profile.boost_breakdown).filter(
    ([, value]) => value.acquired > 0
  );
  return (
    <TdhDisclosure
      tone="strong"
      summary={t(locale, "network.tdh.profile.boostDetails")}
    >
      <dl className="tw-mb-0 tw-mt-3 tw-space-y-3 tw-text-sm">
        <div className="tw-flex tw-justify-between tw-gap-4">
          <dt className="tw-text-iron-300">
            {t(locale, "network.tdh.profile.boostBase")}
          </dt>
          <dd className="tw-m-0 tw-font-mono tw-text-iron-100">
            {formatNumber(locale, 1, { minimumFractionDigits: 2 })}
          </dd>
        </div>
        {bonuses.map(([key, value]) => {
          const label = getBoostLabel(key);
          return (
            <div key={key} className="tw-flex tw-justify-between tw-gap-4">
              <dt className="tw-text-iron-300">
                {label.kind === "season"
                  ? t(locale, "network.tdh.profile.boost.season", {
                      season: formatInteger(locale, label.season),
                    })
                  : t(locale, `network.tdh.profile.boost.${label.label}`)}
              </dt>
              <dd className="tw-m-0 tw-font-mono tw-text-iron-100">
                {t(locale, "network.tdh.profile.bonus", {
                  value: formatNumber(locale, value.acquired, {
                    maximumFractionDigits: 6,
                  }),
                })}
              </dd>
            </div>
          );
        })}
      </dl>
      {!bonuses.length && (
        <p className={`${TDH_TEXT} tw-mt-3`}>
          {t(locale, "network.tdh.profile.boostNone")}
        </p>
      )}
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-5 tw-text-iron-400">
        {t(locale, "network.tdh.profile.boostPrecision")}
      </p>
    </TdhDisclosure>
  );
}
