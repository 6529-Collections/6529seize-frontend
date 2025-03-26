import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import Breadcrumb from "../../../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { useContext } from "react";
import { AuthContext } from "../../../components/auth/Auth";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NextGenAdminComponent = dynamic(
  () => import("../../../components/nextGen/admin/NextGenAdmin"),
  {
    ssr: false,
  }
);

export default function NextGenAdmin() {
  const { setTitle, title } = useContext(AuthContext);
  const breadcrumbs = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    { display: "Admin" },
  ];
  setTitle({
    title: "NextGen Admin | 6529.io",
  });

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="NextGen Admin | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nextgen/admin`}
        />
        <meta property="og:title" content="NextGen Admin" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/nextgen.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={`${styles.main}`}>
          <Row>
            <Col>
              <NextGenAdminComponent />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
