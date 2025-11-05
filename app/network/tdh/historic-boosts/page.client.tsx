"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import Link from "next/link";
import type { PropsWithChildren, ReactNode } from "react";
import { Col, Container, Row } from "react-bootstrap";

function DetailsCard(props: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <details className="tw-rounded-lg tw-bg-[#0c0c0d] tw-border-2 tw-border-solid tw-border-[#222]">
      <summary className="tw-cursor-pointer tw-select-none tw-list-none tw-px-5 tw-py-3 tw-font-medium">
        <h5 className="tw-m-0">{props.title}</h5>
      </summary>
      <div className="tw-px-5 tw-pb-5 tw-pt-1">{props.children}</div>
    </details>
  );
}

function CategoryAList(
  props: Readonly<{
    // heading element differences between 1.1 (h3) and others (p)
    headingVariant: "p" | "h3";
    completeSetMultiplier: string; // "1.55x" | "1.25x" | "1.20x"
  }>
) {
  const Heading = (props.headingVariant === "h3" ? "h3" : "p") as any;
  const headingClass =
    props.headingVariant === "h3"
      ? "tw-mt-3 tw-font-medium"
      : "tw-font-medium tw-text-lg tw-mb-2";

  return (
    <>
      <Heading className={headingClass}>Category A</Heading>
      <ul className="tw-list-disc tw-ml-6 tw-space-y-1">
        <li>
          A complete set of all Meme Cards:{" "}
          <span className="tw-font-mono tw-font-medium">
            {props.completeSetMultiplier}
          </span>
        </li>
        <li>
          Additional complete set:{" "}
          <span className="tw-font-mono tw-font-medium">1.02x</span> (up to a
          maximum of 2 additional sets)
        </li>
      </ul>
    </>
  );
}

function Szn1Sublist() {
  return (
    <ul className="tw-ml-4 tw-space-y-1">
      <li>
        Complete Set: <span className="tw-font-mono tw-font-medium">1.05x</span>{" "}
        or
      </li>
      <li>
        Genesis Set: <span className="tw-font-mono tw-font-medium">1.01x</span>{" "}
        and
      </li>
      <li>
        Nakamoto Set: <span className="tw-font-mono tw-font-medium">1.01x</span>
      </li>
    </ul>
  );
}

function CategoryBList(
  props: Readonly<{
    maxSeason: number; // 4, 5, 11
    includeAppliedNote?: boolean; // only for 1.3
  }>
) {
  const seasons = Array.from({ length: props.maxSeason }, (_, i) => i + 1);

  return (
    <>
      <p className="tw-font-medium tw-text-lg tw-mb-2">Category B</p>
      {props.includeAppliedNote ? (
        <p className="tw-mb-2">
          Applied to total TDH (not just that SZN&apos;s TDH)
        </p>
      ) : null}
      <ul className="tw-ml-6 tw-space-y-1">
        <li>
          SZN1:
          <Szn1Sublist />
        </li>
        {seasons
          .filter((n) => n >= 2) // SZN2..max
          .map((n) => (
            <li key={n}>
              SZN{n}: <span className="tw-font-mono tw-font-medium">1.05x</span>
            </li>
          ))}
      </ul>
    </>
  );
}

function CategoryCList() {
  return (
    <>
      <p className="tw-font-medium tw-text-lg tw-mb-2">Category C</p>
      <ul className="tw-list-disc tw-ml-6">
        <li>
          Gradient: <span className="tw-font-mono tw-font-medium">1.02x</span>{" "}
          per Gradient (up to a maximum of <b>3</b>)
        </li>
      </ul>
    </>
  );
}

function IntroLine(props: PropsWithChildren) {
  return <p>{props.children}</p>;
}

const NAV_LINKS = [
  { href: "/network/tdh", label: "TDH" },
  { href: "/network/definitions", label: "Definitions" },
  { href: "/network/stats", label: "Network Stats" },
  { href: "/network/levels", label: "Levels" },
] as const;

export default function TDHHistoricBoostsPage() {
  useSetTitle("TDH Historic Boosts | Network");

  return (
    <Container className="tw-min-h-screen tw-pt-12 tw-pb-12">
      <Row>
        <Col>
          <h1>TDH — Historic Boosts</h1>
          <p className="tw-mt-4 tw-mb-8">
            Previous TDH versions are archived here for reference.
          </p>

          <div className="tw-space-y-6">
            {/* 1.3 */}
            <DetailsCard title="TDH 1.3 (March 29, 2024 — October 9, 2025)">
              <IntroLine>
                Higher of <b>Category A</b> and <b>Category B</b> Boosters, plus{" "}
                <b>Category C</b> Boosters
              </IntroLine>

              <CategoryAList headingVariant="p" completeSetMultiplier="1.55x" />
              <CategoryBList maxSeason={11} includeAppliedNote />
              <CategoryCList />
            </DetailsCard>

            {/* 1.2 */}
            <DetailsCard title="TDH 1.2 (December 30, 2023 — March 28, 2024)">
              <IntroLine>
                Higher of <b>Category A</b> and <b>Category B</b> boosters, plus{" "}
                <b>Category C</b> boosters
              </IntroLine>

              <CategoryAList headingVariant="p" completeSetMultiplier="1.25x" />
              <CategoryBList maxSeason={5} />
              <CategoryCList />
            </DetailsCard>

            {/* 1.1 */}
            <DetailsCard title="TDH 1.1 (July 14, 2023 — December 29, 2023)">
              <IntroLine>
                Higher of <b>Category A</b> and <b>Category B</b> Boosters, plus{" "}
                <b>Category C</b> Boosters
              </IntroLine>

              <CategoryAList
                headingVariant="h3"
                completeSetMultiplier="1.20x"
              />
              <CategoryBList maxSeason={4} />
              <CategoryCList />
            </DetailsCard>
          </div>

          <div className="tw-mt-10 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-flex-wrap sm:tw-gap-3">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="tw-flex-1 tw-min-w-[150px] tw-text-center tw-inline-block tw-rounded-md tw-bg-[#eee] tw-text-black tw-font-medium tw-border-solid tw-border-[#222] hover:tw-bg-[#ddd] hover:tw-text-black tw-px-4 tw-py-2 tw-no-underline tw-w-full sm:tw-w-auto sm:tw-whitespace-nowrap">
                {label}
              </Link>
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
}
