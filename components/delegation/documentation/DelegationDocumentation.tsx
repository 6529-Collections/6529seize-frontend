import { useEffect, useState } from "react";
import styles from "./DelegationDocumentation.module.scss";
import { Container, Row, Col } from "react-bootstrap";

export enum DocumentationSection {
  GENERAL = "general",
  ACCESS = "access-delegations-center",
  REGISTER_DELEGATION = "register-delegation",
  REGISTER_SUB_DELEGATION = "register-sub-delegation",
  REGISTER_CONSOLIDATION = "register-consolidation",
  LOCK_GLOBAL = "lock_global",
  LOCK_COLLECTION = "lock_collection",
  LOCK_USE_CASE = "lock_use_case",
  UNLOCK_GLOBAL = "unlock_global",
  UNLOCK_COLLECTION = "unlock_collection",
  UNLOCK_USE_CASE = "unlock_use_case",
  SUB_DEL_REGISTER = "register-delegation-using-sub-delegation",
  SUB_DEL_REVOKE = "revoke-delegation-using-sub-delegation",
  MANAGE_UPDATE = "manage-update",
  MANAGE_REVOKE = "manage-revoke",
  VIEW_DELEGATIONS = "view-delegation",
  VIEW_SUB_DELEGATIONS = "view-sub-delegations",
  VIEW_CONSOLIDATIONS = "view-consolidations",
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
    section: DocumentationSection.ACCESS,
    // url: "/html/access.html",
    url: "https:6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/access.html",
  },
  {
    section: DocumentationSection.REGISTER_DELEGATION,
    // url: "/html/register-delegation.html",
    url: "https:6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/register-delegation.html",
  },
  {
    section: DocumentationSection.REGISTER_SUB_DELEGATION,
    // url: "/html/register-sub-delegation.html",
    url: "https:6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/register-sub-delegation.html",
  },
  {
    section: DocumentationSection.REGISTER_CONSOLIDATION,
    // url: "/html/register-consolidation.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/register-consolidation.html",
  },
  {
    section: DocumentationSection.LOCK_GLOBAL,
    // url: "/html/lock-global.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/lock-global.html",
  },
  {
    section: DocumentationSection.LOCK_COLLECTION,
    // url: "/html/lock-collection.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/lock-collection.html",
  },
  {
    section: DocumentationSection.LOCK_USE_CASE,
    // url: "/html/lock-use-case.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/lock-use-case.html",
  },
  {
    section: DocumentationSection.UNLOCK_GLOBAL,
    // url: "/html/unlock-global.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/unlock-global.html",
  },
  {
    section: DocumentationSection.UNLOCK_COLLECTION,
    // url: "/html/unlock-collection.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/unlock-collection.html",
  },
  {
    section: DocumentationSection.UNLOCK_USE_CASE,
    // url: "/html/unlock-use-case.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/unlock-use-case.html",
  },
  {
    section: DocumentationSection.SUB_DEL_REGISTER,
    // url: "/html/sub-del-register.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/sub-del-register.html",
  },
  {
    section: DocumentationSection.SUB_DEL_REVOKE,
    // url: "/html/sub-del-revoke.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/sub-del-revoke.html",
  },
  {
    section: DocumentationSection.MANAGE_UPDATE,
    // url: "/html/manage-update.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/manage-update.html",
  },
  {
    section: DocumentationSection.MANAGE_REVOKE,
    // url: "/html/manage-revoke.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/manage-revoke.html",
  },
  {
    section: DocumentationSection.VIEW_DELEGATIONS,
    // url: "/html/view-delegations.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/view-delegations.html",
  },
  {
    section: DocumentationSection.VIEW_SUB_DELEGATIONS,
    // url: "/html/view-sub-delegations.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/view-sub-delegations.html",
  },
  {
    section: DocumentationSection.VIEW_CONSOLIDATIONS,
    // url: "/html/view-consolidations.html",
    url: "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegations-center-getting-started/html/view-consolidations.html",
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
                  <Row className="pt-1 pb-1">
                    <Col
                      onClick={() =>
                        props.setActiveSection(DocumentationSection.GENERAL)
                      }
                      className={`${styles.menuLeftItem} ${
                        props.section == DocumentationSection.GENERAL
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      General
                    </Col>
                  </Row>
                  <Row className="pt-1 pb-1">
                    <Col
                      onClick={() =>
                        props.setActiveSection(DocumentationSection.ACCESS)
                      }
                      className={`${styles.menuLeftItem} ${
                        props.section == DocumentationSection.ACCESS
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      How to Access Delegations Center
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col xs={12} className="font-color-h">
                      How to Register
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.REGISTER_DELEGATION
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section ==
                        DocumentationSection.REGISTER_DELEGATION
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Delegation
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.REGISTER_SUB_DELEGATION
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section ==
                        DocumentationSection.REGISTER_SUB_DELEGATION
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Sub-Delegation
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.REGISTER_CONSOLIDATION
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section ==
                        DocumentationSection.REGISTER_CONSOLIDATION
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Consolidation
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col xs={12} className="font-color-h">
                      How to Lock Wallet
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(DocumentationSection.LOCK_GLOBAL)
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.LOCK_GLOBAL
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Global
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.LOCK_COLLECTION
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.LOCK_COLLECTION
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Collection
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.LOCK_USE_CASE
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.LOCK_USE_CASE
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Use Case
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col xs={12} className="font-color-h">
                      How to Unlock Wallet
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.UNLOCK_GLOBAL
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.UNLOCK_GLOBAL
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Global
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.UNLOCK_COLLECTION
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.UNLOCK_COLLECTION
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Collection
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.UNLOCK_USE_CASE
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.UNLOCK_USE_CASE
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Use Case
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col xs={12} className="font-color-h">
                      Using Sub-Delegation Rights
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.SUB_DEL_REGISTER
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.SUB_DEL_REGISTER
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Register
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.SUB_DEL_REVOKE
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.SUB_DEL_REVOKE
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Revoke
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col xs={12} className="font-color-h">
                      Manage
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.MANAGE_UPDATE
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.MANAGE_UPDATE
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Update
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.MANAGE_REVOKE
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.MANAGE_REVOKE
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Revoke
                    </Col>
                  </Row>
                  <Row className="pt-2 pb-2">
                    <Col xs={12} className="font-color-h">
                      View
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.VIEW_DELEGATIONS
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section == DocumentationSection.VIEW_DELEGATIONS
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Delegations
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.VIEW_SUB_DELEGATIONS
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section ==
                        DocumentationSection.VIEW_SUB_DELEGATIONS
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Sub-delegations
                    </Col>
                    <Col
                      xs={12}
                      onClick={() =>
                        props.setActiveSection(
                          DocumentationSection.VIEW_CONSOLIDATIONS
                        )
                      }
                      className={`indented ${styles.menuLeftItem} ${
                        props.section ==
                        DocumentationSection.VIEW_CONSOLIDATIONS
                          ? styles.menuLeftItemActive
                          : ""
                      }`}>
                      Consolidations
                    </Col>
                  </Row>
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
