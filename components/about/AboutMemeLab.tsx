import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";

export default function AboutMemeLab() {
  return (
    <Container>
      <Row>
        <Col className="pt-2 pb-4">
          <Image
            loading="eager"
            priority
            width="0"
            height="0"
            style={{ width: "250px", height: "auto" }}
            src="/memelab.png"
            alt="memelab"
          />
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p>
            The Meme Lab is an experimental CC0 contract for artists who have
            already minted a Meme Card. They can use the Meme Lab contract to
            mint NFTs that they like, in any way that they like.
          </p>
          <p>
            We actively encourage the artists to experiment on any dimension
            they like on the Meme Lab&apos;s contract - artistic, community,
            edition size, price and so on.
            <br />
            We will learn more in the next 6 months about how artists plan to
            use it and what happens.
          </p>
          <p>
            We hope to see some successes, and certainly expect there will be
            some failures too.
          </p>
        </Col>
      </Row>
    </Container>
  );
}
