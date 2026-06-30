import Link from "next/link";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "./AboutLayout";

export default function AboutNFTDelegation() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            NFT Delegation
          </h1>
        </Col>
      </Row>
      <Row className="tw-pt-5">
        <Col>
          Visit our{" "}
          <Link href="/delegation/delegation-center">Delegation Center</Link> to
          get started
        </Col>
      </Row>
    </Container>
  );
}
