import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";
import { fetchAboutSectionFile } from "./about.helpers";

export default async function AboutReleaseNotes() {
  const html = await fetchAboutSectionFile("release_notes");
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Release</span> Notes
          </h1>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col
          className={styles.htmlContainer}
          dangerouslySetInnerHTML={{
            __html: html,
          }}></Col>
      </Row>
    </Container>
  );
}
