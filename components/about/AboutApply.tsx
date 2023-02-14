import { Col, Container, Row } from "react-bootstrap";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutApply() {
  return (
    <>
      <Head>
        <title>About - Apply | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About - Apply | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.APPLY}`}
        />
        <meta property="og:title" content={`About - Apply`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">APPLY</h1>
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          <Col>
            <p>
              We accept third-party and self-nominations to be Meme Card
              artists.
            </p>
            <p>
              Please send an email to{" "}
              <a
                href="mailto:collections@6529.io"
                target="_blank"
                rel="noreferrer">
                collections&#64;6529.io
              </a>{" "}
              with:
            </p>
            <ul>
              <li>Your name:</li>
              <br />
              <li>Your twitter handle:</li>
              <br />
              <li>A link to your work:</li>
              <br />
              <li>Anything you would like us to know:</li>
            </ul>
            <br />
            <p>Please note:</p>
            <ul>
              <li>
                We are currently working on mints 2-3 months in the future
              </li>
              <br />
              <li>
                We are generally overwhelmed with messages so we might be slow
                to respond or might forget to respond. Please do not take it
                personally - we are doing our best!
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </>
  );
}
