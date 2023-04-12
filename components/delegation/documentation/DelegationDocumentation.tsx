import { useState } from "react";
import styles from "./DelegationDocumentation.module.scss";
import { Container, Row, Col } from "react-bootstrap";

export enum Section {
  REGISTER_DELEGATION = "Register Delegation",
  REVOKE_DELEGATION = "Revoke Delegation",
  REGISTER_CONSOLIDATION = "Register Consolidation",
  REGISTER_CONSOLIDATION_WITH_SUB_DEL = "Register Delegation With Sub-Delegation Rights",
}

export default function DelegationDocumentation() {
  const [activeSection, setActiveSection] = useState<Section>(
    Section.REGISTER_DELEGATION
  );

  function printRegisterDelegation() {
    return (
      <Container>
        <Row>
          <Col>{Section.REGISTER_DELEGATION} Documentation</Col>
        </Row>
      </Container>
    );
  }

  function printRevokeDelegation() {
    return (
      <Container>
        <Row>
          <Col>{Section.REVOKE_DELEGATION} Documentation</Col>
        </Row>
      </Container>
    );
  }

  function printRegisterConsolidation() {
    return (
      <Container>
        <Row>
          <Col>{Section.REGISTER_CONSOLIDATION} Documentation</Col>
        </Row>
      </Container>
    );
  }

  function printRegisterDelegationWithSubDelegation() {
    return (
      <Container>
        <Row>
          <Col>{Section.REGISTER_CONSOLIDATION_WITH_SUB_DEL} Documentation</Col>
        </Row>
      </Container>
    );
  }

  function printSection() {
    switch (activeSection) {
      case Section.REGISTER_DELEGATION:
        return printRegisterDelegation();
      case Section.REVOKE_DELEGATION:
        return printRevokeDelegation();
      case Section.REGISTER_CONSOLIDATION:
        return printRegisterConsolidation();
      case Section.REGISTER_CONSOLIDATION_WITH_SUB_DEL:
        return printRegisterDelegationWithSubDelegation();
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
                  {Object.values(Section).map((section) => (
                    <Row className="pt-1 pb-1" key={`${section}`}>
                      <Col
                        onClick={() => setActiveSection(section)}
                        className={`${styles.menuLeftItem} ${
                          activeSection == section
                            ? styles.menuLeftItemActive
                            : ""
                        }`}>
                        {section}
                      </Col>
                    </Row>
                  ))}
                </Container>
              </Col>
              {activeSection && (
                <Col className={styles.menuRight}>{printSection()}</Col>
              )}
            </Row>
            <Row className="pt-4">
              <Col className={styles.menuLeftFull}>
                <Container>
                  {Object.values(Section).map((section) => (
                    <Row className="pt-1 pb-1" key={`${section}-full`}>
                      <Col
                        onClick={() => setActiveSection(section)}
                        className={`${styles.menuLeftItem} ${
                          activeSection == section
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
