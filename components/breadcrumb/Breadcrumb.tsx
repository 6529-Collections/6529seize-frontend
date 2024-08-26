import Link from "next/link";
import { getRandomObjectId } from "../../helpers/AllowlistToolHelpers";
import styles from "./Breadcrumb.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import useCapacitor from "../../hooks/useCapacitor";

export interface Crumb {
  display: string;
  href?: string;
}

interface Props {
  breadcrumbs: Crumb[];
}

export default function Breadcrumb(props: Readonly<Props>) {
  const capacitor = useCapacitor();

  return (
    <>
      <Container
        fluid
        className={
          capacitor.isCapacitor ? styles.capacitorBreadcrumb : styles.breadcrumb
        }>
        <Row className={styles.headerRow}>
          <Col>
            <Container>
              <Row>
                <Col className={`${styles.ellipsis}`}>
                  {props.breadcrumbs.map((crumb, index) => {
                    const crumbAnchor = crumb.href ? (
                      <Link
                        key={getRandomObjectId()}
                        className={styles.breadcrumbLink}
                        href={crumb.href}>
                        {crumb.display}
                      </Link>
                    ) : (
                      <span>{crumb.display}</span>
                    );
                    if (index > 0) {
                      return (
                        <span key={getRandomObjectId()}> | {crumbAnchor}</span>
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
      {capacitor.isCapacitor && (
        <div className={styles.capacitorPlaceholder}></div>
      )}
    </>
  );
}
