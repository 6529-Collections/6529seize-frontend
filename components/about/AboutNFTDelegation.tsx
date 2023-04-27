import { Col, Container, Row } from "react-bootstrap";

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
            Visit our{" "}
            <a href="/delegation/delegation-center">Delegation Center</a> to get
            started
          </Col>
        </Row>
      </Container>
    </>
  );
}
