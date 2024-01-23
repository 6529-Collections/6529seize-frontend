import styles from "../NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import NextGenTokenProvenance from "./NextGenTokenProvenance";
import NextgenTokenProperties from "./NextGenTokenProperties";
import NextGenTokenAbout from "./NextGenTokenAbout";
import { useState } from "react";
import NextGenTokenArt from "./NextGenTokenArt";
import { ContentView } from "../collectionParts/NextGenCollection";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

export default function NextGenToken(props: Readonly<Props>) {
  const [view, setView] = useState<ContentView>(ContentView.ABOUT);

  function printDetails() {
    return (
      <Container className="pt-4">
        <Row>
          <Col className="d-flex gap-4">
            <a
              onClick={() => setView(ContentView.ABOUT)}
              className={
                view === ContentView.ABOUT
                  ? styles.nextgenTokenDetailsLinkSelected
                  : ""
              }>
              <h4
                className={
                  view === ContentView.ABOUT
                    ? "font-color"
                    : "font-color-h cursor-pointer"
                }>
                About
              </h4>
            </a>
            <a
              onClick={() => setView(ContentView.PROVENANCE)}
              className={
                view === ContentView.PROVENANCE
                  ? styles.nextgenTokenDetailsLinkSelected
                  : ""
              }>
              <h4
                className={
                  view === ContentView.PROVENANCE
                    ? "font-color"
                    : "font-color-h cursor-pointer"
                }>
                Provenance
              </h4>
            </a>
          </Col>
        </Row>
        <Row>
          {view === ContentView.PROVENANCE ? (
            <Col className="pt-4 pb-4">
              <NextGenTokenProvenance token_id={props.token.id} />
            </Col>
          ) : (
            <>
              <Col sm={12} md={6} className="pt-4 pb-4">
                <NextGenTokenAbout
                  collection={props.collection}
                  token={props.token}
                />
              </Col>
              <Col sm={12} md={6} className="pt-4 pb-4">
                <NextgenTokenProperties
                  collection_id={props.collection.id}
                  token_id={props.token.id}
                />
              </Col>
            </>
          )}
        </Row>
      </Container>
    );
  }

  function printToken() {
    return (
      <>
        <Container fluid className={`${styles.tokenContainer} pt-4 pb-4`}>
          <Row>
            <Col>
              <Container>
                <Row className="pb-4">
                  <Col className="d-flex align-items-center justify-content-between">
                    <h2 className="mb-0">{props.token.name}</h2>
                  </Col>
                </Row>
              </Container>
              <NextGenTokenArt
                token={props.token}
                collection={props.collection}
              />
            </Col>
          </Row>
        </Container>
        {printDetails()}
      </>
    );
  }

  return <>{printToken()}</>;
}
