import { Col, Container, Row } from "react-bootstrap";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";
import Image from "next/image";

export default function AboutMemeLab() {
  return (
    <>
      <Head>
        <title>About - MemeLab | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About - MemeLab | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.MEME_LAB}`}
        />
        <meta property="og:title" content={`About - MemeLab`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Container>
        <Row>
          <Col className="text-center pt-2 pb-4">
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
            <br />
            <p>
              We actively encourage the artists to experiment on any dimension
              they like on the Meme Labs contract - artistic, community, edition
              size, price and so on.
              <br />
              We will learn more in the next 6 months about how artists plan to
              use it and what happens.
            </p>
            <p>
              We hope to see some successes and certainly expect there will be
              some failures too.
            </p>
            <p>We intend to support the Meme Lab on seize.io.</p>
          </Col>
        </Row>
      </Container>
    </>
  );
}
