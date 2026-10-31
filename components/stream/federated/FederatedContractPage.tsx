"use client";

import Link from "next/link";

import {
  useStream,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import SplitBar from "@/components/stream/diagrams/SplitBar";
import DelistingNotice, {
  shortHex,
} from "@/components/stream/federated/DelistingNotice";
import {
  SaleMethodList,
  SellPanel,
} from "@/components/stream/federated/SaleMethods";
import {
  Facts,
  Loading,
  NotFoundNote,
  PageHeader,
  Section,
  WorkGrid,
} from "@/components/stream/pages/common";
import { AddressChip } from "@/components/stream/ui/AddressChip";
import {
  federatedStatusBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import { STREAM_FOCUS, STREAM_HELP } from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatPercent, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { SPLITS_DENOMINATOR } from "@/lib/stream/constants";
import type {
  Address,
  FederatedContract,
  FederationFactoryInfo,
  StreamArtist,
} from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

function share(locale: SupportedLocale, value: number): string {
  return formatPercent(locale, value / SPLITS_DENOMINATOR, 3);
}

function Mono({ value }: { readonly value: string }) {
  return (
    <span className="tw-font-mono tw-text-xs" title={value}>
      {shortHex(value)}
    </span>
  );
}

/** "Contract" for a single contract; "1/1 contract" or "Editions contract" for a pair's halves. */
function halfLabel(
  locale: SupportedLocale,
  half: FederatedContract,
  paired: boolean
): string {
  if (!paired) {
    return t(locale, "stream.federated.contract.address");
  }
  return half.standard === "ERC721"
    ? t(locale, "stream.federated.contract.oneOfOnes")
    : t(locale, "stream.federated.contract.editions");
}

function codeHashLabel(
  locale: SupportedLocale,
  half: FederatedContract,
  paired: boolean
): string {
  return paired
    ? t(locale, "stream.federated.contract.codeHashOf", {
        form: t(locale, `stream.federated.form.${half.standard}`),
      })
    : t(locale, "stream.federated.contract.codeHash");
}

/** The pair's 721 half first, so both pages of a pair read the same way. */
function halvesOf(
  entry: FederatedContract,
  partner: FederatedContract | null
): readonly FederatedContract[] {
  if (partner === null) {
    return [entry];
  }
  return entry.standard === "ERC721" ? [entry, partner] : [partner, entry];
}

function IdentityFacts({
  entry,
  partner,
  artist,
  locale,
}: {
  readonly entry: FederatedContract;
  readonly partner: FederatedContract | null;
  readonly artist: StreamArtist | null | undefined;
  readonly locale: SupportedLocale;
}) {
  const halves = halvesOf(entry, partner);
  return (
    <Facts
      items={[
        ...halves.map((half) => ({
          label: halfLabel(locale, half, partner !== null),
          value: <AddressChip address={half.address} locale={locale} />,
        })),
        {
          label: t(locale, "stream.federated.contract.artist"),
          value:
            artist === null || artist === undefined ? (
              <Mono value={entry.artistId} />
            ) : (
              <Link
                href={STREAM_ROUTES.artist(artist.artistId)}
                className={`tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
              >
                {artist.displayName}
              </Link>
            ),
        },
        {
          label: t(locale, "stream.federated.contract.owner"),
          value: <AddressChip address={entry.owner} locale={locale} />,
        },
        {
          label: t(locale, "stream.federated.contract.deployed"),
          value: formatUtcDate(locale, entry.deployedAt * 1_000),
        },
        {
          label: t(locale, "stream.federated.contract.deployTx"),
          value: <Mono value={entry.deployTx} />,
        },
      ]}
    />
  );
}

function TemplateFacts({
  entry,
  partner,
  factory,
  locale,
}: {
  readonly entry: FederatedContract;
  readonly partner: FederatedContract | null;
  readonly factory: FederationFactoryInfo | undefined;
  readonly locale: SupportedLocale;
}) {
  const halves = halvesOf(entry, partner);
  return (
    <>
      <Facts
        items={[
          {
            label: t(locale, "stream.federated.contract.templateVersion"),
            value: t(locale, "stream.federated.contract.version", {
              version: formatInteger(locale, entry.templateVersion),
            }),
          },
          ...halves.map((half) => ({
            label: codeHashLabel(locale, half, partner !== null),
            value: <Mono value={half.codeHash} />,
          })),
          {
            label: t(locale, "stream.federated.contract.factory"),
            value: <AddressChip address={entry.factory} locale={locale} />,
          },
          ...(factory === undefined
            ? []
            : [
                {
                  label: t(locale, "stream.federated.contract.registry"),
                  value: (
                    <AddressChip address={factory.registry} locale={locale} />
                  ),
                },
              ]),
        ]}
      />
      <p className={`${STREAM_HELP} tw-mt-3`}>
        {t(locale, "stream.federated.contract.templateNote")}
      </p>
    </>
  );
}

function TermsFacts({
  entry,
  locale,
}: {
  readonly entry: FederatedContract;
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <Facts
        items={[
          {
            label: t(locale, "stream.federated.contract.license"),
            value: entry.defaultLicense,
          },
          {
            label: t(locale, "stream.federated.contract.royalty"),
            value: t(locale, "stream.federated.contract.royaltyValue", {
              rate: share(locale, entry.royaltyRate),
            }),
          },
        ]}
      />
      <div className="tw-mt-4">
        <SplitBar feeShare={entry.feeShare} locale={locale} />
      </div>
    </>
  );
}

function EntryFacts({
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
          label: t(locale, "stream.federated.contract.status"),
          value: (
            <SpecBadge
              spec={federatedStatusBadge(entry.status)}
              locale={locale}
            />
          ),
        },
        {
          label: t(locale, "stream.federated.contract.artistIdentity"),
          value: (
            <SpecBadge
              spec={federatedStatusBadge(
                entry.artistDelisted ? "DELISTED" : "ACTIVE"
              )}
              locale={locale}
            />
          ),
        },
        {
          label: t(locale, "stream.federated.contract.form"),
          value: t(locale, `stream.federated.form.${entry.form}`),
        },
        {
          label: t(locale, "stream.federated.contract.artistId"),
          value: <Mono value={entry.artistId} />,
        },
        {
          label: t(locale, "stream.federated.contract.feeShare"),
          value: share(locale, entry.feeShare),
        },
      ]}
    />
  );
}

/** /stream/federated/[contract]: one registry entry, its terms and its works. */
export function FederatedContractPage({
  address,
}: {
  readonly address: Address;
}) {
  const locale = useBrowserLocale();
  const { account } = useStream();
  const { data: entry } = useStreamQuery(
    "federated-contract",
    [address],
    (source) => source.getFederatedContract(address)
  );
  const partnerAddress = entry?.partner ?? null;
  const { data: partner } = useStreamQuery(
    "federated-contract",
    [partnerAddress],
    (source) =>
      partnerAddress === null
        ? Promise.resolve(null)
        : source.getFederatedContract(partnerAddress)
  );
  const artistId = entry?.artistId ?? null;
  const { data: artist } = useStreamQuery("artist", [artistId], (source) =>
    artistId === null ? Promise.resolve(null) : source.getArtist(artistId)
  );
  const { data: factory } = useStreamQuery("federation-factory", [], (source) =>
    source.federationFactory()
  );
  if (entry === undefined) {
    return <Loading />;
  }
  if (entry === null) {
    return <NotFoundNote locale={locale} />;
  }
  const pair = partner ?? null;
  const works = halvesOf(entry, pair).flatMap((half) => half.works);
  const listed = entry.status === "ACTIVE" && !entry.artistDelisted;
  const isArtist =
    account !== null && account.toLowerCase() === entry.owner.toLowerCase();
  return (
    <div>
      <PageHeader title={entry.name}>
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <SpecBadge
            spec={federatedStatusBadge(listed ? "ACTIVE" : "DELISTED")}
            locale={locale}
          />
          <span className="tw-text-sm tw-text-iron-300">
            {pair === null
              ? entry.symbol
              : `${halvesOf(entry, pair)
                  .map((half) => half.symbol)
                  .join(" · ")}`}{" "}
            · {t(locale, `stream.federated.form.${entry.form}`)}
          </span>
        </div>
        <p className={`${STREAM_HELP} tw-mt-2`}>
          {t(locale, "stream.federated.notCurated")}
        </p>
      </PageHeader>
      <DelistingNotice entry={entry} locale={locale} />
      <Section title={t(locale, "stream.federated.contract.identity")}>
        <IdentityFacts
          entry={entry}
          partner={pair}
          artist={artist}
          locale={locale}
        />
      </Section>
      <Section title={t(locale, "stream.federated.contract.template")}>
        <TemplateFacts
          entry={entry}
          partner={pair}
          factory={factory}
          locale={locale}
        />
      </Section>
      <Section title={t(locale, "stream.federated.contract.terms")}>
        <TermsFacts entry={entry} locale={locale} />
      </Section>
      <Section title={t(locale, "stream.federated.contract.entry")}>
        <EntryFacts entry={entry} locale={locale} />
      </Section>
      <Section title={t(locale, "stream.federated.contract.methods")}>
        <SaleMethodList entry={entry} partner={pair} locale={locale} />
      </Section>
      {listed && isArtist ? (
        <Section title={t(locale, "stream.federated.contract.sell")}>
          <SellPanel
            entry={entry}
            partner={pair}
            owner={entry.owner}
            locale={locale}
          />
        </Section>
      ) : null}
      <Section title={t(locale, "stream.federated.contract.works")}>
        <WorkGrid
          keys={works}
          locale={locale}
          empty={t(locale, "stream.federated.contract.noWorks")}
        />
      </Section>
    </div>
  );
}
