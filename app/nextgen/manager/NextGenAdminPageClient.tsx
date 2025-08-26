"use client";

import styles from "@/styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useTitle } from "@/contexts/TitleContext";
import NextGenAdminComponent from "@/components/nextGen/admin/NextGenAdmin";

export default function NextGenAdminPageClient() {
  const { setTitle } = useTitle();
  setTitle("NextGen Admin");

  return (
    <main className={styles.main}>
      <Container fluid className={styles.main}>
        <Row>
          <Col>
            <NextGenAdminComponent />
          </Col>
        </Row>
      </Container>
    </main>
  );
}
