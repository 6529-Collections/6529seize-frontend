import { Col, Container, Row, Table } from "react-bootstrap";
import Image from "next/image";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutMemes() {
  return (
    <Container>
      <Row>
        <Col>
          <h1 className="float-none">
            <span className="font-lightest">Memes</span> Are The Most Important
            Thing In The World
          </h1>
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
            Elections, politics, culture, brands, consumer behavior, cash-flows
            all derive from the most powerful memes in society at any given
            point in time.
          </p>
          <br />
          <p>
            <b>The Memes</b>
          </p>
          <p>
            The Memes is a collection of art NFTs whose goal is to spread the
            message of decentralization, in a way that tweetstorms, policy
            papers and podcasts can&apos;t.
          </p>
          <p>
            The Memes are large edition, CC0 (public domain) NFTs that spread
            far and wide, are remixed, ReMemed, and reinterpreted by the world
            at large.
          </p>
          <p>
            We believe that permissionless NFTs on decentralized public
            blockchains should used as the default ownership layer for digital
            objects - profile pictures, avatars, art, virtual spaces, game
            objects, identities and so on - and that application providers
            should reference that ownership layer. This is what we call
            &quot;the open metaverse&quot;. We think whether our digital objects
            are recorded in centralized corporate databased or user-owned public
            blockchains is the most consequential technology decision in our
            society right now.
          </p>
          <p>
            The Memes are large edition, CCO (public domain) NFTs that are
            actively encouraged to be spread far and wide, to be remixed, to be
            ReMemed and to be reinterpreted by the world at large.
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
  );
}
