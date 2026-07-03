"use client";

import { useEffect, useState } from "react";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "./AboutLayout";
import styles from "./About.module.css";
import { fetchAboutSectionFile } from "./about.helpers";

interface Props {
  path: string;
  title: string;
}

export default function AboutHTML(props: Readonly<Props>) {
  const [html, setHtml] = useState<string>("");
  useEffect(() => {
    fetchAboutSectionFile(props.path).then(setHtml);
  }, [props.path]);

  let titleLighter = "";
  let titleDarker = props.title;

  if (props.title?.includes(" ")) {
    const [firstWord, ...rest] = props.title.split(" ");
    titleLighter = firstWord!;
    titleDarker = rest.join(" ");
  }

  return (
    <Container>
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
      <Row>
        <Col
          className={styles["htmlContainer"]}
          dangerouslySetInnerHTML={{
            __html: html,
          }}></Col>
      </Row>
    </Container>
  );
}
