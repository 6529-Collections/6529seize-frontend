"use client"

import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { fetchAboutSectionFile } from "./about.helpers";
import styles from "./About.module.scss";

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
            Release Notes
          </h1>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col
          className={styles["htmlContainer"]}
          dangerouslySetInnerHTML={{
            __html: html,
          }}></Col>
      </Row>
    </Container>
  );
}
