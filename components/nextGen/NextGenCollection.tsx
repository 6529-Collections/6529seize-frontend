import styles from "./NextGen.module.scss";
import { Container, Row, Col, Button, Tab, Tabs } from "react-bootstrap";
import { useContractRead, useContractReads } from "wagmi";
import { NEVER_DATE } from "../../constants";
import { Fragment, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NextGenTokenList from "./NextGenTokenList";
import {
  Info,
  AdditionalData,
  TokenURI,
  LibraryScript,
  PhaseTimes,
} from "./entities";
import { fromGWEI } from "../../helpers/Helpers";
import { COLLECTION_BANNERS, COLLECTION_PREVIEWS } from "./NextGen";
import Image from "next/image";
import { goerli } from "wagmi/chains";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE, NEXTGEN_MINTER } from "./contracts";

interface Props {
  collection: number;
}

enum View {
  ART,
  COLLECTION,
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
  const [tokenStartIndex, setTokenStartIndex] = useState<number>(0);
  const [tokenEndIndex, setTokenEndIndex] = useState<number>(0);

  const [info, setInfo] = useState<Info>();
  const [infoSettled, setInfoSettled] = useState<boolean>(false);
  const [libraryScript, setLibraryScript] = useState<LibraryScript>();
  const [phaseTimes, setPhaseTimes] = useState<PhaseTimes>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();

  const [tokenURIs, setTokenURIs] = useState<TokenURI[]>();

  const [burnAmount, setBurnAmount] = useState<number>(0);
  const [mintPrice, setMintPrice] = useState<number>(0);

  const [artistSignature, setArtistSignature] = useState<string>("");

  const [view, setView] = useState<View>(View.ART);

  function getTokenUriReadParams() {
    const params: any[] = [];
    if (tokenStartIndex && tokenEndIndex) {
      for (let i = tokenStartIndex; i <= tokenEndIndex; i++) {
        params.push({
          address: NEXTGEN_CORE.contract,
          abi: NEXTGEN_CORE.abi,
          chainId: NEXTGEN_CHAIN_ID,
          functionName: "tokenURI",
          args: [i],
        });
      }
    }
    return params;
  }

