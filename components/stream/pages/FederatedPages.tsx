"use client";

import Link from "next/link";
import { useState } from "react";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import SplitBar from "@/components/stream/diagrams/SplitBar";
import Steps from "@/components/stream/diagrams/Steps";
import TierComparison from "@/components/stream/diagrams/TierComparison";
import DiagramFigure from "@/components/stream/diagrams/DiagramFigure";
import {
  Empty,
  Facts,
  Loading,
  NotFoundNote,
  PageHeader,
  PlaceholderNote,
  Section,
  WorkGrid,
} from "@/components/stream/pages/common";
import { AddressChip } from "@/components/stream/ui/AddressChip";
import GasNote from "@/components/stream/ui/GasNote";
import {
  federatedStatusBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import {
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HELP,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { GAS_ESTIMATES } from "@/lib/stream/gas";
import type { Address, FederatedContract } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

function ContractRow({
  entry,
  locale,
}: {
  readonly entry: FederatedContract;
  readonly locale: SupportedLocale;
}) {
  return (
    <li className={`${STREAM_CARD} tw-flex tw-flex-col tw-gap-2 tw-p-4`}>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <Link
          href={STREAM_ROUTES.federatedContract(entry.address)}
          className={`tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
        >
          {entry.name}
        </Link>
        <SpecBadge spec={federatedStatusBadge(entry.status)} locale={locale} />
      </div>
      <p className={STREAM_HELP}>
        {t(locale, "stream.federated.row", {
          form: t(locale, `stream.federated.form.${entry.form}`),
          symbol: entry.symbol,
          works: formatInteger(locale, entry.works.length),
        })}
      </p>
    </li>
  );
}

/** /stream/federated: the registry directory. Artist-owned, not curated. */
export function FederatedDirectoryPage() {
  const locale = useBrowserLocale();
  const [includeDelisted, setIncludeDelisted] = useState(false);
  const { data: contracts } = useStreamQuery(
    "federated",
    [includeDelisted],
    (source) => source.federatedDirectory({ includeDelisted })
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.federated.title")}
        intro={t(locale, "stream.federated.intro")}
      >
        <p className={`${STREAM_LABEL} tw-mt-3 tw-text-amber-200`}>
          {t(locale, "stream.federated.notCurated")}
        </p>
        <PlaceholderNote locale={locale} />
      </PageHeader>
      <label className="tw-mb-4 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-300">
        <input
          type="checkbox"
          checked={includeDelisted}
          onChange={(event) => setIncludeDelisted(event.target.checked)}
          className="tw-size-4 tw-accent-primary-500"
        />
        {t(locale, "stream.federated.showDelisted")}
      </label>
      {contracts === undefined ? <Loading /> : null}
      {contracts?.length === 0 ? (
        <Empty text={t(locale, "stream.federated.empty")} />
      ) : null}
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2">
        {(contracts ?? []).map((entry) => (
          <ContractRow key={entry.address} entry={entry} locale={locale} />
        ))}
      </ul>
      <Section title={t(locale, "stream.federated.tiers")}>
        <TierComparison locale={locale} highlight="federated" />
      </Section>
    </div>
  );
}

function ContractFacts({
  entry,
  locale,
}: {
  readonly entry: FederatedContract;
  readonly locale: SupportedLocale;
}) {
  return (
    <Facts
      items={[
        {
          label: t(locale, "stream.federated.formLabel"),
          value: t(locale, `stream.federated.form.${entry.form}`),
        },
        { label: t(locale, "stream.federated.symbol"), value: entry.symbol },
        {
          label: t(locale, "stream.federated.template"),
          value: t(locale, "stream.federated.templateVersion", {
            version: formatInteger(locale, entry.templateVersion),
          }),
        },
        {
          label: t(locale, "stream.federated.license"),
          value: entry.defaultLicense,
        },
        {
          label: t(locale, "stream.federated.deployed"),
          value: formatUtcDate(locale, entry.deployedAt * 1_000),
        },
        {
          label: t(locale, "stream.federated.partner"),
          value:
            entry.partner === null ? (
              t(locale, "stream.common.none")
            ) : (
              <AddressChip address={entry.partner} locale={locale} />
            ),
        },
      ]}
    />
  );
}

/** /stream/federated/[contract]: one registry entry and its works. */
export function FederatedContractPage({
  address,
}: {
  readonly address: Address;
}) {
  const locale = useBrowserLocale();
  const { data: entry } = useStreamQuery(
    "federated-contract",
    [address],
    (source) => source.getFederatedContract(address)
  );
  if (entry === undefined) {
    return <Loading />;
  }
  if (entry === null) {
    return <NotFoundNote locale={locale} />;
  }
  return (
    <div>
      <PageHeader title={entry.name}>
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <SpecBadge
            spec={federatedStatusBadge(entry.status)}
            locale={locale}
          />
          <span className={STREAM_LABEL}>
            {t(locale, "stream.federated.notCurated")}
          </span>
        </div>
        <PlaceholderNote locale={locale} />
      </PageHeader>
      {entry.delisting === null ? null : (
        <p
          className={`${STREAM_CARD} tw-m-0 tw-mb-4 tw-p-4 tw-text-sm tw-text-error`}
        >
          {t(locale, "stream.federated.delisted")}
        </p>
      )}
      <Section title={t(locale, "stream.federated.entry")}>
        <ContractFacts entry={entry} locale={locale} />
        <p className={`${STREAM_HELP} tw-mt-3 tw-break-all tw-font-mono`}>
          {t(locale, "stream.federated.codeHash", { hash: entry.codeHash })}
        </p>
      </Section>
      <Section title={t(locale, "stream.federated.split")}>
        <SplitBar feeShare={entry.feeShare} locale={locale} />
      </Section>
      <Section title={t(locale, "stream.federated.works")}>
        <WorkGrid
          keys={entry.works}
          locale={locale}
          empty={t(locale, "stream.federated.noWorks")}
        />
      </Section>
    </div>
  );
}

const LAUNCH_STEPS = [
  "form",
  "identity",
  "details",
  "deploy",
  "registered",
  "sell",
] as const;

/** /stream/launch: the artist's launch wizard for a federated contract (v1.1 design). */
export function LaunchPage() {
  const locale = useBrowserLocale();
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.launch.title")}
        intro={t(locale, "stream.launch.intro")}
      >
        <PlaceholderNote locale={locale} />
      </PageHeader>
      <DiagramFigure caption={t(locale, "stream.launch.caption")}>
        <Steps
          locale={locale}
          label={t(locale, "stream.launch.stepsLabel")}
          steps={LAUNCH_STEPS.map((step) => ({
            title: t(locale, `stream.launch.step.${step}.title`),
            detail: t(locale, `stream.launch.step.${step}.detail`),
          }))}
        />
      </DiagramFigure>
      <Section title={t(locale, "stream.launch.forms")}>
        <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-3">
          {(["ERC721", "ERC1155", "PAIR"] as const).map((form) => (
            <li key={form} className={`${STREAM_CARD} tw-p-4`}>
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
                {t(locale, `stream.federated.form.${form}`)}
              </p>
              <p className={`${STREAM_HELP} tw-mt-1`}>
                {t(locale, `stream.launch.form.${form}`)}
              </p>
              <div className="tw-mt-2">
                <GasNote
                  locale={locale}
                  estimate={
                    form === "PAIR"
                      ? GAS_ESTIMATES.federatedDeployPair
                      : GAS_ESTIMATES.federatedDeploySingle
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
