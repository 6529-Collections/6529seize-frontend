import type { Metadata } from "next";

import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "@/components/about/AboutLayout";
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
    <main className={`${styles["main"]} tailwind-scope`}>
      <Container fluid className="tw-pt-4">
        <Row>
          <Col>
            <AboutIndex />
          </Col>
        </Row>
      </Container>
    </main>
  );
}
