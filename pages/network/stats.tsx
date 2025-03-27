import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { Container, Row, Col } from "react-bootstrap";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import { useContext, useEffect } from "react";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { AuthContext } from "../../components/auth/Auth";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const CommunityStatsComponent = dynamic(
  () => import("../../components/communityStats/CommunityStats"),
  { ssr: false }
);

export default function CommunityStats() {
  const { setTitle, title } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Stats | Network",
    });
  }, []);

  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Network", href: "/network" },
    { display: "Stats" },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/network/stats`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={`${styles.main} ${styles.tdhMain}`}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
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
    </>
  );
}
