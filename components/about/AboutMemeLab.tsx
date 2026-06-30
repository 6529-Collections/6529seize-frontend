import Image from "next/image";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "./AboutLayout";

export default function AboutMemeLab() {
  return (
    <Container>
      <Row>
        <Col className="tw-pt-2 tw-pb-4">
          <Image
            unoptimized
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
      <Row className="tw-pt-3 tw-pb-3">
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
