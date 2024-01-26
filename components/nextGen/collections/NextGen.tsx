import styles from "./NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import NextGenCollections from "./NextGenCollections";
import { NextGenCollection } from "../../../entities/INextgen";
import {
  NextGenCountdown,
  NextGenMintCounts,
  NextGenPhases,
} from "./collectionParts/NextGenCollectionHeader";

interface Props {
  collection: NextGenCollection;
}

export default function NextGen(props: Readonly<Props>) {
  const available = props.collection.total_supply - props.collection.mint_count;

  return (
    <Container className="no-padding">
      <Row className="pt-3 pb-3">
        <Col>
          <h1 className="mb-0">FEATURED COLLECTION</h1>
        </Col>
      </Row>
      <Row>
        <Col sm={12} md={6} className="pt-2">
          <a
            href={`/nextgen/collection/${props.collection.id}`}
            className="decoration-none">
            <Image
              loading="eager"
              width="0"
              height="0"
              style={{
                height: "auto",
                width: "auto",
                maxHeight: "100%",
                maxWidth: "100%",
                padding: "10px",
              }}
              src={props.collection.image}
              alt={props.collection.name}
            />
          </a>
        </Col>
        <Col sm={12} md={6} className="pt-3">
          <Container className="no-padding">
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
                  href={`/nextgen/collection/${props.collection.id}`}
                  className="decoration-none">
                  <h2 className="font-color mb-0">
                    #{props.collection.id} - {props.collection.name}
                  </h2>
                </a>
              </Col>
            </Row>
            <Row className="pt-3 font-larger font-color">
              <Col>
                by{" "}
                <b>
                  <a href={`/${props.collection.artist_address}`}>
                    {props.collection.artist}
                  </a>
                </b>
              </Col>
            </Row>
            <Row className="pt-3 font-larger font-color">
              <Col>
                <NextGenMintCounts collection={props.collection} />
              </Col>
            </Row>
            {/* <Row className="pt-3 font-larger font-color">
              <Col>
                <a
                  href={`/nextgen/collection/${props.collection.id}/minting-plan`}>
                  Minting Plan
                </a>
              </Col>
            </Row> */}
            <Row className="pt-4">
              <Col>
                <NextGenCountdown
                  collection={props.collection}
                  align="vertical"
                />
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      {/* <NextGenCollections /> */}
    </Container>
  );
}
