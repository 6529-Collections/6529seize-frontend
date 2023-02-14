import { Col, Container, Row, Table } from "react-bootstrap";
import Image from "next/image";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutMemes() {
  return (
    <>
      <Head>
        <title>About - The Memes | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About - The Memes | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.MEMES}`}
        />
        <meta property="og:title" content={`About - The Memes`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">
              MEMES ARE THE MOST IMPORTANT THING IN THE WORLD
            </h1>
          </Col>
        </Row>
        <Row className="pt-2 pb-2">
          <Col className="pt-3 pb-3 text-center">
            <Image
              width="0"
              height="0"
              style={{
                height: "auto",
                width: "auto",
                maxHeight: "400px",
                maxWidth: "100%",
              }}
              src="/memes-preview.png"
              alt="The Memes"
            />
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          <Col>
            <p>Memes are intersubjective myths.</p>
            <p>
              Memes are how all advanced societies organize themselves across
              large groups of people.{" "}
            </p>
            <p>
              Elections, politics, culture, brands, consumer behavior,
              cash-flows all derive from the most powerful memes in society at
              any given point in time.
            </p>
            <br />
            <p>
              <b>The Memes</b>
            </p>
            <p>
              The Memes is a collection of art NFTs whose goal is to spread the
              message of decentralization, in a way that tweetstorms, policy
              papers and podcast can&apos;t.
            </p>
            <p>
              More specifically, we believe that the ownership layer metaverse
              should be built on open standards on an interoperable public
              commons, namely NFTs.
            </p>
            <p>
              This is what we call &quot;the open metaverse&quot; and we think
              it is the most consequential technology decision in our society
              right now.
            </p>
            <p>
              The Memes are large edition, CCO (public domain) NFTs that are
              actively encouraged to be spread far and wide, to be remixed, to
              be ReMemed and to be reinterpreted by the world at large.
            </p>
            <br />
            <p>
              <b>Learn More About The Memes:</b>
            </p>
            <p>
              All The Memes:{" "}
              <a href={`/the-memes`} target="_blank" rel="noreferrer">
                seize.io/the-memes
              </a>
            </p>
            <p>
              The Memes Community:{" "}
              <a href={`/community`} target="_blank" rel="noreferrer">
                seize.io/community
              </a>
            </p>
            <p>
              FAQs:{" "}
              <a
                href={`/about/${AboutSection.FAQ}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/faq
              </a>
            </p>
            <p>
              The Memes Discord:{" "}
              <a
                href="https://discord.gg/join-om"
                target="_blank"
                rel="noreferrer">
                discord.gg/join-om
              </a>
            </p>
            <p>
              Minting Memes:{" "}
              <a
                href={`/about/${AboutSection.MINTING}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/minting
              </a>
            </p>
          </Col>
        </Row>
      </Container>
    </>
  );
}