  const startIndexRead = useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "viewTokensIndexMin",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        setTokenStartIndex(parseInt(data));
      }
    },
  });

  const endIndexRead = useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "viewTokensIndexMax",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        setTokenEndIndex(parseInt(data));
      }
    },
  });

  useContractReads({
    contracts: getTokenUriReadParams(),
    watch: true,
    enabled: tokenStartIndex > 0 && tokenEndIndex > 0,
    onSettled(data, error) {
      const tokens: TokenURI[] = [];
      if (data) {
        data.map((d, index: number) => {
          if (d.result && tokenStartIndex && tokenEndIndex) {
            const r: string = d.result as string;
            if (r.startsWith("data")) {
              const uri = extractURI(r);
              const name = extractField("name", r);
              const description = extractField("description", r);
              tokens.push({
                id: index + tokenStartIndex,
                collection: props.collection,
                uri: uri.uri,
                data: uri.data,
                name: name,
                description: description,
              });
            } else {
              tokens.push({
                id: index + tokenStartIndex,
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
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionInfo",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        if (d.some((e) => e)) {
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
      }
      setInfoSettled(true);
    },
  });

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
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
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "artistsSignatures",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        setArtistSignature(data.replaceAll("\n", "<br>"));
      }
    },
  });

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionAdditionalData",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ad: AdditionalData = {
          artist_address: d[0],
          max_purchases: parseInt(d[1]),
          circulation_supply: parseInt(d[2]),
          total_supply: parseInt(d[3]),
          final_supply_after_mint: parseInt(d[4]),
          randomizer: d[5],
        };
        setAdditionalData(ad);
      }
    },
  });

  useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
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
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "burnAmount",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        setBurnAmount(parseInt(data));
      }
    },
  });

  useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "getPrice",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (!isNaN(parseInt(data))) {
        setMintPrice(parseInt(data));
      }
    },
  });

  if (!startIndexRead.isLoading && !endIndexRead.isLoading && infoSettled) {
    if (!info) {
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
          {/* <Image
            loading={"lazy"}
            width="0"
            height="0"
            style={{ width: "100%", height: "auto" }}
            src={`${COLLECTION_BANNERS}/${props.collection}.png`}
            alt={`${props.collection}-banner`}
          /> */}
          <Container className="pt-2 pb-2">
            {additionalData && info && phaseTimes && (
              <Fragment>
                <Row className="pt-2">
                  <Col className="d-flex justify-content-between align-items-center flex-wrap">
                    <span>
                      <h1 className="mb-0">
                        #{props.collection} - {info.name.toUpperCase()}
                      </h1>
                    </span>
                    <span className="d-flex flex-column gap-4">
                      <span className="d-flex align-items-center justify-content-end gap-2">
                        <span className={styles.phaseTimeTag}>
                          {isMintingOpen(
                            phaseTimes.allowlist_start_time,
                            phaseTimes.allowlist_end_time
                          )
                            ? `Allowlist Available`
                            : isMintingUpcoming(phaseTimes.allowlist_start_time)
                            ? `Allowlist Upcoming`
                            : `Allowlist Complete`}
                        </span>
                        <span className={styles.phaseTimeTag}>
                          {isMintingOpen(
                            phaseTimes.public_start_time,
                            phaseTimes.public_end_time
                          )
                            ? `Public Phase Available`
                            : isMintingUpcoming(phaseTimes.public_start_time)
                            ? `Public Phase Upcoming`
                            : `Public Phase Complete`}
                        </span>
                      </span>
                      <span className="d-flex align-items-center justify-content-end gap-4">
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
                            NEXTGEN_CHAIN_ID === goerli.id
                              ? `testnets.opensea`
                              : `opensea`
                          }.io/assets/${
                            NEXTGEN_CHAIN_ID === goerli.id
                              ? `goerli`
                              : `ethereum`
                          }/${NEXTGEN_CORE.contract}`}
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
                            NEXTGEN_CHAIN_ID === goerli.id
                              ? `goerli.x2y2`
                              : `x2y2`
                          }.io/eth/${NEXTGEN_CORE.contract}`}
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
                    </span>
                  </Col>
                  <Col className="pt-2" xs={12}>
                    by {info.artist.toUpperCase()}
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col>
                    <div className={styles.collectionTabs}>
                      <span
                        onClick={() => setView(View.ART)}
                        className={`${styles.collectionTab} ${
                          view == View.ART ? styles.collectionTabActive : ""
                        }`}>
                        The Art
                      </span>
                      <span
                        onClick={() => setView(View.COLLECTION)}
                        className={`${styles.collectionTab} ${
                          view == View.COLLECTION
                            ? styles.collectionTabActive
                            : ""
                        }`}>
                        The Collection
                      </span>
                    </div>
                  </Col>
                </Row>
                {view == View.ART && (
                  <>
                    <Row className="pt-2">
                      <Col>
                        <h4>
                          Tokens x
                          {additionalData.circulation_supply - burnAmount}
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
                  </>
                )}
                {view == View.COLLECTION && (
                  <Row className="pt-2">
                    <Col sm={12} md={4}>
                      <Container>
                        <Row>
                          <Col>
                            <Image
                              loading={"lazy"}
                              width="0"
                              height="0"
                              style={{
                                height: "auto",
                                width: "auto",
                                maxWidth: "100%",
                                maxHeight: "100%",
                              }}
                              src={`${COLLECTION_PREVIEWS}/${props.collection}.png`}
                              alt={`${props.collection}-preview`}
                            />
                          </Col>
                        </Row>
                        <Row className="pt-4">
                          {tokenStartIndex > 0 && tokenEndIndex > 0 && (
                            <Col xs={12} className="pt-2">
                              Token Indexes{" "}
                              <b>
                                {tokenStartIndex} - {tokenEndIndex}
                              </b>
                            </Col>
                          )}
                          <Col xs={12} className="pt-2">
                            Total Supply <b>x{additionalData.total_supply}</b>
                          </Col>
                          <Col xs={12} className="pt-2">
                            Minted <b>x{additionalData.circulation_supply}</b>
                          </Col>
                          {burnAmount > 0 && (
                            <Col xs={12} className="pt-2">
                              <span>
                                Burnt <b>x{burnAmount}</b>
                              </span>
                            </Col>
                          )}
                          <Col xs={12} className="pt-2">
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
                          </Col>
                          <Col xs={12} className="pt-2">
                            Mint Cost{" "}
                            <b>
                              {mintPrice > 0 ? fromGWEI(mintPrice) : `Free`}{" "}
                              {mintPrice > 0 ? `ETH` : ``}
                            </b>
                          </Col>
                        </Row>
                      </Container>
                    </Col>
                    <Col sm={12} md={8}>
                      <Container>
                        {artistSignature && (
                          <>
                            <Row>
                              <Col>
                                <b>Artist Signature</b>
                              </Col>
                            </Row>
                            <Row className="pb-4">
                              <Col xs={12} className="pt-2">
                                <div
                                  className={styles.artistSignature}
                                  dangerouslySetInnerHTML={{
                                    __html: artistSignature,
                                  }}></div>
                              </Col>
                            </Row>
                          </>
                        )}
                        <Row>
                          <Col>
                            <b>Collection Overview</b>
                          </Col>
                        </Row>
                        <Row>
                          <Col xs={12} className="pt-2">
                            {info.description}
                          </Col>
                          <Col xs={12} className="pt-2">
                            Licence <b>{info.licence}</b>
                          </Col>
                          <Col xs={12} className="pt-1">
                            Base URI <b>{info.base_uri}</b>
                          </Col>
                          <Col xs={12} className="pt-1">
                            Merkle Root <b>{phaseTimes.merkle_root}</b>
                          </Col>
                        </Row>
                      </Container>
                    </Col>
                  </Row>
                )}
                {/* <Row className="pt-4">
                  <Col className="d-flex  align-items-center flex-wrap gap-4">
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className={`${styles.trafficLight} ${
                          isMintingOpen(
                            phaseTimes.allowlist_start_time,
                            phaseTimes.allowlist_end_time
                          )
                            ? styles.trafficLightGreen
                            : isMintingUpcoming(phaseTimes.allowlist_start_time)
                            ? styles.trafficLightOrange
                            : styles.trafficLightRed
                        }`}></span>
                      Allowlist Minting{" "}
                      {getMintingTimesDisplay(
                        phaseTimes.allowlist_start_time,
                        phaseTimes.allowlist_end_time
                      )}
                    </span>
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className={`${styles.trafficLight} ${
                          isMintingOpen(
                            phaseTimes.public_start_time,
                            phaseTimes.public_end_time
                          )
                            ? styles.trafficLightGreen
                            : isMintingUpcoming(phaseTimes.public_start_time)
                            ? styles.trafficLightOrange
                            : styles.trafficLightRed
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
                    {tokenStartIndex > 0 && tokenEndIndex > 0 && (
                      <>
                        <span>
                          Token Indexes{" "}
                          <b>
                            {tokenStartIndex} - {tokenEndIndex}
                          </b>
                        </span>
                        &bull;
                      </>
                    )}
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
                        {mintPrice > 0 ? fromGWEI(mintPrice) : `Free`}{" "}
                        {mintPrice > 0 ? `ETH` : ``}
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
                </Row> */}
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
