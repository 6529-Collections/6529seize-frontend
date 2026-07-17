"use client";

import { NEXTGEN_CHAIN_ID } from "@/components/nextGen/nextgen_contracts";
import { NEXTGEN_GENERATOR_BASE_URL } from "@/constants/constants";
import type { NextGenToken } from "@/entities/INextgen";
import { numberWithCommas } from "@/helpers/Helpers";
import { useState } from "react";
import { mainnet } from "wagmi/chains";
import NextGenTokenDownload, { Resolution } from "./NextGenTokenDownload";

export default function NextgenTokenRenderCenter(
  props: Readonly<{ token: NextGenToken }>
) {
  return (
    <section>
      <h2 className="tw-mb-5 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
        Display Center
      </h2>
      <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5">
        <div className="tw-grid tw-gap-5 lg:tw-grid-cols-[2fr_1fr]">
          <div>
            <h3 className="tw-mb-3 tw-mt-0 tw-text-base tw-font-semibold tw-text-white">
              Rendered Versions
            </h3>
            <div className="tw-grid tw-gap-2">
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
          </div>
          <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5 lg:tw-border-0 lg:tw-border-l lg:tw-border-solid lg:tw-border-white/10 lg:tw-pl-5 lg:tw-pt-0">
            <h3 className="tw-mb-3 tw-mt-0 tw-text-base tw-font-semibold tw-text-white">
              For Thumbnail Use Only
            </h3>
            <div className="tw-grid tw-gap-2">
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
        </div>
      </section>
      <div className="tw-mt-4">
        <CustomRender token={props.token} />
      </div>
    </section>
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
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5">
      <h3 className="tw-mb-3 tw-mt-0 tw-text-lg tw-font-semibold tw-text-white">
        Custom Render
      </h3>
      <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-[1fr_1fr_1.35fr_auto] lg:tw-items-end">
        <label className="tw-grid tw-gap-2">
          <span className="tw-text-sm tw-font-medium tw-text-iron-400">
            Render Type
          </span>
          <select
            value={renderType}
            onChange={(event) => {
              setRenderType(event.target.value as RenderType);
            }}
            className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/20 tw-px-3 tw-py-2 tw-text-base tw-text-white tw-[color-scheme:dark] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
        <label className="tw-grid tw-gap-2">
          <span className="tw-text-sm tw-font-medium tw-text-iron-400">
            Script Version
          </span>
          <select
            value={scriptVersion}
            onChange={(event) => {
              setScriptVersion(event.target.value as ScriptVersion);
            }}
            className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/20 tw-px-3 tw-py-2 tw-text-base tw-text-white tw-[color-scheme:dark] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
        <label className="tw-grid tw-gap-2">
          <span className="tw-text-sm tw-font-medium tw-text-iron-400">
            Height{" "}
            {height ? `(${numberWithCommas(height)} px)` : "(screen size)"}
          </span>
          <input
            type="number"
            min={1}
            placeholder="enter height"
            aria-label="Custom render height in pixels"
            className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/20 tw-px-3 tw-py-2 tw-text-base tw-text-white tw-[color-scheme:dark] placeholder:tw-text-iron-500 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            value={height ?? ""}
            onChange={(e) => {
              const nextHeight = Number.parseInt(e.target.value, 10);
              setHeight(
                Number.isNaN(nextHeight) || nextHeight < 1 ? null : nextHeight
              );
            }}
          />
        </label>
        <button
          type="button"
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-white tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-950 tw-transition hover:tw-bg-iron-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          onClick={() => {
            go();
          }}
        >
          Open Render
        </button>
      </div>
    </section>
  );
}
