"use client";

import { NEXTGEN_CHAIN_ID } from "@/components/nextGen/nextgen_contracts";
import { NEXTGEN_GENERATOR_BASE_URL } from "@/constants/constants";
import type { NextGenToken } from "@/entities/INextgen";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { numberWithCommas } from "@/helpers/Helpers";
import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { mainnet } from "wagmi/chains";
import styles from "./NextGenToken.module.scss";
import NextGenTokenDownload, { Resolution } from "./NextGenTokenDownload";

export default function NextgenTokenRenderCenter(
  props: Readonly<{ token: NextGenToken }>
) {
  return (
    <div className="no-padding tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="pb-3 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h3 className="mb-0">Display Center</h3>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div
          className="pb-3 d-flex flex-wrap gap-2 tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
          style={{ maxWidth: "100%" }}
        >
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
        </div>
        <div
          className="pb-3 d-flex flex-column gap-2 tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
          style={{ maxWidth: "100%" }}
        >
          <span className="font-color-h">For Thumbnail Use Only :</span>
          <NextGenTokenDownload
            token={props.token}
            resolution={Resolution["Thumbnail"]}
          />
          <NextGenTokenDownload
            token={props.token}
            resolution={Resolution["0.5K"]}
          />
        </div>
      </div>
      <div className="pt-3 -tw-mx-3 tw-flex tw-flex-wrap">
        <CustomRender token={props.token} />
      </div>
    </div>
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
    <div
      className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]"
      style={{
        minHeight: "150px",
      }}
    >
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <span className="font-color-h">Custom Render:</span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="d-flex flex-wrap gap-2 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <Dropdown
            drop={"down-centered"}
            className={`${styles["customRenderDropdown"]} d-flex align-items-center gap-2`}
          >
            <span className="font-color-h">Render Type:</span>
            <Dropdown.Toggle>{renderType}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(RenderType).map((type) => (
                <Dropdown.Item
                  key={getRandomObjectId()}
                  onClick={() => {
                    setRenderType(type as RenderType);
                  }}
                >
                  {type}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown
            drop={"down-centered"}
            className={`${styles["customRenderDropdown"]} d-flex align-items-center gap-2`}
          >
            <span className="font-color-h">Script Version:</span>
            <Dropdown.Toggle>{scriptVersion}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(ScriptVersion).map((version) => (
                <Dropdown.Item
                  key={getRandomObjectId()}
                  onClick={() => {
                    setScriptVersion(version as ScriptVersion);
                  }}
                >
                  {version}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown
            drop={"down-centered"}
            className={`${styles["customRenderDropdown"]} d-flex align-items-center gap-2`}
          >
            <span className="font-color-h">Height:</span>
            <Dropdown.Toggle>
              {height ? `${numberWithCommas(height)} px` : "Screen Size"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item
                onClick={() => {
                  setHeight(null);
                }}
              >
                Screen Size
              </Dropdown.Item>
              <Dropdown.Item
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <span className="d-flex gap-2">
                  <span>Custom Height (pixels):</span>
                  <input
                    type="number"
                    placeholder="enter height"
                    className={styles["customRenderInput"]}
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
            className={`pt-2 pb-2 seize-btn no-wrap ${styles["sceneBtn"]}`}
            onClick={() => {
              go();
            }}
          >
            <span>GO!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
