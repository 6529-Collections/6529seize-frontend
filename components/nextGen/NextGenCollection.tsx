import styles from "./NextGen.module.scss";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useContractRead, useContractReads } from "wagmi";
import { NEVER_DATE, NEXT_GEN_CONTRACT } from "../../constants";
import { NEXT_GEN_ABI } from "../../abis";
import { Fragment, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NextGenTokenList from "./NextGenTokenList";
import {
  TokenIndexes,
  Info,
  AdditionalData,
  TokenURI,
  LibraryScript,
  PhaseTimes,
} from "./entities";
import { fromGWEI } from "../../helpers/Helpers";
import { COLLECTION_BANNERS } from "./NextGen";
import Image from "next/image";
import { goerli } from "wagmi/chains";

interface Props {
  collection: number;
}

const getDateDisplay = (numberDate: number) => {
  if (numberDate >= NEVER_DATE * 1000) {
    return "Never";
  }
  const date = new Date(numberDate);
  return `${date.getUTCFullYear()}/${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getUTCDate().toString().padStart(2, "0")} ${date
    .getUTCHours()
    .toString()
    .padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
};

export function isMintingOpen(startTime: number, endTime: number) {
  const now = new Date().getTime();
  return now > startTime && now < endTime;
}

export function isMintingUpcoming(startTime: number) {
  const now = new Date().getTime();
  return startTime > now;
}

export function getMintingTimesDisplay(startTime: number, endTime: number) {
  if (startTime === 0 && endTime === 0) {
    return "";
  }
  return `${getDateDisplay(startTime)} - ${getDateDisplay(endTime)}`;
}

export function extractURI(s: string) {
  const regex = /"animation_url":"([^"]+)"/;
  const match = s.match(regex);
  if (match && match.length >= 2) {
    const animationUrl = match[1];
    const base64Data = animationUrl.split(",")[1];
    const uri = Buffer.from(base64Data, "base64").toString("utf-8");
    return {
      uri: uri,
      data: animationUrl,
    };
  } else {
    return {
      uri: "",
      data: "",
    };
  }
}

export function extractField(field: string, s: string) {
  const regex = new RegExp(`"${field}":"([^"]+)"`);
  const match = s.match(regex);
  if (match && match.length >= 2) {
    return match[1];
  } else {
    return "";
  }
}

