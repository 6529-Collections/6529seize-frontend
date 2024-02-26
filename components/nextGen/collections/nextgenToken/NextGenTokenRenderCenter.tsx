import styles from "./NextGenToken.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { NextGenTokenImageMode } from "../../nextgen_helpers";
import NextGenTokenDownload, { Resolution } from "./NextGenTokenDownload";
import { NextGenCollection, NextGenToken } from "../../../../entities/INextgen";
import { NEXTGEN_TOKEN_SCENES } from "./NextGenTokenScene";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";

export default function NextgenTokenRenderCenter(
  props: Readonly<{
    collection: NextGenCollection;
    token: NextGenToken;
    mode: NextGenTokenImageMode;
    setMode: (mode: NextGenTokenImageMode) => void;
  }>
) {
  return (
    <Container className="no-padding">
      <Row>
        <Col className="pb-3">
          <h3 className="mb-0">Display Center</h3>
        </Col>
      </Row>
      <Row>
        <Col sm={12} md={6} className="pb-3 d-flex flex-column gap-2">
          <span className="font-color-h font-larger">Scenes:</span>
          <span className="d-flex flex-wrap gap-3">
            {NEXTGEN_TOKEN_SCENES.map((scene) => (
              <SceneButton
                key={getRandomObjectId()}
                mode={scene.mode}
                selecedMode={props.mode}
                setMode={props.setMode}
              />
            ))}
          </span>
        </Col>
        <Col sm={12} md={6} className="pb-3 d-flex flex-column gap-2">
          <span className="font-color-h font-larger">Rendered Versions:</span>
          <NextGenTokenDownload
            token={props.token}
            resolution={Resolution["1K"]}
          />
          <NextGenTokenDownload
            token={props.token}
            resolution={Resolution["2K"]}
          />
          <NextGenTokenDownload
            token={props.token}
            resolution={Resolution["4K"]}
          />
          <NextGenTokenDownload
            token={props.token}
            resolution={Resolution["8K"]}
          />
          <NextGenTokenDownload
            token={props.token}
            resolution={Resolution["16K"]}
          />
        </Col>
      </Row>
    </Container>
  );
}

function SceneButton(
  props: Readonly<{
    mode: NextGenTokenImageMode;
    selecedMode: NextGenTokenImageMode;
    setMode: (mode: NextGenTokenImageMode) => void;
  }>
) {
  return (
    <button
      className={`pt-2 pb-2 seize-btn no-wrap ${styles.sceneBtn} ${
        props.mode == props.selecedMode ? styles.sceneBtnSelected : ""
      }`}
      onClick={() => {
        props.setMode(props.mode);
      }}>
      <span className="font-larger">{props.mode}</span>
    </button>
  );
}
