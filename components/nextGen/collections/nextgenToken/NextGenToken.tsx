import styles from "../NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import NextGenTokenProvenance from "./NextGenTokenProvenance";
import NextgenTokenProperties from "./NextGenTokenProperties";
import NextGenTokenAbout from "./NextGenTokenAbout";
import { useEffect, useState } from "react";
import NextGenTokenArt from "./NextGenTokenArt";
import { ContentView } from "../collectionParts/NextGenCollection";
import { isNullAddress } from "../../../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import router, { useRouter } from "next/router";
import Tippy from "@tippyjs/react";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
  view: ContentView;
}

export default function NextGenToken(props: Readonly<Props>) {
  const router = useRouter();

  const [view, setView] = useState<ContentView>(
    props.view ?? ContentView.ABOUT
  );

  useEffect(() => {
    const basePath = `/nextgen/token/${props.token.id}`;
    if (view && view !== ContentView.ABOUT) {
      router.push(`${basePath}/${view.toLowerCase()}`, undefined, {
        shallow: true,
      });
    } else {
      router.push(basePath, undefined, { shallow: true });
    }
  }, [view]);

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
              onClick={() => setView(ContentView.TRAITS)}
              className={
                view === ContentView.TRAITS
                  ? styles.nextgenTokenDetailsLinkSelected
                  : ""
              }>
              <h4
                className={
                  view === ContentView.TRAITS
                    ? "font-color"
                    : "font-color-h cursor-pointer"
                }>
                Traits
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
          <Col sm={12} className="pt-4 pb-4">
            {view === ContentView.ABOUT && (
              <NextGenTokenAbout
                collection={props.collection}
                token={props.token}
              />
            )}
            {view === ContentView.TRAITS && (
              <NextgenTokenProperties
                collection_id={props.collection.id}
                token_id={props.token.id}
              />
            )}
            {view === ContentView.PROVENANCE && (
              <NextGenTokenProvenance
                collection_id={props.collection.id}
                token_id={props.token.id}
              />
            )}
          </Col>
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
                    {(props.token.burnt ||
                      isNullAddress(props.token.owner)) && (
                      <Tippy content={"Burnt"} theme={"light"} delay={100}>
                        <FontAwesomeIcon
                          icon="fire"
                          style={{ height: "35px", color: "#c51d34" }}
                        />
                      </Tippy>
                    )}
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
