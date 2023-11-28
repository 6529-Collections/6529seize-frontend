import styles from "./NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useState } from "react";
import { AdditionalData, Info, PhaseTimes } from "../nextgen_entities";
import NextGenTokenPreview from "./NextGenTokenPreview";
import {
  retrieveCollectionAdditionalData,
  retrieveCollectionInfo,
  retrieveCollectionPhases,
  retrieveTokensIndex,
} from "../nextgen_helpers";

interface Props {
  collection: number;
  setPhaseTimes: (phaseTimes: PhaseTimes) => void;
}

export default function NextGenCollectionPreview(props: Readonly<Props>) {
  const [sampleToken, setSampleToken] = useState<number>(0);

  const [info, setInfo] = useState<Info>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();

  retrieveTokensIndex("min", props.collection, (data: number) => {
    setSampleToken(data);
  });

  retrieveCollectionInfo(props.collection, (data: Info) => {
    setInfo(data);
  });

  retrieveCollectionAdditionalData(props.collection, (data: AdditionalData) => {
    setAdditionalData(data);
  });

  retrieveCollectionPhases(props.collection, (data: PhaseTimes) => {
    props.setPhaseTimes(data);
  });

  if (!additionalData || additionalData.total_supply == 0) {
    return <></>;
  }

  return (
    <a
      href={`/nextgen/collection/${props.collection}`}
      className="decoration-none scale-hover">
      <Container className={styles.collectionPreview}>
        <Row>
          <Col className="pt-2 pb-2">
            <NextGenTokenPreview
              token_id={sampleToken}
              collection={props.collection}
              hide_info={true}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Container className={styles.collectionPreviewTitle}>
              {info && (
                <>
                  <Row>
                    <Col className="font-larger">
                      <b>
                        #{props.collection} - {info.name}
                      </b>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      by <b>{info.artist}</b>
                    </Col>
                  </Row>
                </>
              )}
              <Row>
                <Col className="font-color-h d-flex">
                  {additionalData && additionalData.circulation_supply > 0 && (
                    <>
                      {additionalData.circulation_supply} /{" "}
                      {additionalData.total_supply} minted
                    </>
                  )}
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </a>
  );
}
