import Head from "next/head";
import styles from "../styles/Home.module.scss";
import Image from "next/image";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
});

export default function ReMemes() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "ReMemes" },
  ]);

  return (
    <>
      <Head>
        <title>ReMemes | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="ReMemes | 6529 SEIZE" />
        <meta property="og:url" content="http://52.50.150.109:3001/rememes" />
        <meta property="og:title" content="BUIDL" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`http://52.50.150.109:3001/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={`${styles.main} text-center`}>
          <Row className="pt-5">
            <Col>
              <Image
                src="/re-memes-w.jpeg"
                width={250}
                height={250}
                alt="ReMemes"
              />
              <Image
                src="/re-memes-b.jpeg"
                width={250}
                height={250}
                alt="ReMemes"
              />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
