import styles from "@/styles/Home.module.scss";
import { Col, Container, Row } from "react-bootstrap";

import About from "@/components/about/About";
import { getAppMetadata } from "@/components/providers/metadata";
import { capitalizeEveryWord } from "@/helpers/Helpers";
import { AboutSection } from "@/types/enums";
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

  return (
    <main className={styles["main"]}>
      <Container fluid className="pt-4">
        <Row>
          <Col>
            <About section={section as AboutSection} />
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
    const sectionTitle = capitalizeEveryWord(section.replaceAll("-", " "));

    return getAppMetadata({
      title: sectionTitle,
      description: "About",
    });
  }

  return getAppMetadata({
    title: "About",
    description: "About",
  });
}
