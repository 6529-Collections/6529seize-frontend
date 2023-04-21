import { useEffect, useState } from "react";
import styles from "./DelegationHTML.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";

interface Props {
  path?: string;
}

export default function DelegationHTML(props: Props) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (props.path) {
      const url = `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/${props.path}.html`;
      fetch(url).then((response) => {
        if (response.status == 200) {
          response.text().then((htmlText) => {
            setHtml(htmlText);
            setError(false);
          });
        } else {
          setError(true);
        }
      });
    } else {
      setError(true);
    }
  }, [props.path]);

  if (error) {
    return (
      <div className={`${styles.mainContainer} ${styles.pageNotFound}`}>
        <Image
          width="0"
          height="0"
          style={{ height: "auto", width: "100px" }}
          src="/SummerGlasses.svg"
          alt="SummerGlasses"
        />
        <h2>404 | PAGE NOT FOUND</h2>
      </div>
    );
  } else {
    return (
      <Container className="pt-2">
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
}
