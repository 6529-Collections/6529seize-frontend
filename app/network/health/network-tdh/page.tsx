import { Col, Container, Row } from "react-bootstrap";

import CommunityStatsComponent from "@/components/communityStats/CommunityStats";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";

export default function CommunityStatsPage() {
  return (
    <main className={styles["main"]}>
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

export const generateMetadata = () => {
  return getAppMetadata({
    title: "Stats",
    description: "Network",
  });
};
