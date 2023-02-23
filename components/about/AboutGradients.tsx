import { Col, Container, Row } from "react-bootstrap";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";
import Image from "next/image";

export default function AboutGradients() {
  return (
    <>
      <Head>
        <title>About - 6529 Gradient | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About - 6529 Gradient | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.GRADIENTS}`}
        />
        <meta property="og:title" content={`About - 6529 Gradient`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">THE 6529 GRADIENT COLLECTION</h1>
          </Col>
        </Row>
        <Row className="pt-2 pb-2">
          <Col className="pt-3 pb-3 text-center">
            <Image
              loading="eager"
              priority
              width="0"
              height="0"
              style={{
                height: "auto",
                width: "auto",
                maxHeight: "400px",
                maxWidth: "100%",
              }}
              src="/gradients-preview.png"
              alt="6529 Gradient"
            />
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          <Col>
            <p>
              The Gradient Collection is a collection of 101 NFTs. They were
              auctioned to collectors in 2021 and 2022.
            </p>
            <p>
              Gradients #0, #50 and #100 are in the 6529 Museum Permanent
              Collection.
              <br />
              Gradients #10, #20, #30, #40, #50, #60, #70, #80, #90 will be held
              by 6529 Museum for now.
            </p>
            <br />
            <p>
              <b>Design</b>
            </p>
            <p>
              The 6529 Gradient Collection represents the 6529 symbol in its
              original two stark black (#100) and white (#0) forms as well 98
              grayscale gradients in-between. Each grayscale gradient is a 1%
              increment in darkness between 100% black and 100% white, with the
              background switching from white to black from #49 to #51.
            </p>
            <p>
              It is the artist&apos;s (&#64;
              <a
                href="https://twitter.com/6529er"
                target="_blank"
                rel="noreferrer">
                6529er
              </a>
              ) preferred interpretation of his work and his vision for it in
              its purest form. It reminds us of the Chromie Squiggles Perfect
              Spectrums - much less flashy than the HyperRainbows, but it is an
              iykyk choice.
            </p>
            <p>
              Each of the 100 pieces is represented as a 100% on-chain SVG with
              a secondary IPFS link.
            </p>
            <p>
              The more mathematically inclined readers will note that #0 to #100
              represents 101 tokens, not 100. That is right, there is a special
              token, #50 that is built different. It is a gif (how could we not
              have a gif?) and, like the squiggles, it moves.
            </p>
            <br />
            <p>
              <b>What Do The Gradients Do?</b>
            </p>
            <p>
              The Gradients do not do anything. They are a graphic expression of
              the 6529 logo.
            </p>
            <p>
              We encourage social experimentation in the Gradient community, as
              the collectors are likely to be strong supporters of
              decentralization.
            </p>
          </Col>
        </Row>
      </Container>
    </>
  );
}
