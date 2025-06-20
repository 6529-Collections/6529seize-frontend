import styles from "../styles/Home.module.scss";
import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import MappingToolPlaceholder from "../components/mapping-tools/MappingToolPlaceholder";
import { useSetTitle } from "../contexts/TitleContext";

const DelegationMappingTool = dynamic(
  () => import("../components/mapping-tools/DelegationMappingTool"),

  { ssr: false, loading: () => <MappingToolPlaceholder /> }
);

export default function DelegationMappingToolPage() {
  useSetTitle("Delegation Mapping Tool | Tools");

  const [html, setHtml] = useState("");
  const [htmlError, setHtmlError] = useState(false);

  useEffect(() => {
    fetch(
      "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegation-mapping-tool/how-to-use.html"
    ).then((response) => {
      if (response.status === 200) {
        response.text().then((htmlText) => {
          setHtml(htmlText);
          setHtmlError(false);
        });
      } else {
        setHtmlError(true);
      }
    });
  }, []);

  return (
    <main className={styles.main}>
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
                    <span className="font-lightest">Delegation</span> Mapping
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
                  The Delegation Mapping tool allows anyone to easily upload a
                  CSV file with addresses to receive delegated addresses in
                  return (from the NFTDelegation.com contract).{" "}
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
                        <DelegationMappingTool />
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
            className={styles.htmlContainer}
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

DelegationMappingToolPage.metadata = {
  title: "Delegation Mapping Tool",
  description: "Tools",
};
