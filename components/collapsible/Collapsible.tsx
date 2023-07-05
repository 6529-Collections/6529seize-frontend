import { Container, Row, Col } from "react-bootstrap";
import styles from "./Collapsible.module.scss";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  children: React.ReactNode;
}

export default function Collapsible(props: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Container>
      <Row>
        <Col
          className={`${styles.collapsibleContent} ${
            isOpen ? styles.collapsibleContentShow : ""
          }`}>
          {props.children}
        </Col>
      </Row>
      <Row className={styles.collapsible}>
        <Col onClick={() => setIsOpen(!isOpen)}>
          Show {isOpen ? `Less` : `More`}{" "}
          <FontAwesomeIcon
            icon={isOpen ? `caret-up` : `caret-down`}
            className={styles.caret}></FontAwesomeIcon>
        </Col>
      </Row>
    </Container>
  );
}
