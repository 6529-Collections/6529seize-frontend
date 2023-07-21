import styles from "./Breadcrumb.module.scss";
import { Container, Row, Col, Nav, Navbar, NavDropdown } from "react-bootstrap";

export interface Crumb {
  display: string;
  href?: string;
}

interface Props {
  breadcrumbs: Crumb[];
}

export default function Breadcrumb(props: Props) {
  return (
    <Container fluid className={styles.breadcrumb}>
      <Row className={styles.headerRow}>
        <Col>
          <Container>
            <Row>
              <Col className={`${styles.headerLeft}`}>
                {props.breadcrumbs.map((crumb, index) => {
                  const crumbAnchor = crumb.href ? (
                    <a
                      key={`${index}-${crumb.display}`}
                      className={styles.breadcrumbLink}
                      href={crumb.href}
                      dangerouslySetInnerHTML={{ __html: crumb.display }}></a>
                  ) : (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: crumb.display,
                      }}></span>
                  );
                  if (index > 0) {
                    return (
                      <span key={`${index}-${crumb.display}-span`}>
                        {" "}
                        | {crumbAnchor}
                      </span>
                    );
                  }
                  return crumbAnchor;
                })}
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
