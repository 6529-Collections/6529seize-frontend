import styles from "./NextGenToken.module.scss";

import { Accordion, Col, Container, Row } from "react-bootstrap";
import { NextGenToken, NextGenTrait } from "../../../../entities/INextgen";
import { useState } from "react";
import Toggle from "react-toggle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";

interface Props {
  collection_id: number;
  token: NextGenToken;
  traits: NextGenTrait[];
  tokenCount: number;
}

function TraitAccordion(
  props: Readonly<{
    title: string;
    score: number;
    rank: number;
    token_count: number;
    collection_id: number;
    traits?: {
      trait: string;
      value: string;
      score: number;
      rank: number;
      trait_count: number;
    }[];
  }>
) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className="d-flex justify-content-between">
          <Container>
            <Row>
              <Col xs={5}>{props.title}</Col>
              <Col xs={5} className="d-flex align-items-center gap-5">
                <span>
                  #{props.rank.toLocaleString()}/
                  {props.token_count.toLocaleString()}
                </span>
                <span>
                  {Number(
                    props.score.toFixed(props.score > 100 ? 2 : 3)
                  ).toLocaleString()}
                </span>
              </Col>
            </Row>
          </Container>
        </Accordion.Button>
        {props.traits && (
          <Accordion.Body className={styles.tokenPropertiesAccordionBody}>
            <Container>
              {props.traits.map((t) => (
                <Row
                  className="pt-2 pb-2"
                  key={`trait-${t.trait.replaceAll(
                    " ",
                    "-"
                  )}-${t.value.replaceAll(" ", "-")}`}>
                  <Col xs={5}>
                    <span className="font-color-h">{t.trait}:</span>{" "}
                    <a
                      href={`/nextgen/collection/${props.collection_id}/art?traits=${t.trait}:${t.value}`}>
                      {t.value}
                    </a>
                  </Col>
                  <Col xs={5} className="d-flex align-items-center gap-5">
                    <span>
                      #{t.rank}/{t.trait_count}
                    </span>
                    <span>
                      {Number(
                        t.score.toFixed(t.score > 100 ? 2 : 3)
                      ).toLocaleString()}
                    </span>
                  </Col>
                </Row>
              ))}
            </Container>
          </Accordion.Body>
        )}
      </Accordion.Item>
    </Accordion>
  );
}

