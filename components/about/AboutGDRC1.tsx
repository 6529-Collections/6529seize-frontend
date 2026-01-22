"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";
import { fetchAboutSectionFile } from "./about.helpers";
import { sanitizeUntrustedHtml } from "@/lib/security/sanitizeHtml";

export default function AboutGDRC1() {
  const [html, setHtml] = useState<string>("");
  useEffect(() => {
    fetchAboutSectionFile("gdrc1").then(setHtml);
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
            Global Digital Rights Charter
          </h1>
        </Col>
      </Row>
      <Row>
        <Col className="pt-2 pb-2">
          We support{" "}
          <Link
            href="https://digitalrightscharter.org/"
            target="_blank"
            rel="noopener noreferrer">
            The Global Digital Rights Charter 1
          </Link>
          .
          <br />
          <br />
          Full text of the GDRC 1 is below.
        </Col>
      </Row>
      <Row className="pt-1 pb-3">
        <Col
          className={styles["htmlContainer"]}
          dangerouslySetInnerHTML={{
            __html: sanitizedHtml,
          }}></Col>
      </Row>
    </Container>
  );
}
