import Link from "next/link";
import Image from "next/image";

import { formatAddress } from "@/helpers/Helpers";
import type {
  JackButcherCard,
  JackChecksCard,
  JackInfinityCard,
  JackOpepenCard,
  JackOpepenSetCard,
  JackTransactionSummary,
  JackTraitAttribute,
} from "@/types/jackButcher";

import { LinkPreviewCardLayout } from "./OpenGraphPreview";

interface JackButcherPreviewProps {
  readonly href: string;
  readonly data: JackButcherCard;
}

const attributeLimit = 6;

const numberFormatter = new Intl.NumberFormat("en-US");

export default function JackButcherPreview({ href, data }: JackButcherPreviewProps) {
  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        {renderCardContent(data)}
      </div>
    </LinkPreviewCardLayout>
  );
}

function renderCardContent(card: JackButcherCard) {
  switch (card.type) {
    case "jack.checks":
      return renderChecksCard(card);
    case "jack.opepen":
      return renderOpepenCard(card);
    case "jack.opepen.set":
      return renderOpepenSetCard(card);
    case "jack.infinity":
      return renderInfinityCard(card);
    case "jack.tx":
      return renderTransactionCard(card);
    default:
      return null;
  }
}

function renderChecksCard(card: JackChecksCard) {
  const { token, collection, meta, links } = card;
  const attributes = token.attributes ?? [];

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row">
      {token.image && (
        <div className="tw-w-full md:tw-w-60 md:tw-flex-shrink-0">
          <AspectImage
            src={token.image}
            alt={`${collection.name} #${token.id}`}
          />
        </div>
      )}
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-3">
        <header className="tw-space-y-1">
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-primary-300">
            {collection.name}
          </p>
          <h3 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100">
            Checks #{token.id}
          </h3>
          <p className="tw-m-0 tw-text-xs tw-uppercase tw-text-iron-400">
            {card.variant === "original" ? "Original" : card.variant === "edition" ? "Edition" : "Edition status unknown"}
          </p>
        </header>
        {token.owner && (
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            Owner <span className="tw-font-semibold tw-text-iron-100">{formatAddress(token.owner)}</span>
          </p>
        )}
        {meta?.statement && (
          <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-whitespace-pre-line">{meta.statement}</p>
        )}
        {attributes.length > 0 && (
          <AttributeList attributes={attributes.slice(0, attributeLimit)} />
        )}
        <LinksList links={links} />
      </div>
    </div>
  );
}

function renderOpepenCard(card: JackOpepenCard) {
  const { token, collection, links, consensus } = card;
  const attributes = token.attributes ?? [];
  const setInfo = token.set;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row">
      {token.image && (
        <div className="tw-w-full md:tw-w-60 md:tw-flex-shrink-0">
          <AspectImage
            src={token.image}
            alt={`${collection.name} #${token.id}`}
          />
        </div>
      )}
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-3">
        <header className="tw-space-y-1">
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-primary-300">
            {collection.name}
          </p>
          <h3 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100">
            Opepen #{token.id}
          </h3>
          {setInfo && (
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">
              {setInfo.number != null && <span>Set {setInfo.number.toString().padStart(2, "0")}</span>}
              {setInfo.name && (
                <span className={setInfo.number != null ? "tw-ml-1" : undefined}>
                  {setInfo.name}
                </span>
              )}
              {setInfo.editionSize != null && (
                <span className="tw-block tw-text-xs tw-text-iron-400">
                  Edition size {numberFormatter.format(setInfo.editionSize)}
                </span>
              )}
            </p>
          )}
          {consensus?.metAt && (
            <p className="tw-m-0 tw-text-xs tw-text-emerald-300">
              Consensus met at {formatTimestamp(consensus.metAt)}
            </p>
          )}
        </header>
        {attributes.length > 0 && (
          <AttributeList attributes={attributes.slice(0, attributeLimit)} />
        )}
        <LinksList links={links} />
      </div>
    </div>
  );
}

function renderOpepenSetCard(card: JackOpepenSetCard) {
  const { set, links, status } = card;

  return (
    <div className="tw-space-y-3">
      <header className="tw-space-y-1">
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-primary-300">
          Opepen Set
        </p>
        <h3 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100">
          Set {set.number.toString().padStart(2, "0")}
        </h3>
        {set.title && <p className="tw-m-0 tw-text-sm tw-text-iron-200">{set.title}</p>}
        {set.artist && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">{set.artist}</p>
        )}
        {status?.consensus && (
          <p className="tw-m-0 tw-text-xs tw-text-emerald-300">Consensus {status.consensus}</p>
        )}
      </header>
      <LinksList links={links} />
    </div>
  );
}

