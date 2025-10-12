"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

const BUTTON_LINK_CLASSES =
  "tw-inline-block tw-rounded-md tw-bg-[#eee] tw-text-black tw-font-medium tw-border-solid tw-border-[#222] hover:tw-bg-[#ddd] hover:tw-text-black tw-px-4 tw-py-2 tw-no-underline";

export default function TDHMainPage() {
  useSetTitle("TDH | Network");

  return (
    <Container className="tw-min-h-screen tw-pt-12 tw-pb-12">
      <Row>
        <Col>
          <h1>TDH</h1>
          <p className="tw-mt-2">
            TDH (Total Days Held) is our time-weighted holding metric. Each NFT
            you hold contributes its days-held to your total. We then multiply
            by edition-size weights and apply collection "boosters" based on
            what you hold.
          </p>

          <div className="tw-mt-8 tw-space-y-2">
            <h2>How TDH is computed</h2>
            <ol className="tw-list-decimal tw-ml-6 tw-space-y-2">
              <li>
                <span className="tw-font-medium">Unweighted days:</span> each
                NFT contributes 1 per day it's held.
              </li>
              <li>
                <span className="tw-font-medium">Edition weighting:</span> we
                scale by edition size with FirstGM (3,941) as 1.
                <br />
                Examples:
                <ul className="tw-list-disc tw-ml-6 tw-space-y-1">
                  <li>SeizingJPG (Edition Size 1,000) = 3.941</li>
                  <li>Nakamoto Freedom (Edition Size 300) = 13.136</li>
                  <li>Gradients (Edition Size 101) = 39.020</li>
                </ul>
              </li>
              <li>
                <span className="tw-font-medium">Boosts:</span> we multiply by
                the <span className="tw-font-medium">higher</span> of Category A
                or B, then add Category C. (Details below.)
              </li>
            </ol>
            <p className="tw-pt-3">* Calculated daily at 00:00 UTC.</p>
          </div>

          {/* TDH 1.4 */}
          <div
            id="tdh-1-4"
            className="tw-mt-10 tw-rounded-lg tw-bg-[#0c0c0d] tw-border-1 tw-border-solid tw-border-[#222] tw-p-6">
            <h3>TDH 1.4 (October 10, 2025 — present)</h3>
            <p className="tw-mt-4">
              Higher of <b>Category A</b> and <b>Category B</b> boosters, plus{" "}
              <b>Category C</b> boosters.
            </p>

            <div className="tw-mt-6">
              <h4>Category A</h4>
              <ul className="tw-list-disc tw-ml-6 tw-space-y-1">
                <li>
                  A complete set of all Meme Cards:{" "}
                  <span className="tw-font-mono tw-font-medium">1.60x</span>
                </li>
              </ul>

              <p className="tw-mt-3">
                Additional complete sets add to the <b>total TDH</b> (no cap):
              </p>
              <p className="tw-mt-1">
                Additional Set Boost ={" "}
                <span className="tw-font-mono tw-font-medium">
                  0.05 &times; (0.6529)<sup>(n-1)</sup>
                </span>
              </p>
              <div className="tw-mt-2">
                <p className="tw-font-medium">Examples:</p>
                <ul className="tw-ml-6 tw-space-y-1">
                  <li>
                    1st additional set:{" "}
                    <span className="tw-font-mono tw-font-medium">0.05</span>
                  </li>
                  <li>
                    2nd additional set:{" "}
                    <span className="tw-font-mono tw-font-medium">
                      0.05 &times; 0.6529 = 0.032645
                    </span>
                  </li>
                  <li>
                    3rd additional set:{" "}
                    <span className="tw-font-mono tw-font-medium">
                      0.05 &times; 0.6529<sup>2</sup> = 0.021314
                    </span>
                  </li>
                  <li>
                    5th additional set:{" "}
                    <span className="tw-font-mono tw-font-medium">
                      0.05 &times; 0.6529<sup>4</sup> = 0.009086
                    </span>
                  </li>
                  <li>
                    10th additional set:{" "}
                    <span className="tw-font-mono tw-font-medium">
                      0.05 &times; 0.6529<sup>9</sup> = 0.001078
                    </span>
                  </li>
                </ul>
              </div>
              <p className="tw-mt-3">
                Maximum theoretical Category A boost (infinite sets):{" "}
                <span className="tw-font-mono">
                  {"0.60 + 0.05 / (1 - 0.6529) = 0.744051"}
                </span>
              </p>
            </div>

            <div className="tw-mt-8">
              <h4>Category B</h4>
              <p className="tw-mt-1">
                Applied to the <b>total TDH</b>, not just that season's TDH:
              </p>
              <ul className="tw-ml-6 tw-space-y-1">
                <li>
                  SZN1:
                  <ul className="tw-ml-4 tw-space-y-1">
                    <li>
                      Complete Set:{" "}
                      <span className="tw-font-mono tw-font-medium">1.05x</span>{" "}
                      or
                    </li>
                    <li>
                      Genesis Set:{" "}
                      <span className="tw-font-mono tw-font-medium">1.01x</span>{" "}
                      and
                    </li>
                    <li>
                      Nakamoto Set:{" "}
                      <span className="tw-font-mono tw-font-medium">1.01x</span>
                    </li>
                  </ul>
                </li>
                <li>
                  SZN2:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN3:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN4:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN5:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN6:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN7:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN8:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN9:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN10:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN11:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
                <li>
                  SZN12:{" "}
                  <span className="tw-font-mono tw-font-medium">1.05x</span>
                </li>
              </ul>
            </div>

            <div className="tw-mt-8">
              <h4>Category C</h4>
              <ul className="tw-ml-6 tw-space-y-1">
                <li>
                  Gradient:{" "}
                  <span className="tw-font-mono tw-font-medium">1.02x</span> per
                  Gradient (up to a maximum of{" "}
                  <span className="tw-font-mono tw-font-medium">5</span>)
                </li>
              </ul>
            </div>

            <div className="tw-mt-8 tw-flex tw-flex-wrap tw-gap-3">
              <Link
                href="/network/tdh/historic-boosts"
                className={BUTTON_LINK_CLASSES}>
                View Historic Boosts
              </Link>
              <Link href="/network/definitions" className={BUTTON_LINK_CLASSES}>
                Definitions
              </Link>
            </div>
          </div>

          {/* Cross-links */}
          <div className="tw-mt-10 tw-grid md:tw-grid-cols-2 tw-gap-6">
            <div className="tw-rounded-lg tw-bg-[#0c0c0d] tw-border-1 tw-border-solid tw-border-[#222] tw-p-6">
              <h3>Network Stats</h3>
              <p className="tw-mt-1">
                Aggregate community activity, holdings, trading, and time-based
                metrics across the network.
              </p>
              <Link href="/network/stats" className={BUTTON_LINK_CLASSES}>
                View Network Stats
              </Link>
            </div>
            <div className="tw-rounded-lg tw-bg-[#0c0c0d] tw-border-1 tw-border-solid tw-border-[#222] tw-p-6">
              <h3>Levels</h3>
              <p className="tw-mt-1">
                Our integrated progression that combines <b>TDH</b> with{" "}
                <b>Rep</b> (peer-given reputation points).
              </p>
              <Link href="/network/levels" className={BUTTON_LINK_CLASSES}>
                View Levels
              </Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
