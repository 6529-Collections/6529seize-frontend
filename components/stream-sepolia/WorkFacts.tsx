"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Address, Hex } from "viem";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";
import { getStreamInstance } from "@/lib/stream/instances";
import { readWorkPageFacts, type WorkPageFacts } from "@/lib/stream/workPage";

import { formatCount, sepoliaAddressUrl, shortAddress } from "./format";
import { CARD, LABEL } from "./OneOfOnePanel";
import { StreamIdentity } from "./StreamIdentity";

const LINK = "tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400";

function Hash({ value }: { readonly value: Hex }) {
  return (
    <span title={value} className="tw-break-all tw-font-mono tw-text-xs tw-text-iron-200">
      {`${value.slice(0, 10)}…${value.slice(-8)}`}
    </span>
  );
}

function Row({ term, children }: { readonly term: string; readonly children: ReactNode }) {
  return (
    <div className="tw-contents">
      <dt className="tw-text-iron-500">{term}</dt>
      <dd className="tw-m-0 tw-min-w-0 tw-text-iron-100">{children}</dd>
    </div>
  );
}

/** Where a card's facts were read: contract, function, address and the Solidity source. */
function Source({ source }: { readonly source: WorkPageFacts["sources"]["work"] }) {
  const locale = useBrowserLocale();
  return (
    <p className="tw-m-0 tw-mt-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-3 tw-text-xs tw-text-iron-500">
      {t(locale, "streamSepolia.facts.readFrom", { contract: source.contract, reads: source.reads })}{" "}
      <a href={sepoliaAddressUrl(source.address)} target="_blank" rel="noreferrer" className={LINK}>
        {shortAddress(source.address)}
      </a>
      {" · "}
      <a href={source.url} target="_blank" rel="noreferrer" className={LINK}>
        {t(locale, "streamSepolia.facts.source")}
      </a>
    </p>
  );
}

function FactCard({
  title,
  source,
  children,
}: {
  readonly title: string;
  readonly source: WorkPageFacts["sources"]["work"];
  readonly children: ReactNode;
}) {
  return (
    <section className={CARD} aria-label={title}>
      <h3 className={`${LABEL} tw-mb-3`}>{title}</h3>
      <dl className="tw-m-0 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-4 tw-gap-y-2 tw-text-sm">{children}</dl>
      <Source source={source} />
    </section>
  );
}

const OUTCOME_KEYS: Record<WorkPageFacts["firstSale"], MessageKey> = {
  none: "streamSepolia.facts.outcome.none",
  sold: "streamSepolia.facts.outcome.sold",
  unsold: "streamSepolia.facts.outcome.unsold",
  rescued: "streamSepolia.facts.outcome.rescued",
  unknown: "streamSepolia.facts.outcome.unknown",
};

const CHECK_KEYS: Record<WorkPageFacts["files"][number]["check"], MessageKey> = {
  verified: "streamSepolia.facts.check.verified",
  notStored: "streamSepolia.facts.check.notStored",
  incomplete: "streamSepolia.facts.check.incomplete",
  mismatch: "streamSepolia.facts.check.mismatch",
  unread: "streamSepolia.facts.check.unread",
};

function percent(value: number, locale: ReturnType<typeof useBrowserLocale>): string {
  return `${formatCount(Math.round(value * 1000) / 1000, locale)}%`;
}

function licenseText(license: WorkPageFacts["license"], locale: ReturnType<typeof useBrowserLocale>): string {
  if (!license) return t(locale, "streamSepolia.facts.licenseNone");
  const key = license.locked ? "streamSepolia.facts.licenseLocked" : "streamSepolia.facts.licenseOpen";
  return t(locale, key, { spdx: license.spdxId });
}

function AddressLink({ address }: { readonly address: Address }) {
  return (
    <a href={sepoliaAddressUrl(address)} target="_blank" rel="noreferrer" className={LINK}>
      {shortAddress(address)}
    </a>
  );
}

