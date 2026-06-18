import NextGenAdminComponent from "@/components/nextGen/admin/NextGenAdmin";
import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Container, Row, Col } from "react-bootstrap";
import styles from "@/styles/Home.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "NextGen Admin",
      description: "NextGen",
      ogImage: getCollectionSocialCardImagePath("nextgen", {
        subtitle: "Manage NextGen collections",
        title: "NextGen Admin",
      }),
      ogImageAlt: "NextGen Admin social card",
    })
  );
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
