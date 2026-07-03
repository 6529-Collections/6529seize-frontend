"use client";

import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import type { NextGenCollection } from "@/entities/INextgen";
import { formatAddress } from "@/helpers/Helpers";
import { NextgenCollectionView } from "@/types/enums";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import { goerli, sepolia } from "viem/chains";
import { DistributionLink } from "../NextGen";
import styles from "../NextGen.module.scss";
import NextGenCollectionProvenance from "./NextGenCollectionProvenance";
import NextGenTraitSets from "./NextGenTraitSets";

interface CollectionProps {
  collection: NextGenCollection;
}

interface Props extends CollectionProps {
  view: NextgenCollectionView;
}

function NextGenCollectionDetailsOverview(props: Readonly<CollectionProps>) {
  function getEtherscanLink() {
    let chainName = "";
    if (NEXTGEN_CHAIN_ID === sepolia.id) {
      chainName = "sepolia.";
    }
    if (NEXTGEN_CHAIN_ID === goerli.id) {
      chainName = "goerli.";
    }

    return `https://${chainName}etherscan.io/address/${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}`;
  }

  return (
    <div className="!tw-p-0 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <div className="!tw-p-0 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
            <div className="-tw-mx-3 tw-flex tw-flex-wrap">
              <div
                className="tw-pt-2 tw-pb-2 tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/3 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
                style={{ maxWidth: "100%" }}
              >
                {props.collection.artist_signature && (
                  <>
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                      <div className="tw-text-[#9a9a9a] tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        Artist Signature
                      </div>
                    </div>
                    <div className="tw-pb-2 -tw-mx-3 tw-flex tw-flex-wrap">
                      <div
                        className="tw-pt-2 tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                        style={{ maxWidth: "100%" }}
                      >
                        <div className={styles["artistSignature"]}>
                          {props.collection.artist_signature}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                  <div
                    className="tw-pt-2 tw-pb-2 tw-flex tw-flex-col tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                    style={{ maxWidth: "100%" }}
                  >
                    <span className="tw-text-[#9a9a9a]">Allowlist</span>
                    <DistributionLink collection={props.collection} />
                  </div>
                  <div
                    className="tw-pt-2 tw-pb-2 tw-flex tw-gap-12 tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                    style={{ maxWidth: "100%" }}
                  >
                    <span className="tw-flex tw-flex-col">
                      <span className="tw-text-[#9a9a9a]">License</span>
                      <span>{props.collection.licence}</span>
                    </span>
                    <span className="tw-flex tw-flex-col">
                      <span className="tw-text-[#9a9a9a]">Library</span>
                      <span>
                        {props.collection.library
                          ? props.collection.library
                          : "-"}
                      </span>
                    </span>
                  </div>
                  <div
                    className="tw-pt-2 tw-pb-2 tw-flex tw-flex-col tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                    style={{ maxWidth: "100%" }}
                  >
                    <span className="tw-text-[#9a9a9a]">Contract</span>
                    <span>
                      <Link
                        className="tw-text-white tw-no-underline"
                        href={getEtherscanLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-tooltip-id={`contract-tooltip-${props.collection.id}`}
                      >
                        {formatAddress(NEXTGEN_CORE[NEXTGEN_CHAIN_ID])}
                      </Link>
                      <Tooltip
                        id={`contract-tooltip-${props.collection.id}`}
                        place="right"
                        delayShow={500}
                        style={{
                          backgroundColor: "#1F2937",
                          color: "white",
                          padding: "4px 8px",
                        }}
                      >
                        {NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}
                      </Tooltip>
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="tw-pt-2 tw-pb-2 tw-flex tw-flex-col tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-2/3 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
                style={{ maxWidth: "100%" }}
              >
                <span className="tw-text-[#9a9a9a]">Collection Overview</span>
                <span>{props.collection.description}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NextGenCollectionDetailsAbout() {
  return (
    <div className="!tw-p-0 tw-pt-6 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h4>About Pebbles</h4>
        </div>
      </div>
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <p>
            Pebbles aims to explore the order that can emerge from a small set
            of organically inspired elements of points, lines, textures, and
            light.
          </p>
        </div>
      </div>
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h4>History of Technical Innovation</h4>
        </div>
      </div>
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <p>
            ZeBlocks prides itself on technical innovation in its generative
            mints and on-chain work. Most ZeBlocks projects, including Pebbles,
            are 100% on-chain, and do not use any external libraries.
          </p>
          <p>Pebbles follows in the tradition of prior ZeBlocks projects:</p>
          <ul>
            <li>Unigrids: SVG-based generative art & music project</li>
            <li>
              Beatboxes: First fully immersive VR audiovisual generative art
            </li>
            <li>Sensthesia: Audio-sensitive generative art NFTs</li>
          </ul>
        </div>
      </div>
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h4>Pebbles: Matched To The Human Eye</h4>
        </div>
      </div>
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <p>
            Pebble is one of the highest-resolution generative collections ever
            released
          </p>
          <ul>
            <li>The Challenge:</li>
            <ul>
              <li>
                With the exception of SVG-based collections (that typically have
                simpler structures), most generative collections do not, in
                practice, have unlimited scalability resolution-wise
              </li>
              <li>
                An output can be scaled up and rendered to a higher resolution
                but if the underlying data point density does not exist in the
                algorithm, render quality will typically start to suffer above
                4K
              </li>
            </ul>
          </ul>
          <ul>
            <li>The Goal</li>
            <ul>
              <li>
                Pebbles aims to provide sufficient resolution to match or exceed
                the acuity of the human eye even in a world of wall-sized TVs or
                AR devices
              </li>
              <li>
                Under typical large-screen TV viewing distances, 4K or 8K is
                more than sufficient to exceed the acuity of the human eye
              </li>
              <li>
                If wall-size TVs become common in the future, the limit of human
                vision to discern differences in resolutions, under normal
                conditions, will move up to somewhere between 8K and 16K
              </li>
              <li>
                Pebbles is designed to have no loss of resolution at all up to
                12.5K and continue to provide extraordinary detail at 16K and
                beyond
              </li>
              <li>
                In practice, and under the large majority of future display
                conditions, every Pebble has more resolution than the human eye
                can discern
              </li>
            </ul>
          </ul>
          <ul>
            <li>The Approach</li>
            <ul>
              <li>The Pebble algorithm address this issue in two ways:</li>
              <ul>
                <li>Very dense number of data points</li>
                <li>
                  Matches the data points to the exact pixels available at each
                  render, regardless of resolution
                </li>
              </ul>
              <li>
                This makes it computationally expensive to render. Pebbles does
                not use p5.js or other processing libraries to improve rendering
                performance, particularly at large sizes.
              </li>
            </ul>
          </ul>
        </div>
      </div>
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h4>NextGen x Pebbles</h4>
        </div>
      </div>
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <p>
            NextGen will take the following approach to support Pebbles’s
            extraordinary resolution:
          </p>
          <ul>
            <li>
              On mint day, NextGen will initially render Pebble mints in 1K (it
              will still take several minutes per mint given the complexity).
              This will allow a first look at the outputs.
            </li>
            <li>
              Post mint, the base image will be re-rendered in 2K for online
              viewing.
            </li>
            <li>
              NextGen will also provide 4K, 8K and 16K renders for download and
              printing. We can’t wait for people to dig into these super high
              quality renders.
            </li>
            <li>
              Though NextGen can serve collection renders 100% on-chain, the
              switch to on-chain rendering for the Pebbles Collection will be
              delayed until GPU improvements allow for reasonable real-time
              rendering times. This does not impact other NextGen collections
              which can go fully on-chain independently.
            </li>
          </ul>
        </div>
      </div>
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h4>Key Collection Parameters</h4>
        </div>
      </div>
      <div className="tw-pb-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <table className="tw-w-full tw-border-collapse">
            <tbody>
              <tr>
                <th scope="row" className="tw-text-left tw-font-normal">
                  Collection Size:
                </th>
                <td>1,000 (or fewer, if fewer are minted in 24 hours)</td>
              </tr>
              <tr>
                <th scope="row" className="tw-text-left tw-font-normal">
                  Orientation:
                </th>
                <td>Vertical</td>
              </tr>
              <tr>
                <th scope="row" className="tw-text-left tw-font-normal">
                  Aspect Ratio:
                </th>
                <td>1:1.294</td>
              </tr>
              <tr>
                <th scope="row" className="tw-text-left tw-font-normal">
                  Script:
                </th>
                <td>Javascript</td>
              </tr>
              <tr>
                <th scope="row" className="tw-text-left tw-font-normal">
                  Script Size:
                </th>
                <td>17Kb</td>
              </tr>
              <tr>
                <th scope="row" className="tw-text-left tw-font-normal">
                  External libraries used:
                </th>
                <td>None</td>
              </tr>
              <tr>
                <th scope="row" className="tw-text-left tw-font-normal">
                  License:
                </th>
                <td>Creative Commons 0 (CC0)</td>
              </tr>
              <tr>
                <th scope="row" className="tw-text-left tw-font-normal">
                  Prints:
                </th>
                <td>
                  An official ZeBlocks approved printing process will be
                  available in a few weeks
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function NextGenCollectionDetails(props: Readonly<Props>) {
  if (props.view === NextgenCollectionView.PROVENANCE) {
    return <NextGenCollectionProvenance collection={props.collection} />;
  } else if (props.view === NextgenCollectionView.OVERVIEW) {
    return <NextGenCollectionDetailsOverview collection={props.collection} />;
  } else if (props.view === NextgenCollectionView.TOP_TRAIT_SETS) {
    return <NextGenTraitSets preview collection={props.collection} />;
  } else {
    return <NextGenCollectionDetailsAbout />;
  }
}
