import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";
import Image from "next/image";
import { DELEGATION_CONTRACT } from "../../constants";
import { sepolia } from "wagmi/chains";

export default function AboutNFTDelegation() {
  return (
    <>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">NFT DELEGATION</h1>
          </Col>
        </Row>
        <Row className="pt-5">
          <Col className="text-center">
            Visit our <a href="/delegation-center">Delegation Center</a> to get
            started
          </Col>
        </Row>
      </Container>
    </>
  );
}