export default function NextGenCollection(props: Props) {
  const [tokenIndexes, setTokenIndexes] = useState<TokenIndexes>();

  const [info, setInfo] = useState<Info>();
  const [libraryScript, setLibraryScript] = useState<LibraryScript>();
  const [phaseTimes, setPhaseTimes] = useState<PhaseTimes>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();

  const [tokenURIs, setTokenURIs] = useState<TokenURI[]>();

  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  const [burnAmount, setBurnAmount] = useState<number>(0);

  function getTokenUriReadParams() {
    const params: any[] = [];
    if (tokenIndexes) {
      for (let i = tokenIndexes.start; i <= tokenIndexes.end; i++) {
        params.push({
          address: NEXT_GEN_CONTRACT.contract,
          abi: NEXT_GEN_ABI,
          chainId: NEXT_GEN_CONTRACT.chain_id,
          functionName: "tokenURI",
          args: [i],
        });
      }
    }
    return params;
  }

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "viewTokensIndexForCollection",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const startIndex = parseInt(d[0]);
        const endIndex = parseInt(d[1]);
        const tokenIndexes: TokenIndexes = {
          start: startIndex,
          end: endIndex,
        };
        setTokenIndexes(tokenIndexes);
      }
    },
  });

  useContractReads({
    contracts: getTokenUriReadParams(),
    watch: true,
    enabled: tokenIndexes != undefined,
    onSettled(data, error) {
      const tokens: TokenURI[] = [];
      if (data) {
        data.map((d, index: number) => {
          if (d.result && tokenIndexes) {
            const r: string = d.result as string;
            if (r.startsWith("data")) {
              const uri = extractURI(r);
              const name = extractField("name", r);
              const description = extractField("description", r);
              tokens.push({
                id: index + tokenIndexes.start,
                collection: props.collection,
                uri: uri.uri,
                data: uri.data,
                name: name,
                description: description,
              });
            } else {
              tokens.push({
                id: index + tokenIndexes.start,
                collection: props.collection,
                uri: r,
                name: "",
                description: "",
              });
            }
          }
        });
      }
      setTokenURIs(tokens);
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionInfo",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const i1: Info = {
          name: d[0],
          artist: d[1],
          description: d[2],
          website: d[3],
          licence: d[4],
          base_uri: d[5],
        };
        setInfo(i1);
      }
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionLibraryAndScript",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ls: LibraryScript = {
          library: d[0],
          script: d[1],
        };
        setLibraryScript(ls);
      }
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionAdditionalData",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ad1: AdditionalData = {
          artist_address: d[0],
          mint_cost: Math.round(parseInt(d[1]) * 100000) / 100000,
          max_purchases: parseInt(d[2]),
          circulation_supply: parseInt(d[3]),
          total_supply: parseInt(d[4]),
          sales_percentage: parseInt(d[5]),
          is_collection_active: d[6] as boolean,
        };
        setAdditionalData(ad1);
      }
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionPhases",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const phases: PhaseTimes = {
          allowlist_start_time: parseInt(d[0]) * 1000,
          allowlist_end_time: parseInt(d[1]) * 1000,
          merkle_root: d[2],
          public_start_time: parseInt(d[3]) * 1000,
          public_end_time: parseInt(d[4]) * 1000,
        };
        setPhaseTimes(phases);
      }
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "burnAmount",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        setBurnAmount(parseInt(data));
      }
    },
  });

  if (tokenIndexes) {
    if (tokenIndexes.start === 0 || tokenIndexes.end === 0) {
      return (
        <Container className="pt-5 text-center">
          <Row>
            <Col>
              <h4 className="mb-0 float-none">
                Collection #{props.collection} not found
              </h4>
            </Col>
          </Row>
          <Row>
            <Col>
              <Image
                width="0"
                height="0"
                style={{ height: "auto", width: "120px" }}
                src="/SummerGlasses.svg"
                alt="SummerGlasses"
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <a href={`/nextgen`}>BACK TO NEXTGEN</a>
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>
              <a href={`/`}>BACK TO HOME</a>
            </Col>
          </Row>
        </Container>
      );
    } else {
      return (
        <>
          <Image
            loading={"lazy"}
            width="0"
            height="0"
            style={{ width: "100%", height: "auto" }}
            src={`${COLLECTION_BANNERS}/${props.collection}.png`}
            alt={`${props.collection}-banner`}
          />
          <Container className="pt-2 pb-2">
            {tokenIndexes && additionalData && info && phaseTimes && (
              <Fragment>
                <Row className="pt-2">
                  <Col className="d-flex justify-content-between align-items-center flex-wrap">
                    <span>
                      <h1 className="mb-0">{info.name.toUpperCase()}</h1>
                    </span>
                    <span className="d-flex align-items-center gap-4">
                      <FontAwesomeIcon
                        className={`${styles.globeIcon} ${styles.collectionIcon}`}
                        icon="globe"
                        onClick={() => {
                          let url = info.website;
                          if (!url.startsWith("http")) {
                            url = `http://${url}`;
                          }
                          window.open(url, "_blank");
                        }}></FontAwesomeIcon>
                      <a
                        href={`https://${
                          NEXT_GEN_CONTRACT.chain_id == goerli.id
                            ? `testnets.opensea`
                            : `opensea`
                        }.io/assets/${
                          NEXT_GEN_CONTRACT.chain_id == goerli.id
                            ? `goerli`
                            : `ethereum`
                        }/${NEXT_GEN_CONTRACT.contract}`}
                        target="_blank"
                        rel="noreferrer">
                        <Image
                          className={styles.collectionIcon}
                          src="/opensea.png"
                          alt="opensea"
                          width={32}
                          height={32}
                        />
                      </a>
                      <a
                        href={`https://${
                          NEXT_GEN_CONTRACT.chain_id == goerli.id
                            ? `goerli.x2y2`
                            : `x2y2`
                        }.io/eth/${NEXT_GEN_CONTRACT.contract}`}
                        target="_blank"
                        rel="noreferrer">
                        <Image
                          className={styles.collectionIcon}
                          src="/x2y2.png"
                          alt="x2y2"
                          width={32}
                          height={32}
                        />
                      </a>
                      <Button
                        onClick={() => {
                          window.location.href = `/nextgen/collection/${props.collection}/mint`;
                        }}
                        className={styles.mintBtn}
                        disabled={
                          !additionalData ||
                          !additionalData.is_collection_active ||
                          !phaseTimes ||
                          (!isMintingOpen(
                            phaseTimes.allowlist_start_time,
                            phaseTimes.allowlist_end_time
                          ) &&
                            !isMintingOpen(
                              phaseTimes.public_start_time,
                              phaseTimes.public_end_time
                            ))
                        }>
                        Go to Minting
                      </Button>
                    </span>
                  </Col>
                  <Col className="pt-2" xs={12}>
                    by {info.artist.toUpperCase()}
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col className="d-flex  align-items-center flex-wrap gap-4">
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className={`traffic-light ${
                          additionalData.is_collection_active ? `green` : `red`
                        }`}></span>
                      Active
                    </span>
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className={`traffic-light ${
                          isMintingOpen(
                            phaseTimes.allowlist_start_time,
                            phaseTimes.allowlist_end_time
                          )
                            ? `green`
                            : isMintingUpcoming(phaseTimes.allowlist_start_time)
                            ? `orange`
                            : `red`
                        }`}></span>
                      Allowlist Minting{" "}
                      {getMintingTimesDisplay(
                        phaseTimes.allowlist_start_time,
                        phaseTimes.allowlist_end_time
                      )}
                    </span>
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className={`traffic-light ${
                          isMintingOpen(
                            phaseTimes.public_start_time,
                            phaseTimes.public_end_time
                          )
                            ? `green`
                            : isMintingUpcoming(phaseTimes.public_start_time)
                            ? `orange`
                            : `red`
                        }`}></span>
                      Public Minting{" "}
                      {getMintingTimesDisplay(
                        phaseTimes.public_start_time,
                        phaseTimes.public_end_time
                      )}
                    </span>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col className="d-flex align-tems-center justify-content-start gap-3 flex-wrap">
                    <span>
                      Token Indexes{" "}
                      <b>
                        {tokenIndexes.start} - {tokenIndexes.end}
                      </b>
                    </span>
                    &bull;
                    <span>
                      Total Supply <b>x{additionalData.total_supply}</b>
                    </span>
                    &bull;
                    <span>
                      Minted <b>x{additionalData.circulation_supply}</b>
                    </span>
                    {burnAmount > 0 && (
                      <>
                        &bull;
                        <span>
                          Burnt <b>x{burnAmount}</b>
                        </span>
                      </>
                    )}
                    &bull;
                    <span>
                      Available{" "}
                      <b>
                        {additionalData.total_supply -
                          additionalData.circulation_supply -
                          burnAmount >
                        0
                          ? `x${
                              additionalData.total_supply -
                              additionalData.circulation_supply -
                              burnAmount
                            }`
                          : `-`}
                      </b>
                    </span>
                    &bull;
                    <span>
                      Mint Cost{" "}
                      <b>
                        {additionalData.mint_cost > 0
                          ? fromGWEI(additionalData.mint_cost)
                          : `Free`}{" "}
                        {additionalData.mint_cost > 0 ? `ETH` : ``}
                      </b>
                    </span>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col xs={6}>
                    <h4>Overview</h4>
                  </Col>
                  <Col
                    xs={6}
                    onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                    className="d-flex align-items-center justify-content-end gap-2 cursor-pointer unselectable">
                    Show {isOverviewExpanded ? `Less` : `More`}{" "}
                    <FontAwesomeIcon
                      icon={isOverviewExpanded ? `chevron-up` : `chevron-down`}
                      className={styles.caret}></FontAwesomeIcon>
                  </Col>
                </Row>
                <Row
                  className={`pt-1 ${styles.overview} ${
                    isOverviewExpanded ? styles.expandedOverview : ``
                  }`}>
                  <Col xs={12}>{info.description}</Col>
                  <Col xs={12} className="pt-2">
                    Licence <b>{info.licence}</b>
                  </Col>
                  <Col xs={12} className="pt-1">
                    Base URI <b>{info.base_uri}</b>
                  </Col>
                  <Col xs={12} className="pt-1">
                    Sales Percentage <b>{additionalData.sales_percentage}%</b>
                  </Col>
                  <Col xs={12} className="pt-1">
                    Merkle Root <b>{phaseTimes.merkle_root}</b>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col>
                    <h4>
                      Tokens x{additionalData.circulation_supply - burnAmount}
                    </h4>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    {tokenURIs && (
                      <NextGenTokenList
                        collection={props.collection}
                        tokens={tokenURIs}
                      />
                    )}
                  </Col>
                </Row>
              </Fragment>
            )}
          </Container>
        </>
      );
    }
  } else {
    return (
      <Container className="pt-5">
        <Row>
          <Col className="text-center">
            <h4 className="mb-0 float-none">Fetching Collection...</h4>
          </Col>
        </Row>
      </Container>
    );
  }
}