/** The permanent facts the chain holds about a work: identity, files, record, licence and money. */
export function WorkFacts({
  token,
  tokenId,
  firstStartTx,
  curated,
}: {
  readonly token: Address;
  readonly tokenId: bigint;
  readonly firstStartTx: Hex | null;
  readonly curated: boolean;
}) {
  const locale = useBrowserLocale();
  const facts = useQuery({
    queryKey: [QueryKey.STREAM_SEPOLIA, getStreamInstance().name, "workFacts", token.toLowerCase(), tokenId.toString()],
    queryFn: () => readWorkPageFacts({ token, tokenId, firstStartTx, curated }),
    staleTime: 60_000,
  });
  if (!facts.data) return null;
  const data = facts.data;
  const yes = t(locale, "streamSepolia.facts.yes");
  const no = t(locale, "streamSepolia.facts.no");
  return (
    <section aria-labelledby="stream-facts" className="tw-mt-10">
      <h2 id="stream-facts" className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        {t(locale, "streamSepolia.facts.title")}
      </h2>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.facts.intro")}</p>
      <div className="tw-mt-4 tw-grid tw-gap-4 md:tw-grid-cols-2">
        <FactCard title={t(locale, "streamSepolia.facts.work")} source={data.sources.work}>
          <Row term={t(locale, "streamSepolia.facts.itemHash")}>
            <Hash value={data.itemHash} />
          </Row>
          <Row term={t(locale, "streamSepolia.facts.collection")}>
            {t(locale, "streamSepolia.facts.collectionValue", { id: data.collection.id.toString(), name: data.collection.name })}
          </Row>
          <Row term={t(locale, "streamSepolia.facts.serial")}>{formatCount(data.serial, locale)}</Row>
          <Row term={t(locale, "streamSepolia.facts.kind")}>
            {data.editionMaster ? t(locale, "streamSepolia.facts.kindMaster") : t(locale, "streamSepolia.facts.kindOriginal")}
          </Row>
          <Row term={t(locale, "streamSepolia.facts.firstSale")}>{t(locale, OUTCOME_KEYS[data.firstSale])}</Row>
        </FactCard>
        <FactCard title={t(locale, "streamSepolia.facts.files")} source={data.sources.files}>
          {data.files.length === 0 ? (
            <Row term="">{t(locale, "streamSepolia.facts.noFiles")}</Row>
          ) : (
            data.files.map((file) => (
              <Row key={file.fileId} term={t(locale, `streamSepolia.facts.role.${file.role}`)}>
                <span className="tw-block">
                  {file.mimeType} · {t(locale, "streamSepolia.facts.size", { kb: formatCount(Math.ceil(Number(file.length) / 1024), locale) })}
                </span>
                <span className="tw-block">
                  {t(locale, "streamSepolia.facts.sha256")} <Hash value={file.sha256} />
                </span>
                <span className={`tw-block tw-text-xs ${file.check === "mismatch" ? "tw-text-red" : "tw-text-iron-400"}`}>
                  {t(locale, CHECK_KEYS[file.check])}
                </span>
              </Row>
            ))
          )}
        </FactCard>
        <FactCard title={t(locale, "streamSepolia.facts.recordTitle")} source={data.sources.record}>
          <Row term={t(locale, "streamSepolia.facts.recordOpened")}>{data.record.opened ? yes : no}</Row>
          <Row term={t(locale, "streamSepolia.facts.recordFinalized")}>{data.record.finalized ? yes : no}</Row>
          <Row term={t(locale, "streamSepolia.facts.onChainComplete")}>{data.record.onChainComplete ? yes : no}</Row>
          <Row term={t(locale, "streamSepolia.facts.license")}>{licenseText(data.license, locale)}</Row>
        </FactCard>
        <FactCard title={t(locale, "streamSepolia.facts.money")} source={data.sources.split}>
          <Row term={t(locale, "streamSepolia.facts.royalty")}>
            {t(locale, data.royalty.locked ? "streamSepolia.facts.royaltyLocked" : "streamSepolia.facts.royaltyOpen", {
              percent: percent(data.royalty.percent, locale),
            })}
          </Row>
          <Row term={t(locale, "streamSepolia.facts.royaltyTo")}>
            <StreamIdentity address={data.royalty.receiver} />
          </Row>
          {data.split ? (
            <>
              <Row term={t(locale, "streamSepolia.facts.vault")}>
                <AddressLink address={data.split.vault} />
              </Row>
              {data.split.payees.map((payee) => (
                <Row key={`${payee.artistId}-${payee.account}`} term={t(locale, "streamSepolia.facts.payee")}>
                  <span className="tw-block">
                    {t(locale, "streamSepolia.facts.payeeValue", { percent: percent(payee.percent, locale) })}{" "}
                    <StreamIdentity address={payee.wallet} />
                  </span>
                  <span className="tw-block tw-text-xs tw-text-iron-500">
                    {t(locale, "streamSepolia.facts.artistId")}{" "}
                    <Hash value={`0x${payee.artistId.toString(16).padStart(40, "0")}`} />
                  </span>
                </Row>
              ))}
            </>
          ) : (
            <Row term={t(locale, "streamSepolia.facts.vault")}>{t(locale, "streamSepolia.facts.splitUnknown")}</Row>
          )}
        </FactCard>
      </div>
    </section>
  );
}
