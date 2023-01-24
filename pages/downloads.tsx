import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { useRouter } from "next/router";
import { DBResponse } from "../entities/IDBResponse";
import Download from "../components/download/Download";
import { fetchUrl } from "../services/6529api";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
});

export default function Downloads() {
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Downloads" },
  ]);

  const [downloads, setDownloads] = useState<any[]>();

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/uploads?page_size=${50}`).then(
      (response: DBResponse) => {
        if (response.data.length > 0) {
          setDownloads(response.data);
        }
      }
    );
  }, [router.isReady]);

  function printDate(dateString: any) {
    const d = new Date(
      dateString.substring(0, 4),
      dateString.substring(4, 6) - 1,
      dateString.substring(6, 8)
    );

    return d.toDateString();
  }

  return (
    <>
      <Head>
        <title>Downloads | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Downloads | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`http://52.50.150.109:3001/downloads`}
        />
        <meta property="og:title" content={`Downloads`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`http://52.50.150.109:3001/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={styles.mainContainer}>
          <Row>
            <Col>
              <Container className="pt-4">
                <Row>
                  <Col>
                    <h1>DOWNLOADS</h1>
                  </Col>
                </Row>
                {downloads && downloads.length > 0 && (
                  <Row className={`pt-3 ${styles.downloadsScrollContainer}`}>
                    <Col>
                      <Table bordered={false} className={styles.downloadsTable}>
                        <tbody>
                          {downloads.map((download) => (
                            <tr key={download.date}>
                              <td>{printDate(download.date)}</td>
                              <td>
                                <a
                                  href={download.tdh}
                                  target="_blank"
                                  rel="noreferrer">
                                  {download.tdh}
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                )}
              </Container>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
