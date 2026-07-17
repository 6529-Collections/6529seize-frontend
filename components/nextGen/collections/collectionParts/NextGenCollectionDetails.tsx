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
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-5 tw-shadow-lg sm:tw-p-6">
      <div className="tw-grid tw-gap-5 lg:tw-grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:tw-gap-6">
        <aside>
          {props.collection.artist_signature && (
            <div className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-pb-3">
              <h2 className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400">
                Artist Signature
              </h2>
              <p className="tw-mb-0 tw-mt-3 tw-whitespace-pre-line tw-break-words tw-text-base tw-font-semibold tw-leading-6 tw-text-white">
                {props.collection.artist_signature}
              </p>
            </div>
          )}

          <dl className="tw-m-0 tw-grid tw-gap-3 tw-pt-3 sm:tw-grid-cols-2 lg:tw-grid-cols-1">
            <div>
              <dt className="tw-sr-only">Allowlist</dt>
              <dd className="tw-m-0">
                <DistributionLink
                  collection={props.collection}
                  emphasized={true}
                />
              </dd>
            </div>
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div>
                <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400">
                  License
                </dt>
                <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-100">
                  {props.collection.licence || "-"}
                </dd>
              </div>
              <div>
                <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400">
                  Library
                </dt>
                <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-100">
                  {props.collection.library || "-"}
                </dd>
              </div>
            </div>
            <div>
              <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400">
                Contract
              </dt>
              <dd className="tw-m-0 tw-mt-1">
                <Link
                  className="tw-inline-flex tw-rounded-md tw-text-sm tw-font-medium tw-text-white tw-no-underline hover:tw-text-primary-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
                  className="!tw-bg-iron-800 !tw-px-2 !tw-py-1 !tw-text-white"
                >
                  {NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}
                </Tooltip>
              </dd>
            </div>
          </dl>
        </aside>

        <article className="tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5 lg:tw-border-0 lg:tw-border-l lg:tw-border-solid lg:tw-border-white/10 lg:tw-pl-6 lg:tw-pt-0">
          <h2 className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400">
            Collection Overview
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-whitespace-pre-line tw-text-base tw-leading-7 tw-text-iron-100">
            {props.collection.description}
          </p>
        </article>
      </div>
    </section>
  );
}

