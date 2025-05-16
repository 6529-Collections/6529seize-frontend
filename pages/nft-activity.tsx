import styles from "../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../components/auth/Auth";

const LatestActivity = dynamic(
  () => import("../components/latest-activity/LatestActivity"),
  { ssr: false }
);

export default function TheMemesPage() {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "NFT Activity | Network",
    });
  }, []);

  return (
    <main className={styles.main}>
      <Container fluid className={styles.leaderboardContainer}>
        <Row>
          <Col>
            <LatestActivity page={1} pageSize={50} showMore={true} />
          </Col>
        </Row>
      </Container>
    </main>
  );
}

TheMemesPage.metadata = {
  title: "NFT Activity",
  description: "Network",
};
