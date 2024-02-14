import styles from "./About.module.scss";
import { Col, Container, Row } from "react-bootstrap";

interface Props {
  html: string;
}

export default function AboutMemesCalendar(props: Readonly<Props>) {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Memes</span> Seasonal Calendar
          </h1>
        </Col>
      </Row>
      <Row>
        <Col
          className={styles.htmlContainer}
          dangerouslySetInnerHTML={{
            __html: props.html,
          }}></Col>
      </Row>
    </Container>
  );
}
