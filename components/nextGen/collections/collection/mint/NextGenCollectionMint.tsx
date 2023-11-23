import { Col, Container, Row } from "react-bootstrap";
import NextGenMint from "./NextGenMint";
import { useEffect, useState } from "react";
import { PhaseTimes, AdditionalData, Info } from "../../../nextgen_entities";
import {
  retrieveCollectionPhases,
  retrieveCollectionAdditionalData,
  retrieveCollectionInfo,
} from "../../../nextgen_helpers";
import { useContractRead } from "wagmi";
import {
  NEXTGEN_CORE,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_MINTER,
} from "../../../nextgen_contracts";
import NextGenCollectionHeader from "../NextGenCollectionHeader";
import Breadcrumb, { Crumb } from "../../../../breadcrumb/Breadcrumb";

interface Props {
  collection: number;
}

export default function NextGenCollectionMint(props: Readonly<Props>) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
  ];
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>(crumbs);

  const [info, setInfo] = useState<Info>();
  const [infoSettled, setInfoSettled] = useState<boolean>(false);

  const [tokenStartIndex, setTokenStartIndex] = useState<number>(0);

  const [phaseTimes, setPhaseTimes] = useState<PhaseTimes>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();

  const [burnAmount, setBurnAmount] = useState<number>(0);
  const [mintPrice, setMintPrice] = useState<number>(0);

  retrieveCollectionInfo(props.collection, (data: Info) => {
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
    functionName: "viewTokensIndexMin",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        setTokenStartIndex(parseInt(data));
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

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container className="pt-4 pb-4">
        {phaseTimes && additionalData && infoSettled && info && (
          <>
            <Row>
              <Col>
                <NextGenCollectionHeader
                  collection={props.collection}
                  info={info}
                  phase_times={phaseTimes}
                  additional_data={additionalData}
                  collection_link={true}
                />
              </Col>
            </Row>
            <Row className="pt-4">
              <Col>
                <NextGenMint
                  collection={props.collection}
                  collection_preview={tokenStartIndex}
                  phase_times={phaseTimes}
                  mint_price={mintPrice}
                  additional_data={additionalData}
                  burn_amount={burnAmount}
                />
              </Col>
            </Row>
          </>
        )}
      </Container>
    </>
  );
}
