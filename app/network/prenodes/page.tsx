import styles from "@/styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import PrenodesStatus from "@/components/prenodes/PrenodesStatus";
import { getAppMetadata } from "@/components/providers/metadata";

export default function PrenodesPage() {
  return (
    <main className={styles.main}>
      <Container fluid className={styles.leaderboardContainer}>
        <Row>
          <Col>
            <PrenodesStatus />
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Prenodes",
    description: "Network",
  });
};
