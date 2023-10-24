import styles from "./NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useContractRead, useContractReads } from "wagmi";
import { useEffect, useState } from "react";
import NextGenTokenList from "./NextGenTokenList";
import {
  Info,
  AdditionalData,
  TokenURI,
  LibraryScript,
  PhaseTimes,
  Status,
} from "../nextgen_entities";
import { fromGWEI } from "../../../helpers/Helpers";
import Image from "next/image";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "../nextgen_contracts";
import Breadcrumb, { Crumb } from "../../breadcrumb/Breadcrumb";
import NextGenCollectionDetails from "./NextGenCollectionDetails";
import NextGenMint from "./NextGenMint";
import router from "next/router";
import {
  extractField,
  extractURI,
  retrieveCollectionAdditionalData,
  retrieveCollectionInfo,
  retrieveCollectionLibraryAndScript,
  retrieveCollectionPhases,
} from "../nextgen_helpers";
import { NextGenTokenImageContent } from "./NextGenTokenImage";

interface Props {
  collection: number;
}

enum Focus {
  ART = "art",
  COLLECTION = "collection",
  MINT = "mint",
}

export default function NextGenCollection(props: Props) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
  ];
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>(crumbs);

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

  const [focus, setFocus] = useState<Focus>(Focus.ART);

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
              const image = extractField("image", r);
              tokens.push({
                id: index + tokenStartIndex,
                collection: props.collection,
                uri: uri.uri,
                data: uri.data,
                name: name,
                description: description,
                image: image,
                attributes: [],
              });
            } else {
              tokens.push({
                id: index + tokenStartIndex,
                collection: props.collection,
                uri: r,
                name: "",
                description: "",
                attributes: [],
              });
            }
          }
        });
      }
      setTokenURIs(tokens);
    },
  });

  retrieveCollectionInfo(props.collection, (data: Info) => {
    setInfo(data);
    const nameCrumb = data.name
      ? `#${props.collection} - ${data.name}`
      : `Collection #${props.collection}`;
    setBreadcrumbs((b) => [...crumbs, { display: nameCrumb }]);
    setInfoSettled(true);
  });

  retrieveCollectionLibraryAndScript(
    props.collection,
    (data: LibraryScript) => {
      setLibraryScript(data);
    }
  );

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

  retrieveCollectionPhases(props.collection, (data: PhaseTimes) => {
    setPhaseTimes(data);
  });

  retrieveCollectionAdditionalData(
    props.collection,
    (data: AdditionalData) => {
      setAdditionalData(data);
    },
    true
  );

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

  useEffect(() => {
    const currFocus = router.query.focus;
    if (currFocus != focus) {
      let f = currFocus as Focus;
      if (f == Focus.MINT && !showMint()) {
        f = Focus.ART;
      }
      setFocus(f);
    }
  }, [router.query.focus]);

  useEffect(() => {
    if (focus) {
      const currFocus = router.query.focus;
      if (!currFocus || currFocus[0] != focus) {
        const currentQuery = { ...router.query };
        currentQuery.focus = focus;
        router.push(
          {
            pathname: router.pathname,
            query: currentQuery,
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [focus]);

  function showMint() {
    if (!phaseTimes || !additionalData) {
      return false;
    }

    if (additionalData.circulation_supply == additionalData.total_supply) {
      return false;
    }

    const now = new Date().getTime();
    const allowlistStartsIn = phaseTimes.allowlist_start_time - now;
    if (allowlistStartsIn > 0 && allowlistStartsIn < 1000 * 60 * 60 * 24) {
      return true;
    }
    return (
      phaseTimes.al_status == Status.LIVE ||
      phaseTimes.public_status == Status.LIVE
    );
  }

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
          <Breadcrumb breadcrumbs={breadcrumbs} />
          <Container className="pt-3 pb-2">
            {additionalData && info && phaseTimes && (
              <>
                <NextGenCollectionDetails
                  collection={props.collection}
                  info={info}
                  phase_times={phaseTimes}
                  additional_data={additionalData}
                />
                <Row className="pt-5">
                  <Col>
                    <div className={styles.collectionTabs}>
                      <span
                        onClick={() => setFocus(Focus.ART)}
                        className={`${styles.collectionTab} ${
                          focus == Focus.ART ? styles.collectionTabActive : ""
                        }`}>
                        The Art
                      </span>
                      <span
                        onClick={() => setFocus(Focus.COLLECTION)}
                        className={`${styles.collectionTab} ${
                          focus == Focus.COLLECTION
                            ? styles.collectionTabActive
                            : ""
                        }`}>
                        The Collection
                      </span>
                      {showMint() && (
                        <span
                          onClick={() => setFocus(Focus.MINT)}
                          className={`${styles.collectionTab} ${
                            focus == Focus.MINT
                              ? styles.collectionTabActive
                              : ""
                          }`}>
                          Mint
                        </span>
                      )}
                    </div>
                  </Col>
                </Row>
                {focus == Focus.ART && (
                  <>
                    <Row className="pt-3">
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
                {focus == Focus.COLLECTION && (
                  <>
                    <Row>
                      <Col sm={12} md={6} className="pt-3">
                        <Container className="no-padding">
                          <Row className="pb-4">
                            <Col className={styles.tokenFrameContainerHalf}>
                              {tokenURIs && tokenURIs.length > 0 && (
                                <NextGenTokenImageContent
                                  preview={true}
                                  token={tokenURIs[0]}
                                />
                              )}
                            </Col>
                          </Row>
                          <Row>
                            {tokenStartIndex > 0 && tokenEndIndex > 0 && (
                              <Col xs={12} className="pb-2">
                                Token Indexes{" "}
                                <b>
                                  {tokenStartIndex} - {tokenEndIndex}
                                </b>
                              </Col>
                            )}
                            <Col xs={12} className="pb-2">
                              Total Supply <b>x{additionalData.total_supply}</b>
                            </Col>
                            <Col xs={12} className="pb-2">
                              Minted <b>x{additionalData.circulation_supply}</b>
                            </Col>
                            {burnAmount > 0 && (
                              <Col xs={12} className="pb-2">
                                <span>
                                  Burnt <b>x{burnAmount}</b>
                                </span>
                              </Col>
                            )}
                            <Col xs={12} className="pb-2">
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
                            <Col xs={12} className="pb-2">
                              Mint Cost{" "}
                              <b>
                                {mintPrice > 0 ? fromGWEI(mintPrice) : `Free`}{" "}
                                {mintPrice > 0 ? `ETH` : ``}
                              </b>
                            </Col>
                            <Col xs={12} className="pb-2">
                              <span>
                                Max Purchases (Public Phase){" "}
                                <b>x{additionalData.max_purchases}</b>
                              </span>
                            </Col>
                          </Row>
                        </Container>
                      </Col>
                      <Col sm={12} md={6} className="pt-3">
                        <Container className="no-padding">
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
                  </>
                )}
                {focus == Focus.MINT && (
                  <Row className="pt-3">
                    <Col>
                      <NextGenMint
                        collection={props.collection}
                        collection_preview={
                          tokenURIs && tokenURIs.length > 0
                            ? tokenURIs[0]
                            : undefined
                        }
                        phase_times={phaseTimes}
                        mint_price={mintPrice}
                        additional_data={additionalData}
                        burn_amount={burnAmount}
                      />
                    </Col>
                  </Row>
                )}
              </>
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
