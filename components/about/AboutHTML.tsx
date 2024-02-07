import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";

interface Props {
  html: string;
}

export default function AboutHTML(props: Readonly<Props>) {
  return (
    <>
      <Container>
        <Col
          className={styles.htmlContainer}
          dangerouslySetInnerHTML={{
            __html: props.html,
          }}></Col>
      </Container>
    </>
  );
}
