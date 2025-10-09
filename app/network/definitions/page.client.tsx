"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

const NAV_LINKS = [
  { href: "/network/tdh", label: "TDH" },
  { href: "/network/tdh/historic-boosts", label: "TDH Historic Boosts" },
  { href: "/network/stats", label: "Network Stats" },
  { href: "/network/levels", label: "Levels" },
] as const;

const BUTTON_LINK_CLASSES =
  "tw-flex-1 tw-min-w-[150px] tw-text-center tw-inline-block tw-rounded-md tw-bg-[#eee] tw-text-black tw-font-medium hover:tw-bg-[#ddd] hover:tw-text-black tw-border-solid tw-border-[#222] tw-px-4 tw-py-2 tw-no-underline tw-w-full sm:tw-w-auto sm:tw-whitespace-nowrap";

export default function DefinitionsClient() {
  useSetTitle("Definitions | Network");

  return (
    <Container className="tw-min-h-screen tw-pt-12 tw-pb-12">
      <Row>
        <Col>
          <h1>Definitions</h1>

          <div className="tw-mt-6 tw-space-y-3 tw-text-base lg:tw-text-lg">
            <p>
              <b>
                <u>Cards Collected:</u>
              </b>{" "}
              Total number of The Memes NFTs owned.
            </p>
            <p>
              <b>
                <u>Unique Memes:</u>
              </b>{" "}
              Total number of unique Meme NFTs owned.
            </p>
            <p>
              <b>
                <u>Meme Sets:</u>
              </b>{" "}
              Number of complete sets of The Memes (all SZNs or a specific SZN).
            </p>
            <p>
              <b>
                <u>Meme Sets -1 / -2:</u>
              </b>{" "}
              Complete sets missing 1 or 2 cards respectively.
            </p>
            <p>
              <b>
                <u>Genesis Sets:</u>
              </b>{" "}
              Complete set of the first three Meme NFTs.
            </p>
            <p>
              <b>
                <u>Purchases / Sales:</u>
              </b>{" "}
              Count of bought/sold NFTs (Memes or Gradients).
            </p>
            <p>
              <b>
                <u>Purchases (ETH) / Sales (ETH):</u>
              </b>{" "}
              ETH spent/received for those NFTs.
            </p>
            <p>
              <b>
                <u>Transfers In / Out:</u>
              </b>{" "}
              NFTs moved into/out of an address.
            </p>
            <p>
              <b>
                <u>TDH (unweighted):</u>
              </b>{" "}
              "Total Days Held" — each NFT contributes one unit per day held,
              summed across NFTs, calculated daily at 00:00 UTC.
            </p>
            <p>
              <b>
                <u>TDH (unboosted):</u>
              </b>{" "}
              TDH weighted by edition size (FirstGM 3,941 = 1.0 baseline).
            </p>
            <p>
              <b>
                <u>TDH:</u>
              </b>{" "}
              TDH (unboosted) &times; boosters. For the current rules, see{" "}
              <Link
                href="/network/tdh"
                className="tw-inline-block tw-rounded-md tw-bg-[#eee] tw-text-black tw-border-solid tw-border-[#222] hover:tw-bg-[#ddd] hover:tw-text-black tw-px-1 tw-py-0.5 tw-no-underline tw-text-md tw-font-medium">
                TDH
              </Link>
              .
            </p>
          </div>

          <div className="tw-mt-10 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-flex-wrap sm:tw-gap-3">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={BUTTON_LINK_CLASSES}>
                {label}
              </Link>
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
}