function renderInfinityCard(card: JackInfinityCard) {
  const { collection, token, links, economics } = card;

  return (
    <div className="tw-space-y-3">
      <header className="tw-space-y-1">
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-primary-300">
          {collection.name}
        </p>
        {token?.id && (
          <h3 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100">
            Infinity Check #{token.id}
          </h3>
        )}
      </header>
      {token?.image && (
        <AspectImage src={token.image} alt={collection.name} />
      )}
      {economics && (
        <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0 tw-text-sm tw-text-iron-200">
          {economics.depositEth && <li>Deposit {economics.depositEth} ETH</li>}
          {economics.refundable && <li>Refundable mint</li>}
          {economics.burnOnRefund && <li>Burns on refund</li>}
        </ul>
      )}
      <LinksList links={links} />
    </div>
  );
}

function renderTransactionCard(card: JackTransactionSummary) {
  const { summary, links, hash, status } = card;

  return (
    <div className="tw-space-y-3">
      <header className="tw-space-y-1">
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-primary-300">
          Transaction
        </p>
        <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {formatHash(hash)}
        </h3>
        <p className="tw-m-0 tw-text-xs tw-uppercase tw-text-iron-400">{status}</p>
      </header>
      {summary && (
        <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0 tw-text-sm tw-text-iron-200">
          {summary.project && <li>Project: {summary.project}</li>}
          {summary.action && <li>Action: {summary.action}</li>}
          {summary.collection && <li>Collection: {formatAddress(summary.collection)}</li>}
          {summary.tokenId && <li>Token ID: {summary.tokenId}</li>}
          {summary.from && <li>From: {formatAddress(summary.from)}</li>}
          {summary.to && <li>To: {formatAddress(summary.to)}</li>}
        </ul>
      )}
      <LinksList links={links} fallbackLabel="View on Etherscan" />
    </div>
  );
}

function AttributeList({ attributes }: { readonly attributes: readonly JackTraitAttribute[] }) {
  return (
    <dl className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-xs tw-text-iron-200" data-testid="jack-attributes">
      {attributes.map((attribute) => (
        <div key={`${attribute.trait_type}-${String(attribute.value)}`} className="tw-flex tw-flex-col">
          <dt className="tw-text-iron-400 tw-uppercase tw-tracking-wide">
            {attribute.trait_type}
          </dt>
          <dd className="tw-m-0 tw-font-medium tw-text-iron-100">
            {typeof attribute.value === "boolean"
              ? attribute.value
                ? "Yes"
                : "No"
              : String(attribute.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LinksList({
  links,
  fallbackLabel,
}: {
  readonly links?: JackButcherCard["links"];
  readonly fallbackLabel?: string;
}) {
  if (!links) {
    return null;
  }

  const entries: Array<{ label: string; url: string }> = [];

  if (links.site) {
    entries.push({ label: fallbackLabel ?? "View site", url: links.site });
  }
  if (links.market) {
    entries.push({ label: "OpenSea", url: links.market });
  }
  if (links.token) {
    entries.push({ label: "Token", url: links.token });
  }
  if (links.contract) {
    entries.push({ label: "Contract", url: links.contract });
  }
  if (links.etherscan) {
    entries.push({ label: "Etherscan", url: links.etherscan });
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2">
      {entries.map(({ label, url }) => (
        <Link
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/60 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-primary-200 tw-no-underline tw-transition tw-duration-200 hover:tw-border-primary-400 hover:tw-text-primary-100"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

function AspectImage({ src, alt }: { readonly src: string; readonly alt: string }) {
  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60">
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={1200}
        className="tw-h-full tw-w-full tw-object-cover"
        loading="lazy"
        sizes="(max-width: 768px) 100vw, 240px"
        unoptimized
      />
    </div>
  );
}

function formatTimestamp(value: number): string {
  if (value <= 0) {
    return String(value);
  }

  if (value > 1_000_000_000_000) {
    return numberFormatter.format(value);
  }

  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) {
    return numberFormatter.format(value);
  }

  return date.toISOString().slice(0, 10);
}

function formatHash(value: string): string {
  if (!value) {
    return value;
  }

  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}
