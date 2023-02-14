import { Col, Container, Row } from "react-bootstrap";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutReleaseNotes() {
  return (
    <>
      <Head>
        <title>About - Release Notes | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About - Release Notes | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.RELEASE_NOTES}`}
        />
        <meta property="og:title" content={`About - Release Notes`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">RELEASE NOTES</h1>
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          <Col className="text-left">
            <p>
              <b>This is the Release log for the seize.io website.</b>
            </p>
            <p>The log is updated in reverse chronological order.</p>
            <p>
              Major site-wide releases are incremented as 1.x.x
              <br />
              New features are incremented as x.1.x
              <br />
              Small updates or bug fixes are incremented as x.x.1
            </p>
            <br />
            <p>
              <b>Release 1.0.0</b>
              <br />
              Feb TBC, 2023
              <br />
              This release is the initial site launch. Given this, it will be
              less detailed on each feature than subsequent logs.
            </p>
            <p>
              The initial release includes the following significant features
            </p>
            <ul>
              <li>Details about all Meme Cards</li>
              <li>Details about all Gradient</li>
              <li>Community Metrics</li>
              <li>Activity logs of purchases and transfers of Meme Cards</li>
              <li>Various informational pages</li>
            </ul>
          </Col>
        </Row>
      </Container>
    </>
  );
}
