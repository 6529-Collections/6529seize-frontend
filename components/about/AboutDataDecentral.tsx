import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBoxArchive,
  faCalculator,
  faDatabase,
  faFileCsv,
  faLink,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { ReactNode } from "react";

import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";

const DATA_SOURCE_CARD_CLASS =
  "tw-h-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55 tw-p-4 sm:tw-p-6";

const DATA_SOURCE_LIST_CLASS =
  "tw-m-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600";

const DATA_SOURCE_LINK_CLASS =
  "tw-rounded-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 hover:tw-text-primary-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

function DataSourceCard({
  children,
  headingId,
  icon,
  iconClassName,
  iconWrapperClassName,
  title,
}: {
  readonly children: ReactNode;
  readonly headingId: string;
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly iconWrapperClassName: string;
  readonly title: string;
}) {
  return (
    <section aria-labelledby={headingId} className={DATA_SOURCE_CARD_CLASS}>
      <div className="tw-flex tw-items-center tw-gap-3">
        <span
          aria-hidden="true"
          className={`tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full ${iconWrapperClassName}`}
        >
          <FontAwesomeIcon className={iconClassName} icon={icon} />
        </span>
        <h2
          className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl"
          id={headingId}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function AboutDataDecentral() {
  return (
    <article
      className={`tw-w-full tw-pb-12 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header className="tw-max-w-4xl tw-px-1 tw-pb-8 tw-pt-4 sm:tw-px-2 sm:tw-pb-10 sm:tw-pt-8">
        <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
          Data Decentralization
        </h1>
        <div className="tw-mt-6 tw-space-y-4 tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300">
          <p className="tw-m-0">
            One of our goals is to demonstrate how applications can be built in
            a decentralized manner.
          </p>
          <p className="tw-m-0">
            Effectively all information on 6529.io comes from on-chain or public
            sources or is derived in transparent ways from on-chain or public
            sources. This means anyone can replicate the data available on this
            site for a website or application of their own, without seeking
            permission from us and without any dependency on us.
          </p>
          <p className="tw-m-0">
            This page shares the source of all data displayed on 6529.io.
          </p>
        </div>
      </header>

      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-px-1 sm:tw-gap-6 sm:tw-px-2 md:tw-grid-cols-2">
        <DataSourceCard
          headingId="on-chain-data-heading"
          icon={faLink}
          iconClassName="tw-text-[#00f0ff]"
          iconWrapperClassName="tw-bg-[#00f0ff]/10"
          title="On-Chain (Ethereum)"
        >
          <ul className={DATA_SOURCE_LIST_CLASS}>
            <li>The token #</li>
            <li>
              The location (URI/URL) of the JSON with the token&apos;s metadata
            </li>
            <li>The collectors&apos; Ethereum addresses</li>
            <li>
              The collectors&apos; NFTs currently owned, as well as bought, sold
              or transfered
            </li>
            <li>ENS addresses of collectors</li>
          </ul>
        </DataSourceCard>

        <DataSourceCard
          headingId="arweave-data-heading"
          icon={faBoxArchive}
          iconClassName="tw-text-[#8f5cff]"
          iconWrapperClassName="tw-bg-[#7000ff]/20"
          title="Arweave (Decentralized storage)"
        >
          <ul className={DATA_SOURCE_LIST_CLASS}>
            <li>The image of the art associated with each NFT</li>
            <li>The metadata for the NFT</li>
          </ul>
        </DataSourceCard>

        <DataSourceCard
          headingId="opensea-data-heading"
          icon={faStore}
          iconClassName="tw-text-iron-300"
          iconWrapperClassName="tw-bg-iron-800"
          title="OpenSea API"
        >
          <ul className={DATA_SOURCE_LIST_CLASS}>
            <li>NFT listing prices on OpenSea</li>
          </ul>
        </DataSourceCard>

        <DataSourceCard
          headingId="internal-data-heading"
          icon={faDatabase}
          iconClassName="tw-text-orange-400"
          iconWrapperClassName="tw-bg-orange-500/10"
          title="Internal Database"
        >
          <ul className={DATA_SOURCE_LIST_CLASS}>
            <li>
              6529 Team addresses. A record of these can be found on Arweave{" "}
              <Link
                className={DATA_SOURCE_LINK_CLASS}
                href={`https://media.6529.io/arweave/fy83ffOGqR9cR2zooI7u9JxsG0oEWVJxH3B-bNxXKJg`}
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </Link>
              . We will move this list 100% on-chain in the coming weeks.
            </li>
          </ul>
        </DataSourceCard>

        <DataSourceCard
          headingId="computed-data-heading"
          icon={faCalculator}
          iconClassName="tw-text-primary-300"
          iconWrapperClassName="tw-bg-primary-400/10"
          title="Internally Calculated / Computed"
        >
          <ul className={DATA_SOURCE_LIST_CLASS}>
            <li>
              Thumbnail images to match the site design (transformed from the
              original image from Arweave)
            </li>
            <li>
              TDH values (calculated from on-chain data, using this formula. We
              will release sample code for this calculation soon)
            </li>
          </ul>
        </DataSourceCard>

        <DataSourceCard
          headingId="compiled-data-heading"
          icon={faFileCsv}
          iconClassName="tw-text-success"
          iconWrapperClassName="tw-bg-success/10"
          title="Compiled 6529.io Data"
        >
          <ul className={DATA_SOURCE_LIST_CLASS}>
            <li>
              Even though everyone can compile and calculate the same data as
              us, we also export daily all our compiled and calculated data for
              the convenience of those without programming backgrounds
            </li>
            <li>
              Every day, we post our complete set of on-chain and calculated
              values shown on the site to Arweave as a CSV. The specific links
              can be found{" "}
              <Link
                className={DATA_SOURCE_LINK_CLASS}
                href="/open-data"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </Link>
              .
            </li>
          </ul>
        </DataSourceCard>
      </div>
    </article>
  );
}
