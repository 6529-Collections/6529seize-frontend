"use client";

import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";
import { fetchAboutSectionFile } from "./about.helpers";
import { useEffect, useMemo, useState } from "react";
import { sanitizeUntrustedHtml } from "@/lib/security/sanitizeHtml";

export default function AboutReleaseNotes() {
  const [html, setHtml] = useState<string>("");
  useEffect(() => {
    fetchAboutSectionFile("release_notes").then(setHtml);
  }, []);
  const sanitizedHtml = useMemo(
    () => sanitizeUntrustedHtml(html, { allowStyleAttribute: true }),
    [html]
  );

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
            __html: sanitizedHtml,
          }}></Col>
      </Row>
    </Container>
  );
}
