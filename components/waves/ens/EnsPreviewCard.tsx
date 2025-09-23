"use client";

import Image from "next/image";
import Link from "next/link";

import { formatAddress } from "@/helpers/Helpers";
import type { ReactElement } from "react";

import {
  type EnsAddressPreview,
  type EnsContenthash,
  type EnsContentPreview,
  type EnsLinks,
  type EnsNamePreview,
  type EnsPreview,
} from "./types";

type RecordKey = keyof EnsNamePreview["records"];
const RECORD_LABELS: Readonly<Record<RecordKey, string>> = {
  url: "Website",
  email: "Email",
  "com.twitter": "Twitter",
  "org.telegram": "Telegram",
  "com.github": "GitHub",
  description: "Description",
};

const formatTimestamp = (value: number | null): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const renderAvatar = (url: string | null, alt: string): ReactElement | null => {
  if (!url) {
    return null;
  }

  return (
    <div className="tw-relative tw-h-14 tw-w-14 tw-overflow-hidden tw-rounded-xl tw-bg-iron-800/60">
      <Image
        src={url}
        alt={alt}
        width={112}
        height={112}
        className="tw-h-full tw-w-full tw-object-cover"
        unoptimized
      />
    </div>
  );
};

const renderLink = (
  href: string | undefined,
  label: string
): ReactElement | null => {
  if (!href) {
    return null;
  }

  return (
    <Link
      key={label}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition-colors hover:tw-text-primary-100">
      {label}
    </Link>
  );
};

const renderContenthash = (
  contenthash: EnsContenthash | null,
  links: EnsLinks
): ReactElement | null => {
  if (!contenthash) {
    return null;
  }

  const { protocol, decoded, gatewayUrl } = contenthash;

  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
        Contenthash
      </span>
      <span className="tw-text-sm tw-text-iron-100">
        {protocol === "other" ? "Other" : protocol.toUpperCase()}
      </span>
      {decoded && (
        <span className="tw-break-all tw-text-xs tw-text-iron-300">
          {decoded}
        </span>
      )}
      {gatewayUrl && renderLink(links.open ?? gatewayUrl, "Open content")}
    </div>
  );
};

const renderRecords = (
  records: EnsNamePreview["records"]
): ReactElement | null => {
  const entries = (Object.keys(RECORD_LABELS) as RecordKey[])
    .map((key) => {
      const label = RECORD_LABELS[key];
      const value = records[key];
      if (!value) {
        return null;
      }
      if (key === "url") {
        return (
          <li key={key} className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
              {label}
            </span>
            <Link
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-break-all tw-text-sm tw-text-primary-300 tw-transition-colors hover:tw-text-primary-100">
              {value}
            </Link>
          </li>
        );
      }

      return (
        <li key={key} className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
            {label}
          </span>
          <span className="tw-break-words tw-text-sm tw-text-iron-200">
            {value}
          </span>
        </li>
      );
    })
    .filter(Boolean) as ReactElement[];

  if (entries.length === 0) {
    return null;
  }

  return <ul className="tw-grid tw-gap-3 md:tw-grid-cols-2">{entries}</ul>;
};

