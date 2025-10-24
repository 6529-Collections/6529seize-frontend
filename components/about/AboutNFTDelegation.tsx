import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

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
      <Row className="pt-5">
        <Col>
          Visit our{" "}
          <Link href="/delegation/delegation-center">Delegation Center</Link> to
          get started
        </Col>
      </Row>
    </Container>
  );
}
