import { InitialActivityData } from "@/components/latest-activity/fetchInitialActivityData";
import LatestActivity from "@/components/latest-activity/LatestActivity";
import MemeCalendarOverview from "@/components/meme-calendar/MemeCalendarOverview";
import NextGenCollectionSlideshow from "@/components/nextGen/collections/collectionParts/NextGenCollectionSlideshow";
import { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { isEmptyObject } from "@/helpers/Helpers";
import { formatNameForUrl } from "@/helpers/nextgen-utils";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import LatestDropSection from "./LatestDropSection";

export default function Home({
  featuredNft,
  isMemeMintingActive,
  featuredNextgen,
  initialActivityData,
  initialTokens,
}: {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly isMemeMintingActive: boolean;
  readonly featuredNextgen: NextGenCollection;
  readonly initialActivityData: InitialActivityData;
  readonly initialTokens: NextGenToken[];
}) {
  return (
    <div className="tw-px-2 lg:tw-px-6 xl:tw-px-8">
      <LatestDropSection
        featuredNft={featuredNft}
        isMemeMintingActive={isMemeMintingActive}
      />
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
                )}`}>
                View Collection
              </Link>
            </Col>
          </Row>
          <Row className="pat-3">
            <Col>
              <NextGenCollectionSlideshow
                collection={featuredNextgen}
                initialTokens={initialTokens}
              />
            </Col>
          </Row>
        </Container>
      )}
      <Container>
        <Row className="pt-3">
          <Col xs={12} sm={12} md={12} lg={12}>
            <LatestActivity
              page={1}
              pageSize={12}
              showMore={false}
              initialActivity={initialActivityData.activity}
              initialTotalResults={initialActivityData.totalResults}
              initialNfts={initialActivityData.nfts}
              initialNextgenCollections={initialActivityData.nextgenCollections}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
}
