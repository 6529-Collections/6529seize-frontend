import type { Metadata } from "next";
import { Col, Container, Row } from "react-bootstrap";

import AboutIndex from "@/components/about/AboutIndex";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.scss";

const ABOUT_INDEX_LOCALE = DEFAULT_LOCALE;

export const metadata: Metadata = getAppMetadata({
  title: t(ABOUT_INDEX_LOCALE, "about.index.metadata.title"),
  description: t(ABOUT_INDEX_LOCALE, "about.index.metadata.description"),
});

export default function AboutIndexPage() {
  return (
    <main className={styles["main"]}>
      <Container fluid className="pt-4">
        <Row>
          <Col>
            <AboutIndex />
          </Col>
        </Row>
      </Container>
    </main>
  );
}
