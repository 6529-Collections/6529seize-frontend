import { useState } from "react";
import styles from "./DelegationDocumentation.module.scss";
import { Container, Row, Col } from "react-bootstrap";

export enum DocumentationSection {
  REGISTER_DELEGATION = "register-delegation",
  REVOKE_DELEGATION = "revoke-delegation",
  REGISTER_CONSOLIDATION = "register-consolidation",
  REGISTER_CONSOLIDATION_WITH_SUB_DEL = "register-delegation-with-sub-delegation-rights",
  CONSOLIDATE_TDH = "consolidate-tdh",
}

interface Props {
  section: DocumentationSection;
  setActiveSection(section: DocumentationSection): any;
}

export default function DelegationDocumentation(props: Props) {
  function printRegisterDelegation() {
    return (
      <Container>
        <Row>
          <Col>{DocumentationSection.REGISTER_DELEGATION} Documentation</Col>
        </Row>
      </Container>
    );
  }

  function printRevokeDelegation() {
    return (
      <Container>
        <Row>
          <Col>{DocumentationSection.REVOKE_DELEGATION} Documentation</Col>
        </Row>
      </Container>
    );
  }

  function printRegisterConsolidation() {
    return (
      <Container>
        <Row>
          <Col>{DocumentationSection.REGISTER_CONSOLIDATION} Documentation</Col>
        </Row>
      </Container>
    );
  }

  function getSectionTitle(section: DocumentationSection) {
    let title = section
      .replace(/-/g, ",")
      .split(",")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    title = title.replaceAll("Tdh", "TDH");
    return title;
  }

  function printRegisterDelegationWithSubDelegation() {
    return (
      <Container>
        <Row>
          <Col>
            {DocumentationSection.REGISTER_CONSOLIDATION_WITH_SUB_DEL}{" "}
            Documentation
          </Col>
        </Row>
      </Container>
    );
  }

  function printConsolidateTDH() {
    return (
      <Container>
        <Row>
          <Col>
            Explain that it needs to be registered on &apos;The Memes&apos;
            contract etc etc
          </Col>
        </Row>
      </Container>
    );
  }

  function printSection() {
    switch (props.section) {
      case DocumentationSection.REGISTER_DELEGATION:
        return printRegisterDelegation();
      case DocumentationSection.REVOKE_DELEGATION:
        return printRevokeDelegation();
      case DocumentationSection.REGISTER_CONSOLIDATION:
        return printRegisterConsolidation();
      case DocumentationSection.REGISTER_CONSOLIDATION_WITH_SUB_DEL:
        return printRegisterDelegationWithSubDelegation();
      case DocumentationSection.CONSOLIDATE_TDH:
        return printConsolidateTDH();
    }
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
