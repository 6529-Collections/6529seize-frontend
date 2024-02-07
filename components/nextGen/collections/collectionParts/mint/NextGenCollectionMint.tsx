import { Col, Container, Row } from "react-bootstrap";
import NextGenMint from "./NextGenMint";
import { useState } from "react";
import { useContractRead } from "wagmi";
import {
  NEXTGEN_CORE,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_MINTER,
} from "../../../nextgen_contracts";
import Breadcrumb, { Crumb } from "../../../../breadcrumb/Breadcrumb";
import { NextGenCollection } from "../../../../../entities/INextgen";
import { formatNameForUrl } from "../../../nextgen_helpers";
import NextGenNavigationHeader from "../../NextGenNavigationHeader";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionMint(props: Readonly<Props>) {
  const crumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    {
      display: `${props.collection.name}`,
      href: `/nextgen/collection/${formatNameForUrl(props.collection.name)}`,
    },
    { display: "Mint" },
  ];

  const [burnAmount, setBurnAmount] = useState<number>(0);
  const [mintPrice, setMintPrice] = useState<number>(0);

  const burnAmountRead = useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "burnAmount",
    watch: true,
    args: [props.collection.id],
    onSettled(data: any, error: any) {
      if (data) {
        setBurnAmount(parseInt(data));
      }
    },
  });

  const mintPriceRead = useContractRead({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "getPrice",
    watch: true,
    args: [props.collection.id],
    onSettled(data: any, error: any) {
      if (!isNaN(parseInt(data))) {
        setMintPrice(parseInt(data));
      }
    },
  });

  return (
    <>
      <Breadcrumb breadcrumbs={crumbs} />
      <NextGenNavigationHeader />
      <Container className="pt-4 pb-4">
        {burnAmountRead.isSuccess && mintPriceRead.isSuccess && (
          <Row>
            <Col>
              <NextGenMint
                collection={props.collection}
                mint_price={mintPrice}
                burn_amount={burnAmount}
              />
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
}
