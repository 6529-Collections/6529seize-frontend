import { Col, Container, Row } from "react-bootstrap";
import NextGenMint from "./NextGenMint";
import { useEffect } from "react";
import { PhaseTimes, AdditionalData, Info } from "../../../nextgen_entities";
import {
  useCollectionPhases,
  useCollectionAdditionalData,
  useCollectionInfo,
  useTokensIndex,
  useSharedState,
} from "../../../nextgen_helpers";
import { useContractRead } from "wagmi";
import {
  NEXTGEN_CORE,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_MINTER,
} from "../../../nextgen_contracts";
import Breadcrumb, { Crumb } from "../../../../breadcrumb/Breadcrumb";

interface Props {
  collection: number;
}

export default function NextGenCollectionMint(props: Readonly<Props>) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
  ];

  const {
    breadcrumbs,
    setBreadcrumbs,
    info,
    setInfo,
    infoSettled,
    setInfoSettled,
    tokenStartIndex,
    setTokenStartIndex,
    phaseTimes,
    setPhaseTimes,
    additionalData,
    setAdditionalData,
    burnAmount,
    setBurnAmount,
    mintPrice,
    setMintPrice,
  } = useSharedState();

  useEffect(() => {
    setBreadcrumbs(crumbs);
  }, []);

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

  useCollectionInfo(props.collection, (data: Info) => {
    setInfo(data);
    const nameCrumb = data.name
      ? `#${props.collection} - ${data.name}`
      : `Collection #${props.collection}`;
    setBreadcrumbs((b) => [
      ...crumbs,
      { display: nameCrumb, href: `/nextgen/collection/${props.collection}` },
      { display: "Mint" },
    ]);
    setInfoSettled(true);
  });

  useCollectionPhases(props.collection, (data: PhaseTimes) => {
    setPhaseTimes(data);
  });

  useCollectionAdditionalData(
    props.collection,
    (data: AdditionalData) => {
      setAdditionalData(data);
    },
    true
  );

  useTokensIndex("min", props.collection, (data: number) => {
    setTokenStartIndex(data);
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

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container>
        {phaseTimes &&
          additionalData &&
          infoSettled &&
          info &&
          !!tokenStartIndex && (
            <Row>
              <Col>
                <NextGenMint
                  collection={props.collection}
                  collection_preview={tokenStartIndex}
                  info={info}
                  phase_times={phaseTimes}
                  mint_price={mintPrice}
                  additional_data={additionalData}
                  burn_amount={burnAmount}
                />
              </Col>
            </Row>
          )}
      </Container>
    </>
  );
}
