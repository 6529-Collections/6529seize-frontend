import { useEffect, useState } from "react";
import styles from "./DelegationDocumentation.module.scss";
import { Container, Row, Col } from "react-bootstrap";

export enum DocumentationSection {
  GENERAL = "general",
  ACCESS = "how-to-access",
  REGISTER = "how-to-register",
  REVOKE = "how-to-revoke",
  UPDATE = "how-to-update",
  LOCK = "how-to-lock",
}

const DOCUMENTATION_SECTION_HTML: {
  section: DocumentationSection;
  url: string;
}[] = [
  {
    section: DocumentationSection.GENERAL,
    // url: "/html/NFTDelegation.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/about/NFTDelegation.html",
  },
  {
    section: DocumentationSection.REGISTER,
    // url: "/html/how-to-register.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/how-to-register.html",
  },
];

interface Props {
  section: DocumentationSection;
  setActiveSection(section: DocumentationSection): any;
}

export default function DelegationDocumentation(props: Props) {
  const [sectionHtml, setSectionHtml] = useState<
    { section: DocumentationSection; html: string }[]
  >([]);

  function getSectionTitle(section: DocumentationSection) {
    let title = section
      .replace(/-/g, ",")
      .split(",")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    title = title.replaceAll("Tdh", "TDH");
    return title;
  }

  function printContent(html: string) {
    return (
      <Container>
        <Row>
          <Col
            className={styles.htmlContainer}
            dangerouslySetInnerHTML={{
              __html: html,
            }}></Col>
        </Row>
      </Container>
    );
  }

  function printSection() {
    const html = sectionHtml.find((s) => s.section == props.section);
    if (html) return printContent(html.html);
  }

  useEffect(() => {
    if (props.section && !sectionHtml.some((s) => s.section == props.section))
      fetchSection(props.section);
  }, [props.section]);

  async function fetchSection(mySection: DocumentationSection) {
    let htmlText = "";
    const url = DOCUMENTATION_SECTION_HTML.find((d) => d.section == mySection);
    if (url) {
      const htmlRequest = await fetch(url.url);
      htmlText = htmlRequest.status == 200 ? await htmlRequest.text() : "";
    }
    setSectionHtml((sectionHtml) => [
      ...sectionHtml,
      { section: mySection, html: htmlText },
    ]);
  }

  return (
    <Container>
      <Row>
        <Col>
          <Container className="pt-4 no-padding">
            <Row>
              <Col className={styles.menuLeft}>
                <Container>
                  {Object.values(DocumentationSection).map((section) => (
                    <Row className="pt-1 pb-1" key={`${section}`}>
                      <Col
                        onClick={() => props.setActiveSection(section)}
                        className={`${styles.menuLeftItem} ${
                          props.section == section
                            ? styles.menuLeftItemActive
                            : ""
                        }`}>
                        {getSectionTitle(section)}
                      </Col>
                    </Row>
                  ))}
                </Container>
              </Col>
              {props.section && (
                <Col className={styles.menuRight}>{printSection()}</Col>
              )}
            </Row>
            <Row className="pt-4">
              <Col className={styles.menuLeftFull}>
                <Container>
                  {Object.values(DocumentationSection).map((section) => (
                    <Row className="pt-1 pb-1" key={`${section}-full`}>
                      <Col
                        onClick={() => props.setActiveSection(section)}
                        className={`${styles.menuLeftItem} ${
                          props.section == section
                            ? styles.menuLeftItemActive
                            : ""
                        }`}>
                        {section}
                      </Col>
                    </Row>
                  ))}
                </Container>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
