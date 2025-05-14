import styles from "../styles/Home.module.scss";
import { Container, Row, Col, Table } from "react-bootstrap";
import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { AuthContext } from "../components/auth/Auth";

export default function ConsolidationUseCases() {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Consolidation Use Cases | Tools",
    });
  }, []);

  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const url = `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/consolidation-use-cases.html`;
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
  }, []);

  return (
    <main className={`${styles.main} ${styles.tdhMain}`}>
      <Container fluid>
        <Row>
          <Col>
            <Container className="pt-4">
              <Row>
                <Col>
                  <h1>
                    <span className="font-lightest">Consolidation</span> Use
                    Cases
                  </h1>
                </Col>
              </Row>
              <Row className="pt-3 pb-3">
                {error ? (
                  <div>
                    <Image
                      width="0"
                      height="0"
                      style={{ height: "auto", width: "100px" }}
                      src="/SummerGlasses.svg"
                      alt="SummerGlasses"
                    />
                    <h2>Loading HTML Failed</h2>
                  </div>
                ) : (
                  <Col
                    className={styles.htmlContainer}
                    dangerouslySetInnerHTML={{
                      __html: html,
                    }}></Col>
                )}
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </main>
  );
}

ConsolidationUseCases.metadata = {
  title: "Consolidation Use Cases",
  description: "Tools",
};
