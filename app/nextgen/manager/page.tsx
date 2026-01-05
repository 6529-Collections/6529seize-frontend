import NextGenAdminComponent from "@/components/nextGen/admin/NextGenAdmin";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Container, Row, Col } from "react-bootstrap";
import styles from "@/styles/Home.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "NextGen Admin" });
}

export default function NextGenAdminPage() {
  return (
    <main className={styles["main"]}>
      <Container fluid className={styles["main"]}>
        <Row>
          <Col>
            <NextGenAdminComponent />
          </Col>
        </Row>
      </Container>
    </main>
  );
}
