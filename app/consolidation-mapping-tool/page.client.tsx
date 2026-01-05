"use client";

import ConsolidationMappingTool from "@/components/mapping-tools/ConsolidationMappingTool";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

export default function ConsolidationMappingToolPage() {
  useSetTitle("Consolidation Mapping Tool | Tools");

  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch(
      "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/consolidation-mapping-tool/how-to-use.html"
    ).then((response) => {
      if (response.status === 200) {
        response.text().then((htmlText) => {
          setHtml(htmlText);
        });
      }
    });
  }, []);

  return (
    <main className={styles["main"]}>
      <Container fluid>
        <Row>
          <Col>
            <Container>
              <Row className="pt-4">
                <Col
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 10, offset: 1 }}
                  lg={{ span: 8, offset: 2 }}>
                  <h1 className="text-center">
                    Consolidation Mapping
                    Tool
                  </h1>
                </Col>
              </Row>
              <Row className="pt-2">
                <Col
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 10, offset: 1 }}
                  lg={{ span: 8, offset: 2 }}>
                  <h5>Overview</h5>
                </Col>
              </Row>
              <Row>
                <Col
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 10, offset: 1 }}
                  lg={{ span: 8, offset: 2 }}>
                  The Consolidation Mapping tool allows anyone to easily upload
                  a CSV file with addresses and balances to receive consolidated
                  addresses in return (from the NFTDelegation contract).{" "}
                  <a href="#how-to-use">How to use this tool?</a>
                </Col>
              </Row>
              <Row>
                <Col
                  xs={{ span: 12 }}
                  sm={{ span: 10, offset: 1 }}
                  md={{ span: 8, offset: 2 }}
                  lg={{ span: 6, offset: 3 }}>
                  <Container className="pt-5 pb-5">
                    <Row>
                      <Col>
                        <ConsolidationMappingTool />
                      </Col>
                    </Row>
                  </Container>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
      <Container id="how-to-use" className="pt-1 pb-5">
        <Row>
          <Col
            className={styles["htmlContainer"]}
            xs={{ span: 12 }}
            sm={{ span: 10, offset: 1 }}
            md={{ span: 8, offset: 2 }}
            lg={{ span: 6, offset: 3 }}
            dangerouslySetInnerHTML={{
              __html: html,
            }}></Col>
        </Row>
      </Container>
    </main>
  );
}
