"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

export default function TDHHistoricBoostsPage() {
  useSetTitle("TDH Historic Boosts | Network");

  return (
    <Container className="tw-pt-12 tw-pb-12">
      <Row>
        <Col>
          <h1>TDH - Historic Boosts</h1>
          <p className="tw-mt-4 tw-mb-8">
            Previous TDH versions are archived here for reference.
          </p>

          <div className="tw-space-y-6">
            {/* 1.3 */}
            <details className="tw-rounded-lg tw-bg-[#333] tw-border-1 tw-border-solid tw-border-[#555]">
              <summary className="tw-cursor-pointer tw-select-none tw-list-none tw-px-5 tw-py-3 tw-font-medium">
                <h5 className="tw-m-0">
                  TDH 1.3 (March 29, 2024 — October 8, 2025)
                </h5>
              </summary>
              <div className="tw-px-5 tw-pb-5 tw-pt-1">
                <p>
                  Higher of <b>Category A</b> and <b>Category B</b> Boosters,
                  plus <b>Category C</b> Boosters
                </p>
                <p className="tw-font-medium tw-text-lg tw-mb-2">Category A</p>
                <ul className="tw-list-disc tw-ml-6 tw-space-y-1">
                  <li>
                    A complete set of all Meme Cards:{" "}
                    <span className="tw-font-mono tw-font-medium">1.55x</span>
                  </li>
                  <li>
                    Additional complete set:{" "}
                    <span className="tw-font-mono tw-font-medium">1.02x</span>{" "}
                    (up to a maximum of 2 additional sets)
                  </li>
                </ul>

                <p className="tw-font-medium tw-text-lg tw-mb-2">Category B</p>
                <p className="tw-mb-2">
                  Applied to total TDH (not just that SZN's TDH)
                </p>
                <ul className="tw-ml-6 tw-space-y-1">
                  <li>
                    SZN1:
                    <ul className="tw-ml-4 tw-space-y-1">
                      <li>
                        Complete Set:{" "}
                        <span className="tw-font-mono tw-font-medium">
                          1.05x
                        </span>{" "}
                        or
                      </li>
                      <li>
                        Genesis Set:{" "}
                        <span className="tw-font-mono tw-font-medium">
                          1.01x
                        </span>{" "}
                        and
                      </li>
                      <li>
                        Nakamoto Set:{" "}
                        <span className="tw-font-mono tw-font-medium">
                          1.01x
                        </span>
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
                </ul>

                <p className="tw-font-medium tw-text-lg tw-mb-2">Category C</p>
                <ul className="tw-list-disc tw-ml-6">
                  <li>
                    Gradient:{" "}
                    <span className="tw-font-mono tw-font-medium">1.02x</span>{" "}
                    per Gradient (up to a maximum of <b>3</b>)
                  </li>
                </ul>
              </div>
            </details>

            {/* 1.2 */}
            <details className="tw-rounded-lg tw-bg-[#333] tw-border-1 tw-border-solid tw-border-[#555]">
              <summary className="tw-cursor-pointer tw-select-none tw-list-none tw-px-5 tw-py-3 tw-font-medium">
                <h5 className="tw-m-0">
                  TDH 1.2 (December 30, 2023 — March 28, 2024)
                </h5>
              </summary>
              <div className="tw-px-5 tw-pb-5 tw-pt-1">
                <p>
                  Higher of <b>Category A</b> and <b>Category B</b> boosters,
                  plus <b>Category C</b> boosters
                </p>
                <p className="tw-font-medium tw-text-lg tw-mb-2">Category A</p>
                <ul className="tw-list-disc tw-ml-6 tw-space-y-1">
                  <li>
                    A complete set of all Meme Cards:{" "}
                    <span className="tw-font-mono tw-font-medium">1.25x</span>
                  </li>
                  <li>
                    Additional complete set:{" "}
                    <span className="tw-font-mono tw-font-medium">1.02x</span>{" "}
                    (up to a maximum of 2 additional sets)
                  </li>
                </ul>
                <p className="tw-font-medium tw-text-lg tw-mb-2">Category B</p>
                <ul className="tw-ml-6 tw-space-y-1">
                  <li>
                    SZN1:
                    <ul className="tw-ml-4 tw-space-y-1">
                      <li>
                        Complete Set:{" "}
                        <span className="tw-font-mono tw-font-medium">
                          1.05x
                        </span>{" "}
                        or
                      </li>
                      <li>
                        Genesis Set:{" "}
                        <span className="tw-font-mono tw-font-medium">
                          1.01x
                        </span>{" "}
                        and
                      </li>
                      <li>
                        Nakamoto Set:{" "}
                        <span className="tw-font-mono tw-font-medium">
                          1.01x
                        </span>
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
                </ul>
                <p className="tw-font-medium tw-text-lg tw-mb-2">Category C</p>
                <ul className="tw-list-disc tw-ml-6">
                  <li>
                    Gradient:{" "}
                    <span className="tw-font-mono tw-font-medium">1.02x</span>{" "}
                    per Gradient (up to a maximum of <b>3</b>)
                  </li>
                </ul>
              </div>
            </details>

            {/* 1.1 */}
            <details className="tw-rounded-lg tw-bg-[#333] tw-border-1 tw-border-solid tw-border-[#555]">
              <summary className="tw-cursor-pointer tw-select-none tw-list-none tw-px-5 tw-py-3 tw-font-medium">
                <h5 className="tw-m-0">
                  TDH 1.1 (July 14, 2023 — December 29, 2023)
                </h5>
              </summary>
              <div className="tw-px-5 tw-pb-5 tw-pt-1">
                <p>
                  Higher of <b>Category A</b> and <b>Category B</b> Boosters,
                  plus <b>Category C</b> Boosters
                </p>
                <h3 className="tw-mt-3 tw-font-medium">Category A</h3>
                <ul className="tw-list-disc tw-ml-6 tw-space-y-1">
                  <li>
                    A complete set of all Meme Cards:{" "}
                    <span className="tw-font-mono tw-font-medium">1.20x</span>
                  </li>
                  <li>
                    Additional complete set:{" "}
                    <span className="tw-font-mono tw-font-medium">1.02x</span>{" "}
                    (up to a maximum of 2 additional sets)
                  </li>
                </ul>
                <p className="tw-font-medium tw-text-lg tw-mb-2">Category B</p>
                <ul className="tw-ml-6 tw-space-y-1">
                  <li>
                    SZN1:
                    <ul className="tw-ml-4 tw-space-y-1">
                      <li>
                        Complete Set:{" "}
                        <span className="tw-font-mono tw-font-medium">
                          1.05x
                        </span>{" "}
                        or
                      </li>
                      <li>
                        Genesis Set:{" "}
                        <span className="tw-font-mono tw-font-medium">
                          1.01x
                        </span>{" "}
                        and
                      </li>
                      <li>
                        Nakamoto Set:{" "}
                        <span className="tw-font-mono tw-font-medium">
                          1.01x
                        </span>
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
                </ul>
                <p className="tw-font-medium tw-text-lg tw-mb-2">Category C</p>
                <ul className="tw-list-disc tw-ml-6">
                  <li>
                    Gradient:{" "}
                    <span className="tw-font-mono tw-font-medium">1.02x</span>{" "}
                    per Gradient (up to a maximum of <b>3</b>)
                  </li>
                </ul>
              </div>
            </details>
          </div>
          <div className="tw-mt-10 tw-flex tw-flex-wrap tw-gap-3">
            <Link
              href="/network/tdh"
              className="tw-flex-1 tw-min-w-[150px] tw-text-center tw-inline-block tw-rounded-md tw-bg-[#eee] tw-text-black tw-font-medium tw-border tw-border-[#555] hover:tw-bg-[#ddd] hover:tw-text-black tw-px-4 tw-py-2 tw-no-underline">
              TDH
            </Link>
            <Link
              href="/network/definitions"
              className="tw-flex-1 tw-min-w-[150px] tw-text-center tw-inline-block tw-rounded-md tw-bg-[#eee] tw-text-black tw-font-medium tw-border tw-border-[#555] hover:tw-bg-[#ddd] hover:tw-text-black tw-px-4 tw-py-2 tw-no-underline">
              Definitions
            </Link>
            <Link
              href="/network/stats"
              className="tw-flex-1 tw-min-w-[150px] tw-text-center tw-inline-block tw-rounded-md tw-bg-[#eee] tw-text-black tw-font-medium tw-border tw-border-[#555] hover:tw-bg-[#ddd] hover:tw-text-black tw-px-4 tw-py-2 tw-no-underline">
              Network Stats
            </Link>
            <Link
              href="/network/levels"
              className="tw-flex-1 tw-min-w-[150px] tw-text-center tw-inline-block tw-rounded-md tw-bg-[#eee] tw-text-black tw-font-medium tw-border tw-border-[#555] hover:tw-bg-[#ddd] hover:tw-text-black tw-px-4 tw-py-2 tw-no-underline">
              Levels
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
