import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { AuthContext } from "../../components/auth/Auth";
import { useContext, useEffect } from "react";

const PrenodesStatus = dynamic(
  () => import("../../components/prenodes/PrenodesStatus"),
  { ssr: false }
);

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function PrenodesPage() {
  const { setTitle, title } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Prenodes | Network",
    });
  }, []);

  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Network", href: "/network" },
    { display: "Prenodes" },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/network/prenodes`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={styles.leaderboardContainer}>
          <Row>
            <Col>
              <PrenodesStatus />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
