import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import TechReportPage from "@/components/about/tech/TechReportPage";
import {
  TECH_PR_REPORTS,
  getTechReportBySlug,
} from "@/components/about/tech/reports";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.scss";
import { AboutSection } from "@/types/enums";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Col, Container, Row } from "react-bootstrap";

interface Props {
  params: Promise<{ reportSlug: string }>;
}

export default async function AboutTechReportRoute(props: Readonly<Props>) {
  const { reportSlug } = await props.params;
  const report = getTechReportBySlug(reportSlug);

  if (!report) {
    notFound();
  }

  return (
    <main className={styles["main"]}>
      <Container fluid className="pt-4">
        <Row>
          <Col>
            <Container className="pt-2">
              <Row>
                <Col>
                  <AboutContentsDropdown currentSection={AboutSection.TECH} />
                  <div className="tw-w-full">
                    <TechReportPage report={report} />
                  </div>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reportSlug } = await params;
  const report = getTechReportBySlug(reportSlug);

  if (!report) {
    return getAppMetadata({
      title: t(DEFAULT_LOCALE, "about.tech.metadata.title"),
      description: t(DEFAULT_LOCALE, "about.tech.metadata.description"),
    });
  }

  return getAppMetadata({
    title: report.title,
    description: report.description,
  });
}

export function generateStaticParams() {
  return TECH_PR_REPORTS.map((report) => ({ reportSlug: report.slug }));
}
