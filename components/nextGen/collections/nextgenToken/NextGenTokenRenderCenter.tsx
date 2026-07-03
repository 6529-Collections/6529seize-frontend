"use client";

import { NEXTGEN_CHAIN_ID } from "@/components/nextGen/nextgen_contracts";
import { NEXTGEN_GENERATOR_BASE_URL } from "@/constants/constants";
import type { NextGenToken } from "@/entities/INextgen";
import { numberWithCommas } from "@/helpers/Helpers";
import { useState } from "react";
import { mainnet } from "wagmi/chains";
import styles from "./NextGenToken.module.css";
import NextGenTokenDownload, { Resolution } from "./NextGenTokenDownload";

export default function NextgenTokenRenderCenter(
  props: Readonly<{ token: NextGenToken }>
) {
  return (
    <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-pb-4 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h3 className="tw-mb-0">Display Center</h3>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div
          className="tw-pb-4 tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-flex-wrap tw-gap-2 tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
          style={{ maxWidth: "100%" }}
        >
          <span className="tw-text-[#9a9a9a]">Rendered Versions:</span>
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
          className="tw-pb-4 tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-flex-col tw-gap-2 tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
          style={{ maxWidth: "100%" }}
        >
          <span className="tw-text-[#9a9a9a]">For Thumbnail Use Only :</span>
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
      <div className="tw-pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
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
          <span className="tw-text-[#9a9a9a]">Custom Render:</span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-flex-wrap tw-gap-2 tw-px-3">
          <label
            className={`${styles["customRenderDropdown"]} tw-flex tw-items-center tw-gap-2`}
          >
            <span className="tw-text-[#9a9a9a]">Render Type:</span>
            <select
              value={renderType}
              onChange={(event) => {
                setRenderType(event.target.value as RenderType);
              }}
              className="tw-cursor-pointer tw-rounded-md tw-border-0 tw-bg-transparent tw-py-1 tw-pl-1 tw-pr-8 tw-text-lg tw-font-bold tw-text-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
              style={{ colorScheme: "dark" }}
            >
              {Object.values(RenderType).map((type) => (
                <option
                  key={type}
                  value={type}
                  className="tw-bg-black tw-text-white"
                >
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label
            className={`${styles["customRenderDropdown"]} tw-flex tw-items-center tw-gap-2`}
          >
            <span className="tw-text-[#9a9a9a]">Script Version:</span>
            <select
              value={scriptVersion}
              onChange={(event) => {
                setScriptVersion(event.target.value as ScriptVersion);
              }}
              className="tw-cursor-pointer tw-rounded-md tw-border-0 tw-bg-transparent tw-py-1 tw-pl-1 tw-pr-8 tw-text-lg tw-font-bold tw-text-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
              style={{ colorScheme: "dark" }}
            >
              {Object.values(ScriptVersion).map((version) => (
                <option
                  key={version}
                  value={version}
                  className="tw-bg-black tw-text-white"
                >
                  {version}
                </option>
              ))}
            </select>
          </label>
          <label
            className={`${styles["customRenderDropdown"]} tw-flex tw-items-center tw-gap-2`}
          >
            <span className="tw-text-[#9a9a9a]">Height:</span>
            <span className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-min-w-[88px] tw-text-left tw-text-lg tw-font-bold tw-text-white">
                {height ? `${numberWithCommas(height)} px` : "Screen Size"}
              </span>
              <input
                type="number"
                min={1}
                placeholder="enter height"
                aria-label="Custom render height in pixels"
                className={`${styles["customRenderInput"]} tw-rounded-md tw-border-0 tw-px-2 tw-py-1 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400`}
                value={height ?? ""}
                onChange={(e) => {
                  const nextHeight = Number.parseInt(e.target.value, 10);
                  setHeight(
                    Number.isNaN(nextHeight) || nextHeight < 1
                      ? null
                      : nextHeight
                  );
                }}
              />
            </span>
          </label>
          <button
            className={`tw-whitespace-nowrap tw-min-w-fit tw-rounded-none tw-border-0 tw-px-5 tw-py-2 tw-font-bold ${styles["sceneBtn"]}`}
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
