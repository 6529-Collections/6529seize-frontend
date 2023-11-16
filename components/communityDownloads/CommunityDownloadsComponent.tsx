import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import styles from "./CommunityDownloads.module.scss";
import Image from "next/image";
import Pagination from "../pagination/Pagination";

const PAGE_SIZE = 25;

interface Props {
  title: string;
  url: string;
}

export default function CommunityDownloadsComponent(props: Props) {
  const router = useRouter();

  const [downloads, setDownloads] = useState<any[]>();
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    let url = `${props.url}?page_size=${PAGE_SIZE}&page=${mypage}`;
    fetchUrl(url).then((response: DBResponse) => {
      setTotalResults(response.count);
      setDownloads(response.data);
    });
  }

  useEffect(() => {
    fetchResults(page);
  }, [page, router.isReady]);

  function isYYYYMMDDFormat(str: string): boolean {
    return /^\d{8}$/.test(str);
  }

  function printDate(dateString: any) {
    if (isYYYYMMDDFormat(dateString)) {
      const d = new Date(
        dateString.substring(0, 4),
        dateString.substring(4, 6) - 1,
        dateString.substring(6, 8)
      );

      return d.toDateString();
    } else {
      const d = new Date(dateString);
      return `${d.toDateString()}`;
    }
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col>
                <h1>{props.title.toUpperCase()} DOWNLOADS</h1>
              </Col>
            </Row>
            {downloads && downloads.length > 0 && (
              <Row className={`pt-3 ${styles.downloadsScrollContainer}`}>
                <Col>
                  <Table bordered={false} className={styles.downloadsTable}>
                    <tbody>
                      {downloads.map((download) => (
                        <tr key={download.created_at}>
                          <td>{printDate(download.date)}</td>
                          <td>
                            <a
                              href={download.url}
                              target="_blank"
                              rel="noreferrer">
                              {download.url}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            )}
            {downloads != undefined && downloads.length === 0 && (
              <>
                <Image
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
  );
}
