"use client";

import { useEffect, useState } from "react";
import styles from "./DelegationHTML.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";

interface Props {
  path?: string;
  title?: string;
}

export default function DelegationHTML(props: Readonly<Props>) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);

  let titleLighter = "";
  let titleDarker = props.title;

  if (props.title?.includes(" ")) {
    const [firstWord, ...rest] = props.title.split(" ");
    titleLighter = firstWord;
    titleDarker = rest.join(" ");
  }

  useEffect(() => {
    if (props.path) {
      const url = `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/${props.path}.html`;
      fetch(url).then((response) => {
        if (response.status === 200) {
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
          unoptimized
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
        {props.title && (
          <Row>
            <Col>
              <h1>
                {titleLighter && `${titleLighter} `}
                {titleDarker}
              </h1>
            </Col>
          </Row>
        )}
        <Row className="pt-3">
          <Col
            className={styles.htmlContainer}
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          ></Col>
        </Row>
      </Container>
    );
  }
}
