import Image from "next/image";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import type { NextGenCollection } from "@/entities/INextgen";
import { formatNameForUrl } from "../nextgen_helpers";
import { NextGenMintCounts } from "./collectionParts/NextGenCollectionHeader";
import styles from "./NextGen.module.scss";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionPreview(props: Readonly<Props>) {
  return (
    <Link
      href={`/nextgen/collection/${formatNameForUrl(props.collection.name)}`}
      className="decoration-none"
    >
      <Container className={styles["collectionPreview"]}>
        <Row>
          <Col className="pb-4">
            <Image
              unoptimized
              priority
              loading={"eager"}
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
              alt={`NextGen Collection #${props.collection.id} - ${props.collection.name}`}
              onError={(e) => {
                e.currentTarget.src = "/pebbles-loading.jpeg";
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Container className={styles["collectionPreviewTitle"]}>
              <Row>
                <Col>
                  <h3 className="mb-0">{props.collection.name}</h3>
                </Col>
              </Row>
              <Row>
                <Col>
                  by <b>{props.collection.artist}</b>
                </Col>
              </Row>
              <Row>
                <Col className="font-color-h d-flex">
                  <NextGenMintCounts collection={props.collection} />
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </Link>
  );
}
