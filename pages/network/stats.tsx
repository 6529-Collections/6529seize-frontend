import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { Container, Row, Col } from "react-bootstrap";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const CommunityStatsComponent = dynamic(
  () => import("../../components/communityStats/CommunityStats"),
  { ssr: false }
);

export default function CommunityStats() {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Stats | Network",
    });
  }, []);

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
