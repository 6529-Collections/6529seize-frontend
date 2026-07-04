import type { Metadata } from "next";

import clsx from "clsx";

import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "@/components/about/AboutLayout";
import { getAppMetadata } from "@/components/providers/metadata";
import ToolsIndex from "@/components/tools/ToolsIndex";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.css";

const TOOLS_INDEX_LOCALE = DEFAULT_LOCALE;

export const metadata: Metadata = getAppMetadata({
  title: t(TOOLS_INDEX_LOCALE, "tools.index.metadata.title"),
  description: t(TOOLS_INDEX_LOCALE, "tools.index.metadata.description"),
});

export default function ToolsIndexPage() {
  return (
    <main className={clsx(styles["main"], "tailwind-scope")}>
      <Container fluid className="tw-pt-4">
        <Row>
          <Col>
            <ToolsIndex />
          </Col>
        </Row>
      </Container>
    </main>
  );
}
