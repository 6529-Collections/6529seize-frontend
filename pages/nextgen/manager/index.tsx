import styles from "../../../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { useContext } from "react";
import { AuthContext } from "../../../components/auth/Auth";

const NextGenAdminComponent = dynamic(
  () => import("../../../components/nextGen/admin/NextGenAdmin"),
  {
    ssr: false,
  }
);

export default function NextGenAdmin() {
  const { setTitle } = useContext(AuthContext);
  setTitle({
    title: "NextGen Admin",
  });

  return (
    <main className={styles.main}>
      <Container fluid className={`${styles.main}`}>
        <Row>
          <Col>
            <NextGenAdminComponent />
          </Col>
        </Row>
      </Container>
    </main>
  );
}

NextGenAdmin.metadata = {
  title: "NextGen Admin",
  ogImage: `${process.env.BASE_ENDPOINT}/nextgen.png`,
  description: "NextGen",
};
