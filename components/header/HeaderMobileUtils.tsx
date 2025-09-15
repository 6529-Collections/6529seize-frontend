import Link from "next/link";
import { Col, Row } from "react-bootstrap";
import styles from "./Header.module.scss";

export function printMobileHr() {
  return (
    <Row>
      <Col xs={{ span: 6, offset: 3 }}>
        <hr />
      </Col>
    </Row>
  );
}

export function printMobileSubheader(name: string) {
  return (
    <Row>
      <Col xs={{ span: 6, offset: 3 }}>
        <h3 className={styles.burgerMenuSubheader}>{name}</h3>
      </Col>
    </Row>
  );
}

export function printMobileRow(name: string, path: string) {
  return (
    <Row className="pt-3 pb-1">
      <Col>
        <Link href={path}>
          <h3>{name}</h3>
        </Link>
      </Col>
    </Row>
  );
}