import styles from "@/styles/Home.module.css";

import About from "@/components/about/About";
import {
  getAboutSectionDocumentTitle,
  isAboutFeatureSection,
} from "@/components/about/about.routes";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "@/components/about/AboutLayout";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { AboutSection } from "@/types/enums";
import clsx from "clsx";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ section: string }>;
}

export default async function AboutPage(props: Readonly<Props>) {
  const { section } = await props.params;

  if (!Object.values(AboutSection).includes(section as AboutSection)) {
    if (section === "tos") {
      redirect("/about/terms-of-service");
    }
    notFound();
  }

  const aboutSection = section as AboutSection;
  const usesFeatureLayout = isAboutFeatureSection(aboutSection);

  return (
    <main
      className={clsx(
        styles["main"],
        "tailwind-scope",
        usesFeatureLayout &&
          "tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-900 tw-bg-[#0D0D0F]"
      )}
    >
      <Container fluid className="tw-pt-4">
        <Row>
          <Col>
            <About section={aboutSection} />
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;

  if (section === "tos") {
    return {
      title: "Terms of Service",
      description: "About",
    };
  }

  if (
    section &&
    Object.values(AboutSection).includes(section as AboutSection)
  ) {
    const sectionTitle = getAboutSectionDocumentTitle(
      section as AboutSection,
      DEFAULT_LOCALE
    );

    return getAppMetadata({
      title: t(DEFAULT_LOCALE, "about.contents.documentTitle", {
        section: sectionTitle,
      }),
      description: "About",
    });
  }

  return getAppMetadata({
    title: "About",
    description: "About",
  });
}
