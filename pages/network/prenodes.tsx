import styles from "../../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { AuthContext } from "../../components/auth/Auth";
import { useContext, useEffect } from "react";

const PrenodesStatus = dynamic(
  () => import("../../components/prenodes/PrenodesStatus"),
  { ssr: false }
);

export default function PrenodesPage() {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Prenodes | Network",
    });
  }, []);

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
