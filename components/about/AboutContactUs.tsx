import { Col, Container, Row } from "react-bootstrap";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutContactUs() {
  return (
    <>
      <Head>
        <title>About - Contact Us | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About - Contact Us | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.CONTACT_US}`}
        />
        <meta property="og:title" content={`About - Contact Us`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">CONTACT US</h1>
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          <Col>
            <p>
              The best way to find us at:{" "}
              <a
                href="https://twitter.com/6529collections"
                target="_blank"
                rel="noreferrer">
                https://twitter.com/6529collections
              </a>
            </p>
            <br />
            <p>Alternative, but not as good, methods to contact us are:</p>
            <ul>
              <li>
                Trying to get the attention of &#64;
                <a
                  href="https://twitter.com/punk6529"
                  target="_blank"
                  rel="noreferrer">
                  punk6529
                </a>{" "}
                or &#64;
                <a
                  href="https://twitter.com/6529er"
                  target="_blank"
                  rel="noreferrer">
                  6529er
                </a>{" "}
                or &#64;
                <a
                  href="https://twitter.com/teexels"
                  target="_blank"
                  rel="noreferrer">
                  teexels
                </a>{" "}
                on Twitter
              </li>
              <br />
              <li>
                Trying to get the attention of &#64;
                <a
                  href="https://twitter.com/punk6529"
                  target="_blank"
                  rel="noreferrer">
                  punk6529
                </a>
                , &#64;
                <a
                  href="https://twitter.com/6529er"
                  target="_blank"
                  rel="noreferrer">
                  6529er
                </a>{" "}
                or &#64;
                <a
                  href="https://twitter.com/teexels"
                  target="_blank"
                  rel="noreferrer">
                  teexels
                </a>{" "}
                in the OM Discord (
                <a
                  href="https://discord.gg/join-om"
                  target="_blank"
                  rel="noreferrer">
                  https://discord.gg/join-om
                </a>
                ). We don&apos;t answer Discord DMs from people we don&apos;t
                already know.
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </>
  );
}
