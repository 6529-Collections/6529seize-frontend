import styles from "./NextGen.module.scss";
import NextGenTokenImage from "./NextGenTokenImage";
import { Col, Container, Row } from "react-bootstrap";
import { TokenURI } from "./entities";
import { useState } from "react";
import { useContractRead, useEnsName } from "wagmi";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "./contracts";

interface Props {
  token: TokenURI;
}

export default function NextGenTokenPreview(props: Props) {
  const [owner, setOwner] = useState<`0x${string}`>();
  const [ownerENS, setOwnerENS] = useState<string>();
  const [name, setName] = useState<string>();

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
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
    <a href={`/nextgen/token/${props.token.id}`} className="decoration-none">
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
