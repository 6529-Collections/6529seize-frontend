import type { Metadata } from "next";

import {
  AboutCol as Col,
  AboutContainer as Container,
  ABOUT_PAGE_SURFACE_CLASS_NAME,
  AboutRow as Row,
} from "@/components/about/AboutLayout";
import AboutIndex from "@/components/about/AboutIndex";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const ABOUT_INDEX_LOCALE = DEFAULT_LOCALE;

export const metadata: Metadata = getAppMetadata(
  {
    title: t(ABOUT_INDEX_LOCALE, "about.index.metadata.title"),
    description: "About 6529 and its decentralized network society.",
  },
  { canonicalPath: "/about" }
);

export default function AboutIndexPage() {
  return (
    <main className={`tailwind-scope ${ABOUT_PAGE_SURFACE_CLASS_NAME}`}>
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
