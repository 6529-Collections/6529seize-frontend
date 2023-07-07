import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";

interface Props {
  html: string;
}

export default function AboutFAQ(props: Props) {
  return (
    <>
      <Container>
        <Row>
          <Col
            className={styles.htmlContainer}
            dangerouslySetInnerHTML={{
              __html: props.html,
            }}></Col>
        </Row>
      </Container>
    </>
  );
}
