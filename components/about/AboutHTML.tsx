import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";
import { fetchAboutSectionFile } from "./about.helpers";

interface Props {
  path: string;
  title: string;
}

export default async function AboutHTML(props: Readonly<Props>) {
  const html = await fetchAboutSectionFile(props.path);
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
            __html: html,
          }}></Col>
      </Row>
    </Container>
  );
}
