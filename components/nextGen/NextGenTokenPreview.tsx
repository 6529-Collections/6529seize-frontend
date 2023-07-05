import styles from "./NextGen.module.scss";
import NextGenTokenImage from "./NextGenTokenImage";
import { Col, Container, Row } from "react-bootstrap";
import { TokenURI } from "./entities";
import { useState } from "react";
import { useContractRead, useEnsName } from "wagmi";
import { NEXT_GEN_ABI } from "../../abis";
import { NEXT_GEN_CONTRACT } from "../../constants";

interface Props {
  token: TokenURI;
}

export default function NextGenTokenPreview(props: Props) {
  const [owner, setOwner] = useState<`0x${string}`>();
  const [ownerENS, setOwnerENS] = useState<string>();
  const [name, setName] = useState<string>();

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "ownerOf",
    watch: true,
    args: [props.token.id],
    onSettled(data: any, error: any) {
      if (data) {
        setOwner(data);
      }
    },
  });

  useEnsName({
    address: owner,
    chainId: 1,
    onSettled(data: any, error: any) {
      if (data) {
        setOwnerENS(data);
      }
    },
  });

  return (
    <a
      href={`/nextgen/${props.token.collection}/${props.token.id}`}
      className="decoration-none">
      <Container className="no-padding pt-3 pb-3">
        <Row>
          <Col className="text-center">
            <NextGenTokenImage
              token={props.token}
              preview={true}
              setName={(name) => setName(name)}
            />
          </Col>
        </Row>
        <Row className="pt-1">
          <Col className="text-center">#{props.token.id}</Col>
        </Row>
        <Row className="pt-1">
          <Col className="text-center">
            {props.token.name ? props.token.name : name}
          </Col>
        </Row>
        {/* {owner && (
          <Row className="pt-1">
            <Col className="text-center">
              <Address wallets={[owner]} display={ownerENS} />
            </Col>
          </Row>
        )} */}
      </Container>
    </a>
  );
}
