"use client";

import NextGenCollectionSlideshow from "@/components/nextGen/collections/collectionParts/NextGenCollectionSlideshow";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import { NextGenCollection } from "@/entities/INextgen";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { isEmptyObject } from "@/helpers/Helpers";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import MemeCalendarOverview from "../schedule/MemeCalendarOverview";
import LatestDropSection from "./LatestDropSection";

const LatestActivity = dynamic(
  () => import("@/components/latest-activity/LatestActivity"),
  { ssr: false }
);

export default function Home({
  featuredNft,
  featuredNextgen,
}: {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly featuredNextgen: NextGenCollection;
}) {
  return (
    <>
      <LatestDropSection featuredNft={featuredNft} />
      <Container className="py-5">
        <Row>
          <Col>
            <MemeCalendarOverview displayTz="local" showViewAll />
          </Col>
        </Row>
      </Container>
      {featuredNextgen && !isEmptyObject(featuredNextgen) && (
        <Container className="pt-3 pb-5">
          <Row>
            <Col className="d-flex align-items-center gap-3">
              <h1>
                <span className="font-lightest">Discover</span> NextGen -{" "}
                {featuredNextgen.name}{" "}
              </h1>
              <Link
                href={`/nextgen/collection/${formatNameForUrl(
                  featuredNextgen.name
                )}`}
                className="tw-no-underline">
                <span className="tw-whitespace-nowrap tw-text-sm tw-font-bold tw-border-b-[3px] tw-border-current hover:tw-text-[#bbb] max-[800px]:tw-text-[12px]">
                  View Collection
                </span>
              </Link>
            </Col>
          </Row>
          <Row className="pat-3">
            <Col>
              <NextGenCollectionSlideshow collection={featuredNextgen} />
            </Col>
          </Row>
        </Container>
      )}
      <Container>
        <Row className="pt-3">
          <Col xs={12} sm={12} md={12} lg={12}>
            <LatestActivity page={1} pageSize={12} showMore={false} />
          </Col>
        </Row>
      </Container>
    </>
  );
}
