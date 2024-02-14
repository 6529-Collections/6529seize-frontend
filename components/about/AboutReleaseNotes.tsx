import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";

interface Props {
  html: string;
}

export default function AboutReleaseNotes(props: Readonly<Props>) {
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
            __html: props.html,
          }}></Col>
      </Row>
    </Container>
  );
}
