"use client";

import { NextGenCollection } from "@/entities/INextgen";
import { NextgenCollectionView } from "@/enums";
import { formatAddress } from "@/helpers/Helpers";
import Link from "next/link";
import { Col, Container, Row, Table } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import { goerli, sepolia } from "viem/chains";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../../nextgen_contracts";
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
    <Container className="no-padding">
      <Row>
        <Col>
          <Container className="no-padding">
            <Row>
              <Col sm={12} md={4} className="pt-2 pb-2">
                {props.collection.artist_signature && (
                  <>
                    <Row>
                      <Col className="font-color-h">Artist Signature</Col>
                    </Row>
                    <Row className="pb-2">
                      <Col xs={12} className="pt-2">
                        <div
                          className={styles.artistSignature}
                          dangerouslySetInnerHTML={{
                            __html: props.collection.artist_signature,
                          }}></div>
                      </Col>
                    </Row>
                  </>
                )}
                <Row>
                  <Col xs={12} className="pt-2 pb-2 d-flex flex-column">
                    <span className="font-color-h">Allowlist</span>
                    <DistributionLink collection={props.collection} />
                  </Col>
                  <Col xs={12} className="pt-2 pb-2 d-flex gap-5">
                    <span className="d-flex flex-column">
                      <span className="font-color-h">License</span>
                      <span>{props.collection.licence}</span>
                    </span>
                    <span className="d-flex flex-column">
                      <span className="font-color-h">Library</span>
                      <span>
                        {props.collection.library
                          ? props.collection.library
                          : "-"}
                      </span>
                    </span>
                  </Col>
                  <Col xs={12} className="pt-2 pb-2 d-flex flex-column">
                    <span className="font-color-h">Contract</span>
                    <span>
                      <Link
                        className="font-color text-decoration-none"
                        href={getEtherscanLink()}
                        target="_blank"
                        rel="noreferrer"
                        data-tooltip-id={`contract-tooltip-${props.collection.id}`}>
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
                        }}>
                        {NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}
                      </Tooltip>
                    </span>
                  </Col>
                </Row>
              </Col>
              <Col sm={12} md={8} className="pt-2 pb-2 d-flex flex-column">
                <span className="font-color-h">Collection Overview</span>
                <span>{props.collection.description}</span>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}

function NextGenCollectionDetailsAbout(props: Readonly<CollectionProps>) {
  return (
    <Container className="no-padding pt-4">
      <Row className="pb-3">
        <Col>
          <h4>About Pebbles</h4>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            Pebbles aims to explore the order that can emerge from a small set
            of organically inspired elements of points, lines, textures, and
            light.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h4>History of Technical Innovation</h4>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
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
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h4>Pebbles: Matched To The Human Eye</h4>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
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
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h4>NextGen x Pebbles</h4>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
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
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h4>Key Collection Parameters</h4>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <Table>
            <tbody>
              <tr>
                <td>Collection Size:</td>
                <td>1,000 (or fewer, if fewer are minted in 24 hours)</td>
              </tr>
              <tr>
                <td>Orientation:</td>
                <td>Vertical</td>
              </tr>
              <tr>
                <td>Aspect Ratio:</td>
                <td>1:1.294</td>
              </tr>
              <tr>
                <td>Script:</td>
                <td>Javascript</td>
              </tr>
              <tr>
                <td>Script Size:</td>
                <td>17Kb</td>
              </tr>
              <tr>
                <td>External libraries used:</td>
                <td>None</td>
              </tr>
              <tr>
                <td>License:</td>
                <td>Creative Commons 0 (CC0)</td>
              </tr>
              <tr>
                <td>Prints:</td>
                <td>
                  An official ZeBlocks approved printing process will be
                  available in a few weeks
                </td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
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
    return <NextGenCollectionDetailsAbout collection={props.collection} />;
  }
}
