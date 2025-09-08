import { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { isEmptyObject } from "@/helpers/Helpers";
import { Col, Container, Row } from "react-bootstrap";
import { formatNameForUrl } from "@/helpers/nextgen-utils";
import NextGenCollectionSlideshow from "@/components/nextGen/collections/collectionParts/NextGenCollectionSlideshow";
import LatestDropSection from "./LatestDropSection";
import Link from "next/link";
import LatestActivity from "../latest-activity/LatestActivity";
import { InitialActivityData } from "../latest-activity/fetchInitialActivityData";

export default function Home({
  featuredNft,
  featuredNextgen,
  initialActivityData,
  initialTokens,
}: {
  readonly featuredNft: NFTWithMemesExtendedData;
  readonly featuredNextgen: NextGenCollection;
  readonly initialActivityData: InitialActivityData;
  readonly initialTokens: NextGenToken[];
}) {
  return (
    <>
      <LatestDropSection featuredNft={featuredNft} />
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
              >
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
    </>
  );
}
