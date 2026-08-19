import {
  faCalculator,
  faCube,
  faFileExport,
  faLink,
  faServer,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

import OpenSeaIcon from "@/components/user/utils/icons/OpenseaIcon";

import {
  ABOUT_FRAMED_ICON_WRAPPER_CLASS_NAME,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
} from "./AboutLayout";

const DATA_SOURCE_SECTION_CLASS =
  "tw-relative tw-grid tw-grid-cols-1 tw-gap-5 md:tw-grid-cols-[minmax(12rem,0.36fr)_minmax(0,1fr)] md:tw-gap-16 lg:tw-gap-24";

const STANDARD_DATA_SOURCE_SECTION_CLASS =
  "tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-py-8 sm:tw-py-10";

const FEATURED_DATA_SOURCE_SECTION_CLASS =
  "tw-group tw-mt-8 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-[#00f0ff]/20 tw-bg-[#00f0ff]/[0.05] tw-p-5 tw-shadow-[0_15px_40px_rgba(0,240,255,0.05)] sm:tw-mt-10 sm:tw-p-6";

const DATA_SOURCE_LIST_CLASS =
  "tw-m-0 tw-space-y-3 tw-pl-5 tw-text-base tw-font-normal tw-leading-7 md:tw-pt-1";

const STANDARD_DATA_SOURCE_LIST_CLASS = `${DATA_SOURCE_LIST_CLASS} tw-text-iron-300`;

const FEATURED_DATA_SOURCE_LIST_CLASS = `${DATA_SOURCE_LIST_CLASS} tw-text-iron-200`;

const DATA_SOURCE_LINK_CLASS =
  "tw-rounded-sm tw-font-semibold tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 hover:tw-text-primary-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

const FEATURED_DATA_SOURCE_LINK_CLASS =
  "tw-rounded-sm tw-font-semibold tw-text-[#00f0ff] tw-underline tw-decoration-[#00f0ff]/30 tw-underline-offset-4 tw-transition-colors hover:tw-text-iron-50 hover:tw-decoration-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]";

function DataSourceSection({
  children,
  featured = false,
  glowClassName,
  headingId,
  icon,
  iconIsUnframed = false,
  iconWrapperClassName,
  title,
}: {
  readonly children: ReactNode;
  readonly featured?: boolean;
  readonly glowClassName?: string;
  readonly headingId: string;
  readonly icon: ReactNode;
  readonly iconIsUnframed?: boolean;
  readonly iconWrapperClassName?: string;
  readonly title: string;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={clsx(
        DATA_SOURCE_SECTION_CLASS,
        featured
          ? FEATURED_DATA_SOURCE_SECTION_CLASS
          : STANDARD_DATA_SOURCE_SECTION_CLASS
      )}
    >
      {glowClassName && (
        <span
          aria-hidden="true"
          className={clsx(
            "tw-pointer-events-none tw-absolute -tw-right-16 -tw-top-20 tw-size-64 tw-rounded-full tw-blur-3xl",
            glowClassName
          )}
        />
      )}
      <div className="tw-relative tw-z-10 tw-flex tw-min-w-0 tw-items-center tw-gap-4 tw-self-start">
        <span
          aria-hidden="true"
          className={clsx(
            "tw-flex tw-shrink-0 tw-items-center tw-justify-center",
            iconIsUnframed ? "tw-size-6" : ABOUT_FRAMED_ICON_WRAPPER_CLASS_NAME,
            iconWrapperClassName
          )}
        >
          {icon}
        </span>
        <h2
          className={clsx(
            "tw-m-0 tw-text-lg tw-leading-tight tw-tracking-tight sm:tw-text-xl",
            featured
              ? "tw-font-semibold tw-text-[#00f0ff]"
              : "tw-font-medium tw-text-iron-100"
          )}
          id={headingId}
        >
          {title}
        </h2>
      </div>
      <div className="tw-relative tw-z-10 tw-min-w-0">{children}</div>
    </section>
  );
}

export default function AboutDataDecentral() {
  return (
    <article
      className={`tw-w-full tw-pb-12 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header className="tw-max-w-4xl tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-2 sm:tw-pb-12 sm:tw-pt-8">
        <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
          Data Decentralization
        </h1>
        <div className="tw-mt-6 tw-space-y-4 tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300">
          <p className="tw-m-0 tw-text-pretty tw-text-lg tw-font-normal tw-leading-7 tw-text-iron-300 sm:tw-text-xl sm:tw-leading-8">
            One of our goals is to demonstrate how applications can be built in
            a decentralized manner.
          </p>
          <p className="tw-m-0 tw-text-iron-400">
            Effectively all information on 6529.io comes from on-chain or public
            sources or is derived in transparent ways from on-chain or public
            sources. This means anyone can replicate the data available on this
            site for a website or application of their own, without seeking
            permission from us and without any dependency on us.
          </p>
          <p className="tw-m-0 tw-text-iron-400">
            This page shares the source of all data displayed on 6529.io.
          </p>
        </div>
      </header>

      <div className="tw-flex tw-w-full tw-flex-col tw-px-1 sm:tw-px-2">
        <DataSourceSection
          headingId="on-chain-data-heading"
          icon={
            <FontAwesomeIcon
              className="tw-text-xl tw-text-[#00f0ff]"
              icon={faLink}
            />
          }
          iconWrapperClassName="tw-border-[#00f0ff]/20 tw-bg-[#00f0ff]/10"
          title="On-Chain (Ethereum)"
        >
          <ul
            className={`${STANDARD_DATA_SOURCE_LIST_CLASS} marker:tw-text-[#00f0ff]`}
          >
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
        </DataSourceSection>

        <DataSourceSection
          headingId="arweave-data-heading"
          icon={
            <FontAwesomeIcon
              className="tw-text-base tw-text-emerald-400"
              icon={faCube}
            />
          }
          iconWrapperClassName="tw-border-emerald-500/20 tw-bg-emerald-500/10"
          title="Arweave (Decentralized storage)"
        >
          <ul
            className={`${STANDARD_DATA_SOURCE_LIST_CLASS} marker:tw-text-emerald-400`}
          >
            <li>The image of the art associated with each NFT</li>
            <li>The metadata for the NFT</li>
          </ul>
        </DataSourceSection>

        <DataSourceSection
          headingId="opensea-data-heading"
          icon={
            <span className="tw-size-6">
              <OpenSeaIcon />
            </span>
          }
          iconWrapperClassName="tw-border-[#2081E2]/30 tw-bg-[#2081E2]/10"
          title="OpenSea API"
        >
          <ul
            className={`${STANDARD_DATA_SOURCE_LIST_CLASS} marker:tw-text-[#2081E2]`}
          >
            <li>NFT listing prices on OpenSea</li>
          </ul>
        </DataSourceSection>

        <DataSourceSection
          headingId="internal-data-heading"
          icon={
            <FontAwesomeIcon
              className="tw-text-base tw-text-orange-400"
              icon={faServer}
            />
          }
          iconWrapperClassName="tw-border-orange-500/20 tw-bg-orange-500/10"
          title="Internal Database"
        >
          <ul
            className={`${STANDARD_DATA_SOURCE_LIST_CLASS} marker:tw-text-orange-400`}
          >
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
        </DataSourceSection>

        <DataSourceSection
          headingId="computed-data-heading"
          icon={
            <FontAwesomeIcon
              className="tw-text-base tw-text-iron-200"
              icon={faCalculator}
            />
          }
          iconWrapperClassName="tw-border-white/10 tw-bg-white/[0.05]"
          title="Internally Calculated / Computed"
        >
          <ul
            className={`${STANDARD_DATA_SOURCE_LIST_CLASS} marker:tw-text-iron-400`}
          >
            <li>
              Thumbnail images to match the site design (transformed from the
              original image from Arweave)
            </li>
            <li>
              TDH values (calculated from on-chain data, using this formula. We
              will release sample code for this calculation soon)
            </li>
          </ul>
        </DataSourceSection>

        <DataSourceSection
          featured
          glowClassName="tw-bg-[#00f0ff]/10 tw-opacity-30 tw-transition-opacity tw-duration-500 group-hover:tw-opacity-70 motion-reduce:tw-transition-none"
          headingId="compiled-data-heading"
          icon={
            <FontAwesomeIcon
              className="tw-text-xl tw-text-[#00f0ff]"
              icon={faFileExport}
            />
          }
          iconIsUnframed
          title="Compiled 6529.io Data"
        >
          <ul
            className={`${FEATURED_DATA_SOURCE_LIST_CLASS} marker:tw-text-[#00f0ff]`}
          >
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
                className={FEATURED_DATA_SOURCE_LINK_CLASS}
                href="/open-data"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </Link>
              .
            </li>
          </ul>
        </DataSourceSection>
      </div>
    </article>
  );
}
