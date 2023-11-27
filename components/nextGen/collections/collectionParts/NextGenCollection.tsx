import { Container, Row, Col } from "react-bootstrap";
import { useContractRead } from "wagmi";
import { useEffect, useState } from "react";
import { Info, AdditionalData, PhaseTimes } from "../../nextgen_entities";
import Image from "next/image";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "../../nextgen_contracts";
import Breadcrumb, { Crumb } from "../../../breadcrumb/Breadcrumb";
import NextGenCollectionHeader from "./NextGenCollectionHeader";
import NextGenCollectionArt from "./NextGenCollectionArt";
import {
  retrieveCollectionAdditionalData,
  retrieveCollectionInfo,
  retrieveCollectionPhases,
} from "../../nextgen_helpers";
import NextGenCollectionDetails from "./NextGenCollectionDetails";
import NextGenCollectionSlideshow from "./NextGenCollectionSlideshow";

const ART_TOKEN_COUNT = 8;

interface Props {
  collection: number;
}

export default function NextGenCollection(props: Readonly<Props>) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
  ];
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>(crumbs);

  const [tokenStartIndex, setTokenStartIndex] = useState<number>(0);
  const [tokenEndIndex, setTokenEndIndex] = useState<number>(0);

  const [info, setInfo] = useState<Info>();
  const [infoSettled, setInfoSettled] = useState<boolean>(false);
  const [phaseTimes, setPhaseTimes] = useState<PhaseTimes>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();

  const [tokenIds, setTokenIds] = useState<number[]>([]);

  const [burnAmount, setBurnAmount] = useState<number>(0);
  const [mintPrice, setMintPrice] = useState<number>(0);

  const [artistSignature, setArtistSignature] = useState<string>("");

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

  useEffect(() => {
    if (tokenStartIndex > 0 && additionalData) {
      const rangeLength = Math.min(
        ART_TOKEN_COUNT,
        additionalData.circulation_supply
      );
      setTokenIds(
        Array.from({ length: rangeLength }, (_, i) => tokenStartIndex + i)
      );
    }
  }, [tokenStartIndex, additionalData]);

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

  retrieveCollectionInfo(props.collection, (data: Info) => {
    setInfo(data);
    const nameCrumb = data.name
      ? `#${props.collection} - ${data.name}`
      : `Collection #${props.collection}`;
    setBreadcrumbs((b) => [...crumbs, { display: nameCrumb }]);
    setInfoSettled(true);
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
          {additionalData && (
            <NextGenCollectionSlideshow
              collection_name={info.name}
              collection={props.collection}
              start_index={tokenStartIndex}
              length={additionalData.circulation_supply}
            />
          )}
          <Container className="pt-3 pb-2">
            {additionalData && info && phaseTimes && (
              <>
                <NextGenCollectionHeader
                  collection={props.collection}
                  info={info}
                  phase_times={phaseTimes}
                  additional_data={additionalData}
                />
                <Row className="pt-5">
                  <Col>
                    <NextGenCollectionArt
                      collection={props.collection}
                      additional_data={additionalData}
                      token_ids={tokenIds}
                      show_view_all={true}
                    />
                  </Col>
                </Row>
                <Row className="pt-5">
                  <Col>
                    <NextGenCollectionDetails
                      collection={props.collection}
                      additional_data={additionalData}
                      info={info}
                      phase_times={phaseTimes}
                      burn_amount={burnAmount}
                      token_start_index={tokenStartIndex}
                      token_end_index={tokenEndIndex}
                      mint_price={mintPrice}
                      artist_signature={artistSignature}
                    />
                  </Col>
                </Row>
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
