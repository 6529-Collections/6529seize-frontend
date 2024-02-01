import styles from "./NextGenToken.module.scss";

import { Col, Container, Row } from "react-bootstrap";
import { NextGenTrait } from "../../../../entities/INextgen";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";
import Toggle from "react-toggle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";

interface Props {
  collection_id: number;
  token_id: number;
}

export default function NextgenTokenProperties(props: Readonly<Props>) {
  const [traits, setTraits] = useState<NextGenTrait[]>([]);
  const [showNormalised, setShowNormalised] = useState(false);

  useEffect(() => {
    commonApiFetch<NextGenTrait[]>({
      endpoint: `nextgen/tokens/${props.token_id}/traits`,
    }).then((response) => {
      setTraits(response);
    });
  }, [props.token_id]);

  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex justify-content-end align-items-center">
          {/* <h5>Traits</h5> */}
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
      </Row>
    </Container>
  );
}
