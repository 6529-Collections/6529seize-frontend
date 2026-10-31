import Link from "next/link";

import {
  useStream,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import { shortHex } from "@/components/stream/federated/DelistingNotice";
import DeployGasTable from "@/components/stream/federated/DeployGasTable";
import {
  editionNameOf,
  editionSymbolOf,
  type LaunchDetails,
  licenseOf,
} from "@/components/stream/federated/launchForm";
import { SellPanel } from "@/components/stream/federated/SaleMethods";
import { Facts, Loading } from "@/components/stream/pages/common";
import { AddressChip } from "@/components/stream/ui/AddressChip";
import GasNote from "@/components/stream/ui/GasNote";
import {
  federatedStatusBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import { STREAM_FOCUS, STREAM_TEXT } from "@/components/stream/ui/styles";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { FederatedDeployResult } from "@/lib/stream/dataSource";
import type { GasEstimate } from "@/lib/stream/gas";
import type { FederatedForm, Hex32, StreamArtist } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

/** The launch wizard's read-only panels: identity, review, registration and the first sale. */

/** What the factory call returned, kept for steps 5 and 6. */
export interface Deployed extends FederatedDeployResult {
  readonly hash: Hex32;
  readonly gas: GasEstimate | null;
}

function ArtistValue({
  artist,
  locale,
}: {
  readonly artist: StreamArtist | null | undefined;
  readonly locale: SupportedLocale;
}) {
  if (artist === undefined) {
    return <span className="tw-text-iron-400">…</span>;
  }
  if (artist === null) {
    return (
      <span className="tw-text-iron-300">
        {t(locale, "stream.launch.identity.new")}
      </span>
    );
  }
  return (
    <Link
      href={STREAM_ROUTES.artist(artist.artistId)}
      className={`tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
    >
      {artist.displayName}
    </Link>
  );
}

/** Step 2: the connected wallet and the artist identity it would register under. */
export function IdentityPanel({
  showError,
  locale,
}: {
  readonly showError: boolean;
  readonly locale: SupportedLocale;
}) {
  const { account } = useStream();
  const { data: artist } = useStreamQuery("artist-of", [account], (source) =>
    account === null ? Promise.resolve(null) : source.artistOf(account)
  );
  if (account === null) {
    return (
      <p
        className={showError ? "tw-m-0 tw-text-sm tw-text-error" : STREAM_TEXT}
        role={showError ? "alert" : undefined}
      >
        {t(locale, "stream.launch.identity.noWallet")}
      </p>
    );
  }
  return (
    <Facts
      items={[
        {
          label: t(locale, "stream.launch.identity.wallet"),
          value: <AddressChip address={account} locale={locale} />,
        },
        {
          label: t(locale, "stream.launch.identity.artist"),
          value: <ArtistValue artist={artist} locale={locale} />,
        },
      ]}
    />
  );
}

/** Step 4: what the factory will deploy, and its labelled gas. */
export function ReviewPanel({
  form,
  details,
  locale,
}: {
  readonly form: FederatedForm;
  readonly details: LaunchDetails;
  readonly locale: SupportedLocale;
}) {
  const { account } = useStream();
  const { data: factory } = useStreamQuery("federation-factory", [], (source) =>
    source.federationFactory()
  );
  if (factory === undefined) {
    return <Loading />;
  }
  const template = factory.templates.find(
    (entry) => entry.standard === (form === "ERC1155" ? "ERC1155" : "ERC721")
  );
  const pairItems =
    form === "PAIR"
      ? [
          {
            label: t(locale, "stream.launch.details.editionName"),
            value: `${editionNameOf(details)} · ${editionSymbolOf(details)}`,
          },
        ]
      : [];
  const walletItems =
    account === null
      ? []
      : [
          {
            label: t(locale, "stream.launch.identity.wallet"),
            value: <AddressChip address={account} locale={locale} />,
          },
        ];
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <Facts
        items={[
          {
            label: t(locale, "stream.federated.contract.form"),
            value: t(locale, `stream.federated.form.${form}`),
          },
          {
            label: t(locale, "stream.launch.details.name"),
            value: `${details.name.trim()} · ${details.symbol.trim()}`,
          },
          ...pairItems,
          {
            label: t(locale, "stream.launch.details.license"),
            value: licenseOf(details),
          },
          ...walletItems,
          {
            label: t(locale, "stream.launch.review.factory"),
            value: <AddressChip address={factory.factory} locale={locale} />,
          },
          {
            label: t(locale, "stream.launch.review.template"),
            value:
              template === undefined
                ? "–"
                : t(locale, "stream.federated.contract.version", {
                    version: formatInteger(locale, template.version),
                  }),
          },
          {
            label: t(locale, "stream.launch.review.split"),
            value: t(locale, "stream.launch.review.splitValue"),
          },
        ]}
      />
      <DeployGasTable
        form={form}
        templates={factory.templates}
        locale={locale}
      />
    </div>
  );
}

function deployedLabel(
  locale: SupportedLocale,
  index: number,
  count: number
): string {
  if (count === 1) {
    return t(locale, "stream.federated.contract.address");
  }
  return index === 0
    ? t(locale, "stream.federated.contract.oneOfOnes")
    : t(locale, "stream.federated.contract.editions");
}

/** Step 5: the registry entry the factory wrote, read back. */
export function RegisteredPanel({
  deployed,
  locale,
}: {
  readonly deployed: Deployed;
  readonly locale: SupportedLocale;
}) {
  const primary = deployed.contracts[0] ?? null;
  const { data: entry } = useStreamQuery(
    "federated-contract",
    [primary],
    (source) =>
      primary === null
        ? Promise.resolve(null)
        : source.getFederatedContract(primary)
  );
  if (entry === undefined || entry === null) {
    return <Loading />;
  }
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div>
        <SpecBadge spec={federatedStatusBadge(entry.status)} locale={locale} />
      </div>
      <Facts
        items={[
          ...deployed.contracts.map((address, index) => ({
            label: deployedLabel(locale, index, deployed.contracts.length),
            value: <AddressChip address={address} locale={locale} />,
          })),
          {
            label: t(locale, "stream.launch.review.split"),
            value: t(locale, "stream.launch.review.splitValue"),
          },
          {
            label: t(locale, "stream.launch.registered.tx"),
            value: (
              <span className="tw-font-mono tw-text-xs" title={deployed.hash}>
                {shortHex(deployed.hash)}
              </span>
            ),
          },
        ]}
      />
      <GasNote estimate={deployed.gas} locale={locale} />
      <Link
        href={STREAM_ROUTES.federatedContract(entry.address)}
        className={`hover:tw-text-primary-200 tw-text-sm tw-text-primary-300 ${STREAM_FOCUS}`}
      >
        {t(locale, "stream.launch.registered.page")}
      </Link>
    </div>
  );
}

/** Step 6: start a sale with one of the new contract's admitted methods. */
export function FirstSalePanel({
  deployed,
  locale,
}: {
  readonly deployed: Deployed;
  readonly locale: SupportedLocale;
}) {
  const first = deployed.contracts[0] ?? null;
  const second = deployed.contracts[1] ?? null;
  const { data: entry } = useStreamQuery(
    "federated-contract",
    [first],
    (source) =>
      first === null
        ? Promise.resolve(null)
        : source.getFederatedContract(first)
  );
  const { data: partner } = useStreamQuery(
    "federated-contract",
    [second],
    (source) =>
      second === null
        ? Promise.resolve(null)
        : source.getFederatedContract(second)
  );
  if (entry === undefined || entry === null || partner === undefined) {
    return <Loading />;
  }
  return (
    <SellPanel
      entry={entry}
      partner={partner}
      owner={entry.owner}
      locale={locale}
    />
  );
}