export default function NextgenTokenProperties(props: Readonly<Props>) {
  // const [showNormalised, setShowNormalised] = useState(false);

  return (
    <Container className="no-padding">
      <Row>
        <Col className="pb-3">
          <h3 className="mb-0">Rarity</h3>
        </Col>
      </Row>
      <Row>
        <Col>
          <p>Please be careful with rarity in generative collections.</p>
          <p>
            While it can be an interesting thing to know, many less experienced
            collectors over-estimate its importance. A piece of generative art
            can be rare but not aesthetically pleasing. Rarity also does not
            necessarily correlate to the value of a piece of generative art.
          </p>
        </Col>
      </Row>
      <Row className="pt-4 pb-2">
        <Col className="font-larger font-bolder">{props.token.name}</Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <TraitAccordion
            title={"Rarity"}
            score={props.token.rarity_score}
            rank={props.token.rarity_score_rank}
            collection_id={props.collection_id}
            token_count={props.tokenCount}
            traits={props.traits.map((t) => ({
              trait: t.trait,
              value: t.value,
              score: t.rarity_score,
              rank: t.rarity_score_rank,
              trait_count: t.trait_count,
            }))}
          />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <TraitAccordion
            title={"Rarity with Trait Normalization"}
            score={props.token.rarity_score_normalised}
            rank={props.token.rarity_score_normalised_rank}
            collection_id={props.collection_id}
            token_count={props.tokenCount}
            traits={props.traits.map((t) => ({
              trait: t.trait,
              value: t.value,
              score: t.rarity_score_normalised,
              rank: t.rarity_score_normalised_rank,
              trait_count: t.trait_count,
            }))}
          />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <TraitAccordion
            title={"Statistical Rarity"}
            score={props.token.statistical_score}
            rank={props.token.statistical_score_rank}
            collection_id={props.collection_id}
            token_count={props.tokenCount}
            traits={props.traits.map((t) => ({
              trait: t.trait,
              value: t.value,
              score: 0,
              rank: 0,
              trait_count: t.trait_count,
            }))}
          />
        </Col>
      </Row>
      {/* <Row className="pt-4">
        <Col>
          <span className="d-flex align-items-center gap-2">
            <Toggle
              checked={showNormalised}
              onChange={() => {
                setShowNormalised(!showNormalised);
              }}
            />
            <span className="d-flex gap-2 align-items-center">
              Trait Normalization
              <Tippy
                content={
                  "This extends past the basic scoring formula. By normalizing in line with each method's aggregation approach, it ensures the scores are more relevant and fair across different traits."
                }
                placement={"top"}
                theme={"light"}>
                <FontAwesomeIcon
                  style={{ height: "20px", cursor: "help" }}
                  icon="info-circle"></FontAwesomeIcon>
              </Tippy>
            </span>
          </span>
        </Col>
      </Row> */}
      {/* <Row className="pt-5">
        <Col className="d-flex justify-content-end align-items-center">
          <span className="d-flex align-items-center gap-2">
            <Toggle
              checked={showNormalised}
              onChange={() => {
                setShowNormalised(!showNormalised);
              }}
            />
            <span className="d-flex gap-2 align-items-center">
              Trait Normalization
              <Tippy
                content={
                  "This extends past the basic scoring formula. By normalizing in line with each method's aggregation approach, it ensures the scores are more relevant and fair across different traits."
                }
                placement={"top"}
                theme={"light"}>
                <FontAwesomeIcon
                  style={{ height: "20px", cursor: "help" }}
                  icon="info-circle"></FontAwesomeIcon>
              </Tippy>
            </span>
          </span>
        </Col>
      </Row>
      <Row className="pt-2 pb-5">
        {traits.map((t) => (
          <Col
            xs={12}
            md={6}
            key={`trait-${t.trait.replaceAll(" ", "-")}`}
            className="pt-1 pb-1">
            <a
              className="decoration-none"
              href={`/nextgen/collection/${props.collection_id}/art?traits=${t.trait}:${t.value}`}>
              <Container className={styles.traitDiv}>
                <Row className="pt-2 pb-2">
                  <Col xs={6} className="d-flex flex-column">
                    <span>{t.trait}</span>
                    <span>{t.value}</span>
                  </Col>
                  <Col
                    xs={3}
                    className="d-flex flex-column align-items-center justify-content-center">
                    <span className="font-smaller font-color-h">Score</span>
                    <span>
                      {Number(
                        showNormalised
                          ? t.rarity_score_normalised.toFixed(2)
                          : t.rarity_score.toFixed(2)
                      ).toLocaleString()}
                    </span>
                  </Col>
                  <Col
                    xs={3}
                    className="d-flex flex-column align-items-center justify-content-center">
                    <span className="font-smaller font-color-h">Rarity</span>
                    <span>{Number(t.rarity.toFixed(2)).toLocaleString()}%</span>
                  </Col>
                </Row>
              </Container>
            </a>
          </Col>
        ))}
      </Row> */}
    </Container>
  );
}

export function NextgenTokenTraits(props: Readonly<Props>) {
  return (
    <Container className="no-padding">
      <Row>
        <Col className="pb-3">
          <h3 className="mb-0">Traits</h3>
        </Col>
      </Row>
      {props.traits.map((t) => (
        <Row key={`trait-${t.trait.replaceAll(" ", "-")}`}>
          <Col className="pb-3 d-flex gap-2">
            <span className="font-color-h">{t.trait}:</span>
            <span>
              <a
                href={`/nextgen/collection/${props.collection_id}/art?traits=${t.trait}:${t.value}`}>
                {t.value}
              </a>
            </span>
            <span className="font-color-h">
              {t.value_count}/{t.trait_count}
            </span>
          </Col>
        </Row>
      ))}
    </Container>
  );
}
