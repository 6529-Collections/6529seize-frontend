import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import Image from "next/image";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { useRouter } from "next/router";
import { DBResponse } from "../entities/IDBResponse";
import { fetchUrl } from "../services/6529api";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import Pagination from "../components/pagination/Pagination";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const PAGE_SIZE = 25;

export default function Downloads() {
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Downloads" },
  ]);

  const [downloads, setDownloads] = useState<any[]>();
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(null);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/uploads?page_size=${PAGE_SIZE}&page=${page}`;
    fetchUrl(url).then((response: DBResponse) => {
      setTotalResults(response.count);
      setNext(response.next);
      setDownloads(response.data);
    });
  }, [page, router.isReady]);

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
          content={`${process.env.BASE_ENDPOINT}/downloads`}
        />
        <meta property="og:title" content={`Downloads`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
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
                <Row>
                  <Col>
                    We export our daily calculations of all community metrics to
                    Arweave at 00:30 UTC.
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
                {downloads != undefined && downloads.length == 0 && (
                  <>
                    <Image
                      loading={"lazy"}
                      width="0"
                      height="0"
                      style={{ height: "auto", width: "100px" }}
                      src="/SummerGlasses.svg"
                      alt="SummerGlasses"
                    />{" "}
                    Nothing here yet
                  </>
                )}
                {totalResults > 0 && totalResults / PAGE_SIZE > 1 && (
                  <Row className="text-center pt-2 pb-3">
                    <Pagination
                      page={page}
                      pageSize={PAGE_SIZE}
                      totalResults={totalResults}
                      setPage={function (newPage: number) {
                        setPage(newPage);
                        window.scrollTo(0, 0);
                      }}
                    />
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
