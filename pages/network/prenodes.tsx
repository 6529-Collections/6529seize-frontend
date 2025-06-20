import styles from "../../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { useSetTitle } from "../../contexts/TitleContext";

const PrenodesStatus = dynamic(
  () => import("../../components/prenodes/PrenodesStatus"),
  { ssr: false }
);

export default function PrenodesPage() {
  useSetTitle("Prenodes | Network");

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

PrenodesPage.metadata = {
  title: "Prenodes",
  description: "Network",
};
