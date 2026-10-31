"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  useStream,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import { AddressChip, ArtistChip } from "@/components/stream/ui/AddressChip";
import {
  SpecBadge,
  storageBadge,
  variantBadge,
} from "@/components/stream/ui/StatusBadge";
import { STREAM_FOCUS } from "@/components/stream/ui/styles";
import FactTable, { type FactRow } from "@/components/stream/work/FactTable";
import { sameAddress } from "@/components/stream/work/english/context";
import KnownAddress from "@/components/stream/work/KnownAddress";
import StreamTime from "@/components/stream/work/StreamTime";
import {
  type AddressLabeler,
  useAddressLabels,
} from "@/components/stream/work/useAddressLabels";
import { formatInteger, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { SPLITS_DENOMINATOR } from "@/lib/stream/constants";
import { locatorDisplayUrl } from "@/lib/stream/media";
import type {
  EditionAuction,
  FederatedContract,
  MediaFileView,
  OneOfOneAuction,
  SaleRef,
  StreamContracts,
  StreamWork,
  WorkKey,
} from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

const LINK = `tw-text-primary-300 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`;
const MONO = "tw-break-all tw-font-mono tw-text-xs";
const NONE = "stream.common.none";

/** Everything the facts read besides the work itself. */
interface FactsContext {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
  readonly label: AddressLabeler;
  readonly contracts: StreamContracts | null;
  /** The data is the mock's generated sample art. */
  readonly mock: boolean;
  readonly auction: OneOfOneAuction | null;
  readonly editionAuction: EditionAuction | null;
  readonly federated: FederatedContract | null;
  readonly linked: StreamWork | null;
}

function short(hex: string): string {
  return hex.length > 14 ? `${hex.slice(0, 8)}…${hex.slice(-6)}` : hex;
}

function Line({ children }: { readonly children: ReactNode }) {
  return (
    <span className="tw-block tw-text-xs tw-text-iron-400">{children}</span>
  );
}

// ---------------------------------------------------------------------------
// The token: what it is, who issued it, where it links, who owns it, its sale
// ---------------------------------------------------------------------------

function contractName(context: FactsContext): ReactNode {
  const { work, contracts, federated, locale } = context;
  if (federated !== null) {
    return (
      <Link
        href={STREAM_ROUTES.federatedContract(federated.address)}
        className={LINK}
      >
        {t(locale, "stream.workFacts.contract.federated", {
          name: federated.name,
          symbol: federated.symbol,
        })}
      </Link>
    );
  }
  const isEditions =
    contracts !== null && sameAddress(work.token, contracts.editions);
  return t(
    locale,
    isEditions
      ? "stream.workFacts.contract.editions"
      : "stream.workFacts.contract.stream"
  );
}

function issuer(context: FactsContext): ReactNode {
  const { work, locale } = context;
  if (work.program === "canonical") {
    return t(locale, "stream.workFacts.issuer.canonical");
  }
  const lead = work.parties[0];
  return (
    <>
      {lead === undefined ? null : (
        <ArtistChip
          artistId={lead.artistId}
          name={lead.displayName}
          locale={locale}
        />
      )}
      <Line>{t(locale, "stream.workFacts.issuer.federated")}</Line>
    </>
  );
}

function artists(context: FactsContext): ReactNode {
  const { work, locale } = context;
  return (
    <span className="tw-flex tw-flex-col tw-gap-1">
      {work.parties.map((party) => (
        <span key={party.artistId} className="tw-flex tw-flex-wrap tw-gap-x-2">
          <ArtistChip
            artistId={party.artistId}
            name={party.displayName}
            locale={locale}
          />
          {party.role === "COLLABORATOR" ? (
            <span className="tw-text-xs tw-text-iron-400">
              {t(locale, "stream.workFacts.collaborator")}
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

function linkedValue(context: FactsContext): ReactNode {
  const { work, linked, locale } = context;
  const key: WorkKey | null = work.linked.edition ?? work.linked.master;
  if (key === null) {
    return t(locale, "stream.workFacts.linked.none");
  }
  const isEditions = work.linked.edition !== null;
  const name =
    linked === null
      ? key
      : t(locale, "stream.workFacts.linked.token", {
          name: t(locale, variantBadge(linked.variant).label),
          id: formatInteger(locale, linked.tokenId),
        });
  return (
    <>
      <Line>
        {t(
          locale,
          isEditions
            ? "stream.workFacts.linked.editions"
            : "stream.workFacts.linked.master"
        )}
      </Line>
      <Link href={STREAM_ROUTES.work(key)} className={LINK}>
        {name}
      </Link>
    </>
  );
}

function ownerValue(context: FactsContext): ReactNode {
  const { work, locale, label, contracts, auction } = context;
  if (work.burned) {
    return t(locale, "stream.workFacts.owner.burned");
  }
  if (work.owner === null) {
    return t(locale, "stream.workFacts.owner.none");
  }
  const inCustody =
    contracts !== null && sameAddress(work.owner, contracts.englishAuction);
  const winner = auction?.pendingDelivery ?? null;
  if (inCustody && winner !== null) {
    return (
      <>
        <Line>{t(locale, "stream.workFacts.owner.pending")}</Line>
        <KnownAddress address={winner} label={label} locale={locale} />
      </>
    );
  }
  if (inCustody) {
    return t(locale, "stream.workFacts.owner.custody");
  }
  return <KnownAddress address={work.owner} label={label} locale={locale} />;
}

function supplyKey(context: FactsContext): MessageKey {
  const { editionAuction } = context;
  if (editionAuction?.phase === "void") {
    return "stream.workFacts.supply.void";
  }
  if (editionAuction?.settled === true) {
    return editionAuction.clearing.count === 0
      ? "stream.workFacts.supply.noBids"
      : "stream.workFacts.supply.sold";
  }
  return "stream.workFacts.supply.notYet";
}

function supplyValue(context: FactsContext): string {
  const { work, editionAuction, locale } = context;
  return t(locale, supplyKey(context), {
    count: formatInteger(locale, editionAuction?.clearing.count ?? 0),
    minted: formatInteger(locale, work.editionSupply ?? 0),
  });
}

function capValue(context: FactsContext): string {
  const { editionAuction, locale } = context;
  if (editionAuction === null) {
    return t(locale, NONE);
  }
  return editionAuction.terms.cap === 0
    ? t(locale, "stream.sale.edition.noCap")
    : formatInteger(locale, editionAuction.terms.cap);
}

function saleKindLabel(locale: SupportedLocale, sale: SaleRef): string {
  switch (sale.kind) {
    case "ENGLISH_AUCTION":
      return t(locale, "stream.sale.kind.english");
    case "UNIFORM_AUCTION":
      return t(locale, "stream.sale.kind.edition");
    default:
      return t(locale, "stream.workFacts.sale.unknown", { kind: sale.kind });
  }
}

function saleValue(context: FactsContext): ReactNode {
  const { work, locale } = context;
  if (work.sale === null) {
    return t(locale, NONE);
  }
  return (
    <>
      {saleKindLabel(locale, work.sale)}
      <Line>
        {t(locale, "stream.workFacts.sale.id", { id: short(work.sale.saleId) })}
      </Line>
      <AddressChip address={work.sale.adapter} locale={locale} />
    </>
  );
}

function tokenRows(context: FactsContext): FactRow[] {
  const { work, locale } = context;
  const isEdition = work.standard === "ERC1155";
  const rows: FactRow[] = [
    {
      key: "what",
      label: t(locale, "stream.workFacts.whatLabel"),
      value: t(locale, `stream.workFacts.what.${work.variant}`),
    },
    {
      key: "issuer",
      label: t(locale, "stream.workFacts.issuerLabel"),
      value: issuer(context),
    },
    {
      key: "contract",
      label: t(locale, "stream.workFacts.contractLabel"),
      value: (
        <>
          {contractName(context)}
          <Line>
            {t(locale, "stream.workFacts.tokenId", {
              id: formatInteger(locale, work.tokenId),
            })}
          </Line>
          <AddressChip address={work.token} locale={locale} />
        </>
      ),
    },
    {
      key: "artists",
      label: t(locale, "stream.workFacts.artists"),
      value: artists(context),
    },
    {
      key: "collection",
      label: t(locale, "stream.work.collection"),
      value: work.collection
        ? t(locale, "stream.work.collectionSerial", {
            name: work.collection.name,
            serial: formatInteger(locale, work.collection.serial),
          })
        : t(locale, NONE),
    },
    {
      key: "linked",
      label: t(locale, "stream.workFacts.linkedLabel"),
      value: linkedValue(context),
    },
  ];
  if (isEdition) {
    rows.push(
      {
        key: "supply",
        label: t(locale, "stream.workFacts.supplyLabel"),
        value: supplyValue(context),
      },
      {
        key: "cap",
        label: t(locale, "stream.workFacts.cap"),
        value: capValue(context),
      }
    );
  } else {
    rows.push({
      key: "owner",
      label: t(locale, "stream.workFacts.ownerLabel"),
      value: ownerValue(context),
    });
  }
  rows.push(
    {
      key: "sale",
      label: t(locale, "stream.workFacts.saleLabel"),
      value: saleValue(context),
    },
    {
      key: "minted",
      label: t(locale, "stream.work.minted"),
      value:
        work.mintedAt === null ? (
          t(locale, "stream.workFacts.notMinted")
        ) : (
          <StreamTime seconds={work.mintedAt} locale={locale} />
        ),
    }
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Media and storage: the files, their copies, the record
// ---------------------------------------------------------------------------

function fileText(locale: SupportedLocale, file: MediaFileView): string {
  return t(locale, "stream.workFacts.file", {
    type: file.contentType,
    size: formatInteger(locale, Math.max(1, Math.round(file.bytes / 1_024))),
  });
}

function LocatorValue({
  file,
  index,
  locale,
}: {
  readonly file: MediaFileView;
  readonly index: number;
  readonly locale: SupportedLocale;
}) {
  const locator = file.locators[index];
  if (locator === undefined) {
    return null;
  }
  const url = locatorDisplayUrl(locator);
  return (
    <>
      {url === null ? (
        <span className="tw-text-iron-200">
          {t(locale, "stream.locator.onChainCopy")}
        </span>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${MONO} tw-text-iron-200 hover:tw-text-iron-50 ${STREAM_FOCUS}`}
        >
          {locator.uri}
        </a>
      )}
      {index === file.preferred ? (
        <Line>{t(locale, "stream.workFacts.served")}</Line>
      ) : null}
    </>
  );
}

function recordValue(context: FactsContext): string {
  const { work, locale } = context;
  if (work.record === null) {
    return t(locale, "stream.work.recordNotOpen");
  }
  return t(
    locale,
    work.record.finalized
      ? "stream.workFacts.record.finalized"
      : "stream.workFacts.record.open",
    { version: formatInteger(locale, work.record.version) }
  );
}

function mediaRows(context: FactsContext): FactRow[] {
  const { work, locale } = context;
  const primary = work.media.find((file) => file.role === "PRIMARY");
  const preview = work.media.find((file) => file.role === "PREVIEW");
  const rows: FactRow[] = [
    {
      key: "art",
      label: t(locale, "stream.workFacts.art"),
      value:
        primary === undefined ? (
          t(locale, "stream.work.recordNotOpen")
        ) : (
          <>
            {fileText(locale, primary)}
            {context.mock ? (
              <Line>{t(locale, "stream.workFacts.generated")}</Line>
            ) : null}
          </>
        ),
    },
    {
      key: "storage",
      label: t(locale, "stream.workFacts.storageLabel"),
      value: (
        <>
          <SpecBadge spec={storageBadge(work.storage)} locale={locale} />
          <Line>{t(locale, `stream.workFacts.storage.${work.storage}`)}</Line>
        </>
      ),
    },
  ];
  primary?.locators.forEach((locator, index) => {
    rows.push({
      key: `copy-${locator.kind}`,
      label: t(locale, `stream.locator.${locator.kind}`),
      value: <LocatorValue file={primary} index={index} locale={locale} />,
    });
  });
  if (preview !== undefined) {
    rows.push({
      key: "preview",
      label: t(locale, "stream.workFacts.preview"),
      value: fileText(locale, preview),
    });
  }
  if (primary !== undefined) {
    rows.push({
      key: "hash",
      label: t(locale, "stream.workFacts.hash"),
      value: (
        <span className={MONO} title={primary.sha256}>
          {short(primary.sha256)}
        </span>
      ),
    });
  }
  rows.push(
    {
      key: "record",
      label: t(locale, "stream.work.record"),
      value: recordValue(context),
    },
    {
      key: "seed",
      label: t(locale, "stream.work.seed"),
      value: t(locale, `stream.work.seedPolicy.${work.seed.policy}`),
    }
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Rights and money: license, splits, royalty, wallets, disputes
// ---------------------------------------------------------------------------

function licenseValue(context: FactsContext): ReactNode {
  const { work, locale } = context;
  if (work.license === null) {
    return t(locale, "stream.work.recordNotOpen");
  }
  const { spdxId, url, irrevocable } = work.license;
  let note: MessageKey = "stream.workFacts.license.revocable";
  if (irrevocable) {
    note = "stream.workFacts.license.irrevocable";
  } else if (url === null) {
    note = "stream.workFacts.license.custom";
  }
  return (
    <>
      {url === null ? (
        spdxId
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK}
        >
          {spdxId}
        </a>
      )}
      <Line>{t(locale, note)}</Line>
    </>
  );
}

function splitText(context: FactsContext): string {
  const { work, locale } = context;
  const fee = work.economics.feeShare;
  return t(locale, "stream.workFacts.splitValue", {
    artist: formatPercent(
      locale,
      (SPLITS_DENOMINATOR - fee) / SPLITS_DENOMINATOR,
      1
    ),
    network: formatPercent(locale, fee / SPLITS_DENOMINATOR, 1),
  });
}

function rightsRows(context: FactsContext): FactRow[] {
  const { work, locale, label } = context;
  const { economics } = work;
  return [
    {
      key: "license",
      label: t(locale, "stream.work.license"),
      value: licenseValue(context),
    },
    {
      key: "split",
      label: t(locale, "stream.workFacts.splitLabel"),
      value: (
        <>
          <span className="tw-block">{splitText(context)}</span>
          <KnownAddress
            address={economics.seller}
            label={label}
            locale={locale}
          />
        </>
      ),
    },
    {
      key: "royalty",
      label: t(locale, "stream.workFacts.royaltyLabel"),
      value: (
        <>
          {t(locale, "stream.workFacts.royaltyValue", {
            rate: formatPercent(
              locale,
              economics.royaltyRate / SPLITS_DENOMINATOR,
              3
            ),
          })}
          <Line>{splitText(context)}</Line>
          <AddressChip address={economics.royaltyReceiver} locale={locale} />
        </>
      ),
    },
    {
      key: "dispute",
      label: t(locale, "stream.workFacts.dispute"),
      value:
        work.dispute.latestOutcome === null ? (
          t(locale, NONE)
        ) : (
          <span className={MONO} title={work.dispute.latestOutcome}>
            {short(work.dispute.latestOutcome)}
          </span>
        ),
    },
  ];
}

/**
 * The work's facts in three compact tables: the token, its media and storage,
 * and its rights and money. Every variant fills the same rows, so a canonical
 * 1/1, an edition and a federated token read side by side.
 */
export default function WorkFacts({
  work,
  locale,
}: {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
}) {
  const { client } = useStream();
  const deployment = client?.dataSource.source() ?? null;
  const contracts = deployment?.contracts ?? null;
  const label = useAddressLabels(locale, work.parties);
  const isEdition = work.standard === "ERC1155";
  const linkedKey = work.linked.edition ?? work.linked.master;
  const federatedAddress = work.federated?.contract ?? null;
  const { data: auction = null } = useStreamQuery(
    "auction-for-work",
    [work.key],
    (source) =>
      isEdition ? Promise.resolve(null) : source.auctionForWork(work.key)
  );
  const { data: editionAuction = null } = useStreamQuery(
    "edition-auction",
    [work.key],
    (source) =>
      isEdition ? source.getEditionAuction(work.key) : Promise.resolve(null)
  );
  const { data: federated = null } = useStreamQuery(
    "federated-contract",
    [federatedAddress],
    (source) =>
      federatedAddress === null
        ? Promise.resolve(null)
        : source.getFederatedContract(federatedAddress)
  );
  const { data: linked = null } = useStreamQuery(
    "work",
    [linkedKey],
    (source) =>
      linkedKey === null ? Promise.resolve(null) : source.getWork(linkedKey)
  );
  const context: FactsContext = {
    work,
    locale,
    label,
    contracts,
    mock: deployment?.kind === "mock",
    auction,
    editionAuction,
    federated,
    linked,
  };
  return (
    <div className="tw-grid tw-items-start tw-gap-6 lg:tw-grid-cols-2">
      <FactTable
        caption={t(locale, "stream.workFacts.token")}
        rows={tokenRows(context)}
      />
      <div className="tw-flex tw-flex-col tw-gap-6">
        <FactTable
          caption={t(locale, "stream.workFacts.media")}
          rows={mediaRows(context)}
        />
        <FactTable
          caption={t(locale, "stream.workFacts.rights")}
          rows={rightsRows(context)}
        />
      </div>
    </div>
  );
}
