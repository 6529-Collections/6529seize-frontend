"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import { NETWORK_REFERENCE_PAGE_CLASSES } from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import Link from "next/link";
import type { ReactNode } from "react";

const REFERENCE_SECTION_CLASSES =
  "tw-grid tw-gap-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-py-12 sm:tw-gap-8 lg:tw-grid-cols-3 lg:tw-gap-16 lg:tw-py-16";
const REFERENCE_CONTENT_CLASSES =
  "tw-min-w-0 tw-space-y-5 tw-text-sm tw-leading-6 tw-text-iron-400 lg:tw-col-span-2";
const FORMULA_CLASSES =
  "tw-m-0 tw-w-full tw-overflow-x-auto tw-whitespace-pre tw-rounded-xl tw-bg-iron-950 tw-p-5 tw-font-mono tw-text-sm tw-leading-6 tw-text-primary-300 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03]";
const ORDERED_LIST_CLASSES =
  "tw-mb-0 tw-list-decimal tw-space-y-2 tw-pl-5 tw-text-iron-400 marker:tw-text-iron-500";

export default function XTDHMainPage() {
  useSetTitle("xTDH Overview | Network");

  return (
    <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <div className="tw-mx-auto tw-w-full tw-max-w-6xl">
        <AboutContentsDropdown currentHref="/network/xtdh" />

        <div className="tw-pt-8 lg:tw-pt-12">
          <section
            aria-labelledby="xtdh-overview-heading"
            className="tw-grid tw-gap-6 tw-pb-12 sm:tw-gap-8 lg:tw-grid-cols-3 lg:tw-gap-16 lg:tw-pb-16"
          >
            <div className="lg:tw-sticky lg:tw-top-28 lg:tw-self-start">
              <h1
                id="xtdh-overview-heading"
                className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-100"
              >
                xTDH Overview
              </h1>
            </div>
            <div className={REFERENCE_CONTENT_CLASSES}>
              <p className="tw-m-0">
                xTDH is an extension of{" "}
                <Link
                  href="/network/tdh"
                  className="tw-font-medium tw-text-iron-100 tw-underline tw-decoration-white/30 tw-underline-offset-4 tw-transition-colors focus:tw-outline-none focus-visible:tw-rounded-sm focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-300"
                >
                  TDH
                </Link>{" "}
                which helps to include other NFT holders to 6529 ecosystem and
                offer them all the benefits of TDH.
              </p>
              <div className="tw-space-y-3">
                <p className="tw-m-0">It tracks:</p>
                <ol className={ORDERED_LIST_CLASSES}>
                  <li>How much your memes produce</li>
                  <li>
                    How much xTDH you <strong>receive</strong> from grants on
                    tokens you own
                  </li>
                  <li>
                    How much xTDH you’ve <strong>given</strong> away via grants
                  </li>
                </ol>
              </div>
              <p className="tw-m-0">
                Your total xTDH balance increases every day at midnight based
                on these rules.
              </p>
            </div>
          </section>

          <XtdhReferenceSection
            id="produced-xtdh"
            title="Produced xTDH (from your Memes)"
          >
            <p className="tw-m-0">
              Every meme you hold that produces TDH also produces xTDH. So
              every midnight you produce TDH you also produce xTDH following
              this formula:
            </p>
            <pre className={FORMULA_CLASSES}>
              <code>
                produced_xTDH_today = (TDH gained today) × xTDH_coefficient
              </code>
            </pre>
            <p className="tw-m-0">
              xTDH_coefficient is currently set to 0.1, but is subject to change
              in the future.
            </p>
          </XtdhReferenceSection>

          <XtdhReferenceSection
            id="received-xtdh"
            title="Received xTDH (from grants on tokens you own)"
          >
            <p className="tw-m-0">
              A grant lets someone “give away” a portion of their xTDH produced
              in the future to <em className="tw-text-iron-200">all or some</em>{" "}
              tokens in an ERC721 collection. If you own a token that has
              active grants, you receive a portion of those grants every day.
            </p>

            <div className="tw-space-y-3 tw-pt-2">
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
                How much do you receive?
              </h3>
              <p className="tw-m-0">Each grant has:</p>
              <ol className={ORDERED_LIST_CLASSES}>
                <li>rate</li>
                <li>denominator</li>
              </ol>
            </div>

            <div className="tw-space-y-3">
              <p className="tw-m-0">Denominator can be configured as:</p>
              <ol className={ORDERED_LIST_CLASSES}>
                <li>
                  Full - grant every token in the collection (in which case
                  denominator is total supply)
                </li>
                <li>
                  Partial - grant a specific set of tokens in a collection (in
                  which case denominator is number of those tokens)
                </li>
              </ol>
            </div>

            <p className="tw-m-0">Each token receives:</p>
            <pre className={FORMULA_CLASSES}>
              <code>grant_amount_per_token = rate / denominator</code>
            </pre>
            <p className="tw-m-0">
              You receive this amount{" "}
              <strong className="tw-font-semibold tw-text-iron-100">
                only for the time you actually owned the token
              </strong>
              , and only while the grant was active.
            </p>
            <p className="tw-m-0">
              First increment will be given out when on midnight when at least
              24 hours have passed since start of the grant and at least 24
              hours has passed since you acquired the token.
            </p>
          </XtdhReferenceSection>

          <XtdhReferenceSection
            id="ownership-boundaries"
            title="Ownership boundaries matter"
          >
            <p className="tw-m-0">
              Just like with TDH, &quot;transfers&quot; inside the same
              consolidation group{" "}
              <strong className="tw-font-semibold tw-text-iron-100">
                do not reset
              </strong>{" "}
              the ownership window. Sales or transfers across groups{" "}
              <strong className="tw-font-semibold tw-text-iron-100">do</strong>.
            </p>
            <p className="tw-m-0">
              If you sell your token then the xTDH does not transfer with it.
              It goes back to the grantor.
            </p>
          </XtdhReferenceSection>

          <XtdhReferenceSection
            id="granted-out-xtdh"
            title="Granted out xTDH (what you give away)"
          >
            <p className="tw-m-0">
              You can&apos;t give away xTDH which is already pinned to your
              identity, but you can give away future xTDH earnings via grants.
              You can give away it all or some part of it. The total amount you
              are giving away is calculated like this:
            </p>
            <ol className={ORDERED_LIST_CLASSES}>
              <li>
                sum up all grant rates which have been active for at least 24h
              </li>
              <li>
                sum up all portions of grantees who have been holding the token
                less than 24h
              </li>
              <li>subtract the latter from former</li>
            </ol>
          </XtdhReferenceSection>

          <XtdhReferenceSection
            id="daily-xtdh-rate"
            title="Your daily xTDH rate"
          >
            <pre className={FORMULA_CLASSES}>
              <code>
                xtdh_rate = produced_today - granted_out_today + received_today
              </code>
            </pre>
            <p className="tw-m-0 tw-pl-2 tw-font-mono tw-text-xs tw-text-iron-500">
              ... and ...
            </p>
            <pre className={FORMULA_CLASSES}>
              <code>xtdh_total = xtdh_total_previous + xtdh_rate</code>
            </pre>

            <div className="tw-space-y-3 tw-pt-2">
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
                Example:
              </h3>
              <p className="tw-m-0">If today you:</p>
              <ol className={ORDERED_LIST_CLASSES}>
                <li>produce 20 xTDH</li>
                <li>have grants giving away 5 xTDH</li>
                <li>receive 3 xTDH from grants on tokens you own</li>
              </ol>
            </div>
            <p className="tw-m-0">Then:</p>
            <pre className="tw-m-0 tw-w-fit tw-max-w-full tw-overflow-x-auto tw-whitespace-pre tw-rounded-lg tw-bg-iron-950 tw-p-4 tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-100 tw-ring-1 tw-ring-white/[0.03]">
              <code>xtdh_rate = 20 - 5 + 3 = 18 xTDH</code>
            </pre>
          </XtdhReferenceSection>

          <XtdhReferenceSection
            id="lost-xtdh"
            title="Can xTDH ever get lost?"
          >
            <p className="tw-m-0">
              No. All the produced xTDH always goes to someone. It never
              vanishes. If a grantee sells their token then the xTDH they had
              gained goes back to the grantor.
            </p>
          </XtdhReferenceSection>
        </div>
      </div>
    </main>
  );
}

function XtdhReferenceSection({
  id,
  title,
  children,
}: Readonly<{
  id: string;
  title: string;
  children: ReactNode;
}>) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className={REFERENCE_SECTION_CLASSES}>
      <div className="lg:tw-sticky lg:tw-top-28 lg:tw-self-start">
        <h2
          id={headingId}
          className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-100"
        >
          {title}
        </h2>
      </div>
      <div className={REFERENCE_CONTENT_CLASSES}>{children}</div>
    </section>
  );
}
