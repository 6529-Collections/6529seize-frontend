"use client"

import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";
import { fetchAboutSectionFile } from "./about.helpers";
import { useEffect, useState } from "react";

export default function AboutReleaseNotes() {
  const [html, setHtml] = useState<string>("");
  useEffect(() => {
    fetchAboutSectionFile("release_notes").then(setHtml);
  }, []);

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