function NextGenCollectionDetailsAbout() {
  return (
    <article className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-5 tw-shadow-lg sm:tw-p-6 lg:tw-p-8">
      <div className="tw-space-y-8">
        <section>
          <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
            About Pebbles
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-200">
            Pebbles aims to explore the order that can emerge from a small set
            of organically inspired elements of points, lines, textures, and
            light.
          </p>
        </section>

        <section>
          <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
            History of Technical Innovation
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-200">
            ZeBlocks prides itself on technical innovation in its generative
            mints and on-chain work. Most ZeBlocks projects, including Pebbles,
            are 100% on-chain, and do not use any external libraries.
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-200">
            Pebbles follows in the tradition of prior ZeBlocks projects:
          </p>
          <ul className="tw-mb-0 tw-mt-3 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-200">
            <li>Unigrids: SVG-based generative art & music project</li>
            <li>
              Beatboxes: First fully immersive VR audiovisual generative art
            </li>
            <li>Sensthesia: Audio-sensitive generative art NFTs</li>
          </ul>
        </section>

        <section>
          <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
            Pebbles: Matched To The Human Eye
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-200">
            Pebble is one of the highest-resolution generative collections ever
            released
          </p>
          <div className="tw-mt-5 tw-space-y-6">
            <div>
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-white">
                The Challenge
              </h3>
              <ul className="tw-mb-0 tw-mt-2 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-200">
                <li>
                  With the exception of SVG-based collections (that typically
                  have simpler structures), most generative collections do not,
                  in practice, have unlimited scalability resolution-wise
                </li>
                <li>
                  An output can be scaled up and rendered to a higher resolution
                  but if the underlying data point density does not exist in the
                  algorithm, render quality will typically start to suffer above
                  4K
                </li>
              </ul>
            </div>
            <div>
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-white">
                The Goal
              </h3>
              <ul className="tw-mb-0 tw-mt-2 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-200">
                <li>
                  Pebbles aims to provide sufficient resolution to match or
                  exceed the acuity of the human eye even in a world of
                  wall-sized TVs or AR devices
                </li>
                <li>
                  Under typical large-screen TV viewing distances, 4K or 8K is
                  more than sufficient to exceed the acuity of the human eye
                </li>
                <li>
                  If wall-size TVs become common in the future, the limit of
                  human vision to discern differences in resolutions, under
                  normal conditions, will move up to somewhere between 8K and
                  16K
                </li>
                <li>
                  Pebbles is designed to have no loss of resolution at all up to
                  12.5K and continue to provide extraordinary detail at 16K and
                  beyond
                </li>
                <li>
                  In practice, and under the large majority of future display
                  conditions, every Pebble has more resolution than the human
                  eye can discern
                </li>
              </ul>
            </div>
            <div>
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-white">
                The Approach
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-200">
                The Pebble algorithm addresses this issue in two ways:
              </p>
              <ul className="tw-mb-0 tw-mt-2 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-200">
                <li>Very dense number of data points</li>
                <li>
                  Matches the data points to the exact pixels available at each
                  render, regardless of resolution
                </li>
                <li>
                  This makes it computationally expensive to render. Pebbles
                  does not use p5.js or other processing libraries to improve
                  rendering performance, particularly at large sizes.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
            NextGen x Pebbles
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-200">
            NextGen will take the following approach to support Pebbles’s
            extraordinary resolution:
          </p>
          <ul className="tw-mb-0 tw-mt-3 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-200">
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
        </section>

        <section>
          <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
            Key Collection Parameters
          </h2>
          <div className="tw-mt-4 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/10">
            <table className="tw-w-full tw-min-w-[560px] tw-border-collapse tw-text-left tw-text-sm">
              <tbody>
                <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10">
                  <th
                    scope="row"
                    className="tw-w-1/3 tw-bg-white/[0.03] tw-px-4 tw-py-3 tw-font-medium tw-text-iron-300"
                  >
                    Collection Size:
                  </th>
                  <td className="tw-px-4 tw-py-3 tw-text-iron-100">
                    1,000 (or fewer, if fewer are minted in 24 hours)
                  </td>
                </tr>
                <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10">
                  <th
                    scope="row"
                    className="tw-bg-white/[0.03] tw-px-4 tw-py-3 tw-font-medium tw-text-iron-300"
                  >
                    Orientation:
                  </th>
                  <td className="tw-px-4 tw-py-3 tw-text-iron-100">Vertical</td>
                </tr>
                <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10">
                  <th
                    scope="row"
                    className="tw-bg-white/[0.03] tw-px-4 tw-py-3 tw-font-medium tw-text-iron-300"
                  >
                    Aspect Ratio:
                  </th>
                  <td className="tw-px-4 tw-py-3 tw-text-iron-100">1:1.294</td>
                </tr>
                <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10">
                  <th
                    scope="row"
                    className="tw-bg-white/[0.03] tw-px-4 tw-py-3 tw-font-medium tw-text-iron-300"
                  >
                    Script:
                  </th>
                  <td className="tw-px-4 tw-py-3 tw-text-iron-100">
                    Javascript
                  </td>
                </tr>
                <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10">
                  <th
                    scope="row"
                    className="tw-bg-white/[0.03] tw-px-4 tw-py-3 tw-font-medium tw-text-iron-300"
                  >
                    Script Size:
                  </th>
                  <td className="tw-px-4 tw-py-3 tw-text-iron-100">17Kb</td>
                </tr>
                <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10">
                  <th
                    scope="row"
                    className="tw-bg-white/[0.03] tw-px-4 tw-py-3 tw-font-medium tw-text-iron-300"
                  >
                    External libraries used:
                  </th>
                  <td className="tw-px-4 tw-py-3 tw-text-iron-100">None</td>
                </tr>
                <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10">
                  <th
                    scope="row"
                    className="tw-bg-white/[0.03] tw-px-4 tw-py-3 tw-font-medium tw-text-iron-300"
                  >
                    License:
                  </th>
                  <td className="tw-px-4 tw-py-3 tw-text-iron-100">
                    Creative Commons 0 (CC0)
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="tw-bg-white/[0.03] tw-px-4 tw-py-3 tw-font-medium tw-text-iron-300"
                  >
                    Prints:
                  </th>
                  <td className="tw-px-4 tw-py-3 tw-text-iron-100">
                    An official ZeBlocks approved printing process will be
                    available in a few weeks
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </article>
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
