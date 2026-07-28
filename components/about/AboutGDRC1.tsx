"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "./AboutLayout";
import { fetchAboutSectionFile } from "./about.helpers";

export default function AboutGDRC1() {
  const [html, setHtml] = useState<string>("");
  useEffect(() => {
    fetchAboutSectionFile("gdrc1").then(setHtml);
  }, []);

  return (
    <Container className="tw-pb-12 tw-text-iron-300">
      <Row>
        <Col>
          <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
            Global Digital Rights Charter
          </h1>
        </Col>
      </Row>
      <Row>
        <Col className="tw-pb-2 tw-pt-5 tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300">
          We support{" "}
          <Link
            className="tw-font-medium tw-text-iron-100 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60"
            href="https://digitalrightscharter.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Global Digital Rights Charter 1
          </Link>
          .
          <br />
          <br />
          Full text of the GDRC 1 is below.
        </Col>
      </Row>
      <Row className="tw-pb-3 tw-pt-1">
        <Col
          className="tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300 [&_.text-subheading]:tw-text-sm [&_.text-subheading]:tw-font-normal [&_.text-subheading]:tw-leading-6 [&_.text-subheading]:tw-text-iron-400 [&_h2]:tw-mb-0 [&_h2]:tw-mt-0 [&_h2]:tw-text-lg [&_h2]:tw-font-semibold [&_h2]:tw-leading-tight [&_h2]:tw-tracking-tight [&_h2]:tw-text-iron-100 sm:[&_h2]:tw-text-xl [&_h3]:tw-mb-3 [&_h3]:tw-mt-0 [&_h3]:tw-text-base [&_h3]:tw-font-semibold [&_h3]:tw-leading-6 [&_h3]:tw-text-iron-100 [&_h5]:tw-mb-3 [&_h5]:tw-mt-0 [&_h5]:tw-text-base [&_h5]:tw-font-semibold [&_h5]:tw-leading-6 [&_h5]:tw-text-iron-100 [&_li]:tw-mb-3 [&_li]:tw-mt-0 [&_ol]:tw-mb-0 [&_ol]:tw-mt-3 [&_ol]:tw-pl-6 [&_p]:tw-mb-4 [&_p]:tw-mt-3 [&_ul]:tw-mb-0 [&_ul]:tw-mt-3 [&_ul]:tw-pl-6"
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        ></Col>
      </Row>
    </Container>
  );
}
