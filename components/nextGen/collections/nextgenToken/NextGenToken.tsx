import {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";
import { isNullAddress } from "@/helpers/Helpers";
import {
  faChevronCircleLeft,
  faChevronCircleRight,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Container, Row } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import {
  ContentView,
  printViewButton,
} from "../collectionParts/NextGenCollection";
import { NextGenBackToCollectionPageLink } from "../collectionParts/NextGenCollectionHeader";
import styles from "../NextGen.module.scss";
import NextGenTokenAbout from "./NextGenTokenAbout";
import NextGenTokenArt from "./NextGenTokenArt";
import NextgenTokenRarity, {
  NextgenTokenTraits,
} from "./NextGenTokenProperties";
import NextGenTokenProvenance from "./NextGenTokenProvenance";
import NextGenTokenRenderCenter from "./NextGenTokenRenderCenter";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
  traits: NextGenTrait[];
  tokenCount: number;
  view: ContentView;
  setView: (view: ContentView) => void;
}

export default function NextGenTokenPage(props: Readonly<Props>) {
  function printDetails() {
    return (
      <Container className="pt-4">
        <Row>
          <Col className="d-flex gap-4">
            {printViewButton(props.view, ContentView.ABOUT, props.setView)}
            {printViewButton(props.view, ContentView.PROVENANCE, props.setView)}
            {printViewButton(
              props.view,
              ContentView.DISPLAY_CENTER,
              props.setView
            )}
            {printViewButton(props.view, ContentView.RARITY, props.setView)}
          </Col>
        </Row>
        <Row>
          {props.view === ContentView.ABOUT && (
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
          {props.view === ContentView.PROVENANCE && (
            <Col className="pt-4 pb-4">
              <NextGenTokenProvenance
                token_id={props.token.id}
                collection={props.collection}
              />
            </Col>
          )}
          {props.view === ContentView.DISPLAY_CENTER && (
            <Col className="pt-4 pb-4">
              <NextGenTokenRenderCenter token={props.token} />
            </Col>
          )}
          {props.view === ContentView.RARITY && (
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
        data-tooltip-id={
          hasPreviousToken ? `prev-token-${props.token.id}` : undefined
        }
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
    return (
      <>
        {prev}
        {hasPreviousToken && (
          <Tooltip
            id={`prev-token-${props.token.id}`}
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}>
            Previous Token
          </Tooltip>
        )}
      </>
    );
  }

  function printNextToken() {
    const hasNextToken = props.tokenCount - 1 > props.token.normalised_id;
    const next = (
      <FontAwesomeIcon
        icon={faChevronCircleRight}
        data-tooltip-id={
          hasNextToken ? `next-token-${props.token.id}` : undefined
        }
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
    return (
      <>
        {next}
        {hasNextToken && (
          <Tooltip
            id={`next-token-${props.token.id}`}
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}>
            Next Token
          </Tooltip>
        )}
      </>
    );
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
                          <>
                            <FontAwesomeIcon
                              icon={faFire}
                              data-tooltip-id={`burnt-token-${props.token.id}`}
                              style={{ height: "35px", color: "#c51d34" }}
                            />
                            <Tooltip
                              id={`burnt-token-${props.token.id}`}
                              style={{
                                backgroundColor: "#1F2937",
                                color: "white",
                                padding: "4px 8px",
                              }}>
                              Burnt
                            </Tooltip>
                          </>
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
