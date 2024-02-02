import styles from "../NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import NextGenTokenProvenance from "./NextGenTokenProvenance";
import NextgenTokenProperties, {
  NextgenTokenTraits,
} from "./NextGenTokenProperties";
import NextGenTokenAbout from "./NextGenTokenAbout";
import { useEffect, useState } from "react";
import NextGenTokenArt from "./NextGenTokenArt";
import {
  ContentView,
  printViewButton,
} from "../collectionParts/NextGenCollection";
import { isNullAddress } from "../../../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import Tippy from "@tippyjs/react";
import NextGenTokenRenderCenter from "./NextGenTokenRenderCenter";

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
      router.push(
        `${basePath}/${view.toLowerCase().replaceAll(/ /g, "-")}`,
        undefined,
        {
          shallow: true,
        }
      );
    } else {
      router.push(basePath, undefined, { shallow: true });
    }
  }, [view]);

  function printDetails() {
    return (
      <Container className="pt-4">
        <Row>
          <Col className="d-flex gap-4">
            {printViewButton(view, ContentView.ABOUT, setView)}
            {printViewButton(view, ContentView.PROVENANCE, setView)}
            {printViewButton(view, ContentView.RENDER_CENTER, setView)}
            {printViewButton(view, ContentView.RARITY, setView)}
          </Col>
        </Row>
        <Row>
          {view === ContentView.ABOUT && (
            <>
              <Col sm={12} md={6} className="pt-4 pb-4">
                <NextGenTokenAbout
                  collection={props.collection}
                  token={props.token}
                />
              </Col>
              <Col sm={12} md={6} className="pt-4 pb-4">
                <NextgenTokenTraits
                  collection_id={props.collection.id}
                  token={props.token}
                />
              </Col>
            </>
          )}
          {view === ContentView.PROVENANCE && (
            <Col className="pt-4 pb-4">
              <NextGenTokenProvenance
                token_id={props.token.id}
                collection_id={props.collection.id}
              />
            </Col>
          )}
          {view === ContentView.RENDER_CENTER && (
            <Col className="pt-4 pb-4">
              <NextGenTokenRenderCenter />
            </Col>
          )}
          {view === ContentView.RARITY && (
            <Col className="pt-4 pb-4">
              <NextgenTokenProperties
                collection_id={props.collection.id}
                token={props.token}
              />
            </Col>
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
                    <h2 className="mb-0 font-color">{props.token.name}</h2>
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