const renderOwnership = (
  ownership: EnsNamePreview["ownership"]
): ReactElement | null => {
  const { registryOwner, registrant, isWrapped, expiry, gracePeriodEnds } =
    ownership;

  if (!registryOwner && !registrant && !expiry && !isWrapped) {
    return null;
  }

  const rows: Array<{ label: string; value: string }> = [];

  rows.push({ label: "Wrapped", value: isWrapped ? "Yes" : "No" });

  if (registryOwner) {
    rows.push({ label: "Registry owner", value: formatAddress(registryOwner) });
  }

  if (registrant) {
    rows.push({ label: "Registrant", value: formatAddress(registrant) });
  }

  const expiryDisplay = formatTimestamp(expiry);
  if (expiryDisplay) {
    rows.push({ label: "Expiry", value: expiryDisplay });
  }

  const graceDisplay = formatTimestamp(gracePeriodEnds ?? null);
  if (graceDisplay) {
    rows.push({ label: "Grace period ends", value: graceDisplay });
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
        Ownership
      </span>
      <dl className="tw-grid tw-gap-2 md:tw-grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="tw-flex tw-flex-col">
            <dt className="tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
              {row.label}
            </dt>
            <dd className="tw-text-sm tw-text-iron-100">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const NameCard = ({ preview }: { readonly preview: EnsNamePreview }) => {
  const {
    name,
    normalized,
    address,
    avatarUrl,
    links,
    records,
    contenthash,
    ownership,
  } = preview;

  const formattedAddress = address ? formatAddress(address) : null;

  return (
    <div className="tw-flex tw-flex-col tw-gap-5" data-testid="ens-name-card">
      <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-start">
        {renderAvatar(avatarUrl, `${name} avatar`)}
        <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-1">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
            ENS Name
          </span>
          <span className="tw-text-xl tw-font-semibold tw-text-iron-50">
            {name}
          </span>
          {normalized !== name && (
            <span className="tw-text-xs tw-text-iron-400">{normalized}</span>
          )}
          {formattedAddress && (
            <span className="tw-text-sm tw-text-iron-200">
              {links.etherscan ? (
                <Link
                  href={links.etherscan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-text-primary-300 tw-transition-colors hover:tw-text-primary-100">
                  {formattedAddress}
                </Link>
              ) : (
                formattedAddress
              )}
            </span>
          )}
        </div>
      </div>

      {renderRecords(records)}
      {renderContenthash(contenthash, links)}
      {renderOwnership(ownership)}

      <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-2">
        {renderLink(links.app, "View in ENS App")}
        {renderLink(links.etherscan, "View on Etherscan")}
      </div>
    </div>
  );
};

const AddressCard = ({ preview }: { readonly preview: EnsAddressPreview }) => {
  const { address, primaryName, forwardMatch, avatarUrl, links } = preview;
  const formattedAddress = formatAddress(address);

  return (
    <div
      className="tw-flex tw-flex-col tw-gap-5"
      data-testid="ens-address-card">
      <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-start">
        {renderAvatar(avatarUrl, `${address} avatar`)}
        <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-1">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
            ENS Reverse Record
          </span>
          <span className="tw-text-xl tw-font-semibold tw-text-iron-50">
            {formattedAddress}
          </span>
          {primaryName && (
            <span className="tw-text-sm tw-text-iron-200">
              {links.app ? (
                <Link
                  href={links.app}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-text-primary-300 tw-transition-colors hover:tw-text-primary-100">
                  {primaryName}
                </Link>
              ) : (
                primaryName
              )}
            </span>
          )}
          <span className="tw-text-xs tw-font-medium tw-text-iron-400">
            {forwardMatch
              ? "Forward resolution verified"
              : "Forward resolution not verified"}
          </span>
        </div>
      </div>

      <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-2">
        {renderLink(links.app, "View in ENS App")}
        {renderLink(links.etherscan, "View on Etherscan")}
      </div>
    </div>
  );
};

const ContentCard = ({ preview }: { readonly preview: EnsContentPreview }) => {
  const { name, contenthash, links } = preview;

  return (
    <div
      className="tw-flex tw-flex-col tw-gap-5"
      data-testid="ens-content-card">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
          ENS Contenthash
        </span>
        <span className="tw-text-xl tw-font-semibold tw-text-iron-50">
          {name}
        </span>
      </div>
      {renderContenthash(contenthash, links)}
      <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-2">
        {renderLink(links.open, "Open content")}
        {renderLink(links.app, "View in ENS App")}
      </div>
    </div>
  );
};

interface EnsPreviewCardProps {
  readonly preview: EnsPreview;
}

export default function EnsPreviewCard({ preview }: EnsPreviewCardProps) {
  if (preview.type === "ens.address") {
    return <AddressCard preview={preview} />;
  }

  if (preview.type === "ens.content") {
    return <ContentCard preview={preview} />;
  }

  return <NameCard preview={preview} />;
}
