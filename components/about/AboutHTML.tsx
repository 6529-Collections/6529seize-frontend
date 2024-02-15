import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";

interface Props {
  html: string;
  title: string;
}

export default function AboutHTML(props: Readonly<Props>) {
  let titleLighter = "";
  let titleDarker = props.title;

  if (props.title?.includes(" ")) {
    const [firstWord, ...rest] = props.title.split(" ");
    titleLighter = firstWord;
    titleDarker = rest.join(" ");
  }

  return (
    <Container>
      {props.title && (
        <Row>
          <Col>
            <h1>
              {titleLighter && (
                <span className="font-lightest">{titleLighter}</span>
              )}{" "}
              {titleDarker}
            </h1>
          </Col>
        </Row>
      )}
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
