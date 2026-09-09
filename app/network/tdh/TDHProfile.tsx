"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import type { ApiConsolidatedTdh } from "@/generated/models/ApiConsolidatedTdh";
import { formatDate, formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import TDHProfileHoldings from "./TDHProfileHoldings";
import TDHSection, { TDH_FOCUS, TDH_PANEL, TDH_TEXT } from "./TDHSection";
import {
  getBoostLabel,
  reconcileTdhProfile,
  tdhProfileSchema,
  type TdhProfile,
} from "./tdh-profile.helpers";

export default function TDHProfile({
  locale,
}: {
  readonly locale: SupportedLocale;
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
          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row">
            <input
              id="tdh-profile-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              required
              maxLength={200}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className={`tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-text-base tw-text-iron-100 ${TDH_FOCUS}`}
            />
            <Button
              type="submit"
              size="sm"
              loading={query.isFetching}
              disabled={!normalizedInput}
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
          />
        )}
      </div>
    </TDHSection>
  );
}

function Snapshot({
  profile,
  identity,
  locale,
}: {
  readonly profile: TdhProfile;
  readonly identity: string;
  readonly locale: SupportedLocale;
}) {
  const reconciliation = reconcileTdhProfile(profile);
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
      <h3 className="tw-m-0 tw-break-words tw-text-lg tw-font-semibold tw-text-iron-100">
        {t(locale, "network.tdh.profile.result", { identity })}
      </h3>
      <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "network.tdh.profile.calculated", {
          date: t(locale, "network.tdh.value.utcTime", {
            time: formatDate(locale, profile.date, {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "UTC",
            }),
          }),
          block: formatInteger(locale, profile.block),
        })}
      </p>
      <dl className="tw-m-0 tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-3">
        {metrics.map(({ key, value }) => (
          <div key={key}>
            <dt className="tw-text-xs tw-leading-5 tw-text-iron-400">
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
        <p className="tw-mb-0 tw-mt-2 tw-break-words tw-font-mono tw-text-3xl tw-font-semibold tw-tabular-nums tw-text-iron-50 sm:tw-text-4xl">
          {formatInteger(locale, profile.boosted_tdh)}
        </p>
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "network.tdh.profile.rate", {
            rate: formatNumber(locale, profile.boosted_tdh_rate, {
              maximumFractionDigits: 4,
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
      {profile.boosted_tdh === 0 && (
        <p className={`${TDH_TEXT} tw-mt-3`}>
          {t(locale, "network.tdh.profile.zero")}
        </p>
      )}
      <details className="tw-mt-5">
        <summary
          className={`tw-cursor-pointer tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 ${TDH_FOCUS}`}
        >
          {t(locale, "network.tdh.profile.wallets", {
            count: formatInteger(locale, profile.wallets.length),
          })}
        </summary>
        <ul className="tw-mb-0 tw-mt-2 tw-space-y-2 tw-pl-5 tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-300">
          {profile.wallets.map((wallet) => (
            <li key={wallet} className="tw-break-all">
              <bdi>{wallet}</bdi>
            </li>
          ))}
        </ul>
      </details>
      <BoostBreakdown profile={profile} locale={locale} />
      <TDHProfileHoldings profile={profile} locale={locale} />
      <p className="tw-mb-0 tw-mt-5 tw-text-xs tw-leading-5 tw-text-iron-400">
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
    <details className="tw-mt-2">
      <summary
        className={`tw-cursor-pointer tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 ${TDH_FOCUS}`}
      >
        {t(locale, "network.tdh.profile.boostDetails")}
      </summary>
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
      <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "network.tdh.profile.boostPrecision")}
      </p>
    </details>
  );
}
