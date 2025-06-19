import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";
import { fetchAboutSectionFile } from "./about.helpers";

export default async function AboutGDRC1() {
  const html = await fetchAboutSectionFile("gdrc1");
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Global</span> Digital Rights Charter
          </h1>
        </Col>
      </Row>
      <Row>
        <Col className="pt-2 pb-2">
          We support{" "}
          <a
            href="https://digitalrightscharter.org/"
            target="_blank"
            rel="noreferrer">
            The Global Digital Rights Charter 1
          </a>
          .
          <br />
          <br />
          Full text of the GDRC 1 is below.
        </Col>
      </Row>
      <Row className="pt-1 pb-3">
        <Col
          className={styles.htmlContainer}
          dangerouslySetInnerHTML={{
            __html: html,
          }}></Col>
      </Row>
    </Container>
  );
}
