import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { Container, Row, Col } from "react-bootstrap";
import { useSetTitle } from "../../contexts/TitleContext";

const CommunityStatsComponent = dynamic(
  () => import("../../components/communityStats/CommunityStats"),
  { ssr: false }
);

export default function CommunityStats() {
  useSetTitle("Stats | Network");

  return (
    <main className={`${styles.main} ${styles.tdhMain}`}>
      <Container fluid>
        <Row>
          <Col>
            <Container className="no-padding">
              <Row>
                <Col>
                  <CommunityStatsComponent />
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </main>
  );
}

CommunityStats.metadata = {
  title: "Stats",
  description: "Network",
};
