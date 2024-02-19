import { Col, Container, Row } from "react-bootstrap";

export default function AboutNFTDelegation() {
  return (
    <Container>
      <Row>
        <Col>
          <h1 className="float-none">
            <span className="font-lightest">NFT</span> Delegation
          </h1>
        </Col>
      </Row>
      <Row className="pt-5">
        <Col>
          Visit our{" "}
          <a href="/delegation/delegation-center">Delegation Center</a> to get
          started
        </Col>
      </Row>
    </Container>
  );
}
