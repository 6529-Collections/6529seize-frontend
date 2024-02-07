import styles from "./NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { NextGenCollection } from "../../../entities/INextgen";
import {
  NextGenCountdown,
  NextGenMintCounts,
  NextGenPhases,
} from "./collectionParts/NextGenCollectionHeader";
import { formatNameForUrl, getStatusFromDates } from "../nextgen_helpers";
import { Status } from "../nextgen_entities";
import NextGenCollectionArtist from "./collectionParts/NextGenCollectionArtist";
import { NextGenView } from "./NextGenNavigationHeader";

interface Props {
  collection: NextGenCollection;
  setView: (view: NextGenView) => void;
}

export default function NextGen(props: Readonly<Props>) {
  const available = props.collection.total_supply - props.collection.mint_count;

  return (
    <>
      <div className={styles.nextgenBannerWrapper}>
        <div
          className={styles.nextgenBanner}
          style={{ background: `url(${props.collection.banner})` }}
        />
        <Container>
          <Row>
            <Col>
              <Container className="pt-5 pb-5 no-padding">
                <Row>
                  <Col sm={12} md={6}>
                    <Row>
                      <Col>
                        <NextGenPhases
                          collection={props.collection}
                          available={available}
                        />
                      </Col>
                    </Row>
                    <Row className="pt-2">
                      <Col>
                        <a
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}`}
                          className="decoration-none font-bolder"
                          style={{ fontSize: "60px" }}>
                          {props.collection.name}
                        </a>
                      </Col>
                    </Row>
                    <Row className="font-larger font-color font-bolder">
                      <Col
                        className="font-larger font-lighter"
                        style={{ fontSize: "48px", lineHeight: "48px" }}>
                        by{" "}
                        <a
                          href={`/${props.collection.artist_address}`}
                          className="decoration-hover-underline">
                          {props.collection.artist}
                        </a>
                      </Col>
                    </Row>
                    <Row className="pt-3 font-larger font-color">
                      <Col>
                        <NextGenMintCounts collection={props.collection} />
                      </Col>
                    </Row>
                    <Row className="pt-4 pb-2">
                      <Col>
                        <NextGenCountdown collection={props.collection} />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </div>
      <Container className="pt-5">
        <Row>
          <Col>
            <Container className="pt-3 pb-3">
              <Row>
                <Col
                  className="font-larger text-center"
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    padding: "8vh 8vw",
                  }}>
                  NextGen is an on-chain generative art NFT contract. It is also
                  a tool to support the ambitious aspirations of the 6529
                  community in the areas of art experimentation and
                  decentralized social organization.
                  <br />
                  <button
                    className="btn-link pt-3"
                    onClick={() => {
                      props.setView(NextGenView.ABOUT);
                      window.scrollTo(0, 120);
                    }}>
                    <span className="font-larger">Learn More</span>
                  </button>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
      <Container className="pt-5 pb-5">
        <Row>
          <Col>
            <h1>FEATURED ARTIST</h1>
          </Col>
        </Row>
        <Row>
          <Col>
            <NextGenCollectionArtist collection={props.collection} />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export function DistributionLink(
  props: Readonly<{
    collection: NextGenCollection;
    class?: string;
  }>
) {
  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );

  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  if (
    alStatus === Status.UPCOMING ||
    alStatus === Status.LIVE ||
    publicStatus !== Status.COMPLETE
  ) {
    return (
      <Container className="no-padding">
        <Row className={`pt-1 font-color ${props.class ? props.class : ""}`}>
          <Col>
            <a
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/distribution-plan`}>
              Distribution Plan
            </a>
          </Col>
        </Row>
      </Container>
    );
  }
  return <></>;
}
