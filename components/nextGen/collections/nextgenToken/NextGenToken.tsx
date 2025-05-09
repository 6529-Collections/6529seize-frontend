import styles from "../NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "../../../../entities/INextgen";
import NextGenTokenProvenance from "./NextGenTokenProvenance";
import NextgenTokenRarity, {
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
import { NextGenBackToCollectionPageLink } from "../collectionParts/NextGenCollectionHeader";
import {
  faChevronCircleLeft,
  faChevronCircleRight,
  faFire,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
  traits: NextGenTrait[];
  tokenCount: number;
  view: ContentView;
}

export default function NextGenTokenPage(props: Readonly<Props>) {
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
            {printViewButton(view, ContentView.DISPLAY_CENTER, setView)}
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
                  collection={props.collection}
                  token={props.token}
                  traits={props.traits.filter(
                    (trait) => trait.trait !== "Collection Name"
                  )}
                  tokenCount={props.tokenCount}
                />
              </Col>
            </>
          )}
          {view === ContentView.PROVENANCE && (
            <Col className="pt-4 pb-4">
              <NextGenTokenProvenance
                token_id={props.token.id}
                collection={props.collection}
              />
            </Col>
          )}
          {view === ContentView.DISPLAY_CENTER && (
            <Col className="pt-4 pb-4">
              <NextGenTokenRenderCenter token={props.token} />
            </Col>
          )}
          {view === ContentView.RARITY && (
            <Col className="pt-4 pb-4">
              <NextgenTokenRarity
                collection={props.collection}
                token={props.token}
                traits={props.traits}
                tokenCount={props.tokenCount}
              />
            </Col>
          )}
        </Row>
      </Container>
    );
  }

  function printPreviousToken() {
    const hasPreviousToken = props.token.normalised_id > 0;
    const prev = (
      <FontAwesomeIcon
        title="Previous Token"
        icon={faChevronCircleLeft}
        onClick={() => {
          if (!hasPreviousToken) {
            return;
          }
          const currentHref = window.location.href;
          const prevHref = currentHref.replace(
            props.token.id.toString(),
            (props.token.id - 1).toString()
          );
          window.location.href = prevHref;
        }}
        style={{
          height: "35px",
          color: hasPreviousToken ? "#fff" : "#9a9a9a",
          cursor: hasPreviousToken ? "pointer" : "default",
        }}
      />
    );
    if (hasPreviousToken) {
      return (
        <Tippy content={"Previous Token"} theme={"light"} delay={100}>
          {prev}
        </Tippy>
      );
    }
    return prev;
  }

  function printNextToken() {
    const hasNextToken = props.tokenCount - 1 > props.token.normalised_id;
    const next = (
      <FontAwesomeIcon
        icon={faChevronCircleRight}
        onClick={() => {
          if (!hasNextToken) {
            return;
          }
          const currentHref = window.location.href;
          const nextHref = currentHref.replace(
            props.token.id.toString(),
            (props.token.id + 1).toString()
          );
          window.location.href = nextHref;
        }}
        style={{
          height: "35px",
          color: hasNextToken ? "#fff" : "#9a9a9a",
          cursor: hasNextToken ? "pointer" : "default",
        }}
      />
    );
    if (hasNextToken) {
      return (
        <Tippy content={"Next Token"} theme={"light"} delay={100}>
          {next}
        </Tippy>
      );
    }
    return next;
  }

  function printToken() {
    return (
      <>
        <Container fluid className={`${styles.tokenContainer} pt-4 pb-4`}>
          <Row>
            <Col>
              <Container>
                <Row className="pb-2">
                  <Col className="d-flex align-items-center justify-content-between">
                    <span className="d-flex flex-column">
                      <span className="d-flex gap-3">
                        <h1 className="mb-0 font-color">{props.token.name}</h1>
                        {(props.token.burnt ||
                          isNullAddress(props.token.owner)) && (
                          <Tippy content={"Burnt"} theme={"light"} delay={100}>
                            <FontAwesomeIcon
                              icon={faFire}
                              style={{ height: "35px", color: "#c51d34" }}
                            />
                          </Tippy>
                        )}
                      </span>
                      <NextGenBackToCollectionPageLink
                        collection={props.collection}
                      />
                    </span>
                    <span className="d-flex gap-2">
                      {printPreviousToken()}
                      {printNextToken()}
                    </span>
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
