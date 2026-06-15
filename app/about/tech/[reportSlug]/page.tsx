import { AboutMenu } from "@/components/about/About";
import TechReportPage from "@/components/about/tech/TechReportPage";
import { TECH_WEEKLY_PR_REPORT } from "@/components/about/tech/reports";
import { getAppMetadata } from "@/components/providers/metadata";
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

  if (reportSlug !== TECH_WEEKLY_PR_REPORT.slug) {
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
                  <div className="tw-flex tw-flex-col md:tw-flex-row">
                    <div className="tw-hidden tw-w-1/5 md:tw-block">
                      <AboutMenu currentSection={AboutSection.TECH} />
                    </div>
                    <div className="tw-w-full md:tw-w-4/5">
                      <TechReportPage />
                    </div>
                  </div>

                  <div className="tw-mt-6 tw-block tw-text-center md:tw-hidden">
                    <AboutMenu currentSection={AboutSection.TECH} />
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

  if (reportSlug !== TECH_WEEKLY_PR_REPORT.slug) {
    return getAppMetadata({
      title: "Tech",
      description: "About",
    });
  }

  return getAppMetadata({
    title: TECH_WEEKLY_PR_REPORT.title,
    description: TECH_WEEKLY_PR_REPORT.description,
  });
}

export function generateStaticParams() {
  return [{ reportSlug: TECH_WEEKLY_PR_REPORT.slug }];
}
