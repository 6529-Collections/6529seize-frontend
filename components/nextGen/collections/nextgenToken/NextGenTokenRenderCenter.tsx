import styles from "./NextGenToken.module.scss";
import { Col, Container, Dropdown, Row } from "react-bootstrap";
import NextGenTokenDownload, { Resolution } from "./NextGenTokenDownload";
import { NextGenToken } from "../../../../entities/INextgen";
import { useState } from "react";
import { mainnet } from "wagmi/chains";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import { numberWithCommas } from "../../../../helpers/Helpers";
import { NEXTGEN_CHAIN_ID } from "../../nextgen_contracts";
import { NEXTGEN_GENERATOR_BASE_URL } from "../../../../constants";

export default function NextgenTokenRenderCenter(
  props: Readonly<{ token: NextGenToken }>
) {
  return (
    <Container className="no-padding">
      <Row>
        <Col className="pb-3">
          <h3 className="mb-0">Display Center</h3>
        </Col>
      </Row>
      <Row>
        <Col sm={12} md={6} className="pb-3 d-flex flex-wrap gap-2">
          <span className="font-color-h">Rendered Versions:</span>
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
        <Col sm={12} md={6} className="pb-3 d-flex flex-column gap-2">
          <span className="font-color-h">For Thumbnail Use Only :</span>
          <NextGenTokenDownload
            token={props.token}
            resolution={Resolution["Thumbnail"]}
          />
          <NextGenTokenDownload
            token={props.token}
            resolution={Resolution["0.5K"]}
          />
        </Col>
      </Row>
      <Row className="pt-3">
        <CustomRender token={props.token} />
      </Row>
    </Container>
  );
}

function CustomRender(props: Readonly<{ token: NextGenToken }>) {
  enum RenderType {
    ANIMATED = "Animated",
    STATIC = "Static",
  }
  enum ScriptVersion {
    FINAL = "Final",
    OG = "OG",
  }

  const [renderType, setRenderType] = useState<RenderType>(RenderType.ANIMATED);
  const [scriptVersion, setScriptVersion] = useState<ScriptVersion>(
    ScriptVersion.FINAL
  );
  const [height, setHeight] = useState<number | null>(null);

  function go() {
    const chainId = NEXTGEN_CHAIN_ID;
    let url = `${NEXTGEN_GENERATOR_BASE_URL}/${
      chainId === mainnet.id ? "mainnet" : "testnet"
    }/html/${props.token.id}`;

    let params = new URLSearchParams();
    if (renderType === RenderType.STATIC) {
      params.append("render_static", "true");
    }
    if (scriptVersion === ScriptVersion.OG) {
      params.append("render_og", "true");
    }
    if (height) {
      params.append("height", height.toString());
    }
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    window.open(url, "_blank");
  }

  return (
    <Container
      style={{
        minHeight: "150px",
      }}>
      <Row>
        <Col>
          <span className="font-color-h">Custom Render:</span>
        </Col>
      </Row>
      <Row>
        <Col className="d-flex flex-wrap gap-2">
          <Dropdown
            drop={"down-centered"}
            className={`${styles.customRenderDropdown} d-flex align-items-center gap-2`}>
            <span className="font-color-h">Render Type:</span>
            <Dropdown.Toggle>{renderType}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(RenderType).map((type) => (
                <Dropdown.Item
                  key={getRandomObjectId()}
                  onClick={() => {
                    setRenderType(type as RenderType);
                  }}>
                  {type}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown
            drop={"down-centered"}
            className={`${styles.customRenderDropdown} d-flex align-items-center gap-2`}>
            <span className="font-color-h">Script Version:</span>
            <Dropdown.Toggle>{scriptVersion}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(ScriptVersion).map((version) => (
                <Dropdown.Item
                  key={getRandomObjectId()}
                  onClick={() => {
                    setScriptVersion(version as ScriptVersion);
                  }}>
                  {version}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown
            drop={"down-centered"}
            className={`${styles.customRenderDropdown} d-flex align-items-center gap-2`}>
            <span className="font-color-h">Height:</span>
            <Dropdown.Toggle>
              {height ? `${numberWithCommas(height)} px` : "Screen Size"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item
                onClick={() => {
                  setHeight(null);
                }}>
                Screen Size
              </Dropdown.Item>
              <Dropdown.Item
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}>
                <span className="d-flex gap-2">
                  <span>Custom Height (pixels):</span>
                  <input
                    type="number"
                    placeholder="enter height"
                    className={styles.customRenderInput}
                    value={height ?? ""}
                    onChange={(e) => {
                      setHeight(parseInt(e.target.value));
                    }}
                  />
                </span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <button
            className={`pt-2 pb-2 seize-btn no-wrap ${styles.sceneBtn}`}
            onClick={() => {
              go();
            }}>
            <span>GO!</span>
          </button>
        </Col>
      </Row>
    </Container>
  );
}
