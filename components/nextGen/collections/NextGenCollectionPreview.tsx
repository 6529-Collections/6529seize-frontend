import styles from "./NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { PhaseTimes } from "../nextgen_entities";
import {
  useTokensIndex,
  useSharedState,
  useCollectionPhasesHook,
  useCollectionAdditionalHook,
  useCollectionInfoHook,
} from "../nextgen_helpers";
import { NextGenTokenImage } from "./NextGenTokenImage";

interface Props {
  collection: number;
  setPhaseTimes: (phaseTimes: PhaseTimes) => void;
}

export default function NextGenCollectionPreview(props: Readonly<Props>) {
  const {
    info,
    setInfo,
    additionalData,
    setAdditionalData,
    sampleToken,
    setSampleToken,
  } = useSharedState();

  useTokensIndex("min", props.collection, (data: number) => {
    setSampleToken(data);
  });

  useCollectionPhasesHook(props.collection, props.setPhaseTimes);
  useCollectionAdditionalHook(props.collection, setAdditionalData);
  useCollectionInfoHook(props.collection, setInfo);

  if (!additionalData || additionalData.circulation_supply === 0) {
    return <></>;
  }

  return (
    <a
      href={`/nextgen/collection/${props.collection}`}
      className="decoration-none">
      <Container className={styles.collectionPreview}>
        <Row>
          <Col className="pb-4">
            <NextGenTokenImage
              collection={props.collection}
              token_id={sampleToken}
              hide_link={true}
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
