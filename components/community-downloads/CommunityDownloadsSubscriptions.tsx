import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./CommunityDownloads.module.scss";
import Pagination from "../pagination/Pagination";
import { commonApiFetch } from "../../services/api/common-api";
import { MEMES_CONTRACT } from "../../constants";
import NothingHereYetSummer from "../nothingHereYet/NothingHereYetSummer";

const PAGE_SIZE = 25;

interface SubscriptionDownload {
  date: string;
  contract: string;
  token_id: number;
  upload_url: string;
}

export default function CommunityDownloadsSubscriptions() {
  const router = useRouter();

  const [downloads, setDownloads] = useState<SubscriptionDownload[]>();
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    commonApiFetch<{
      count: number;
      data: SubscriptionDownload[];
    }>({
      endpoint: `subscriptions/uploads?contract=${MEMES_CONTRACT}&page_size=${PAGE_SIZE}&page=${mypage}`,
    }).then(async (response) => {
      setTotalResults(response.count);
      setDownloads(response.data);
    });
  }

  useEffect(() => {
    fetchResults(page);
  }, [page, router.isReady]);

  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col>
                <h1>
                  <span className="font-lightest">Meme</span> Subscriptions
                  Downloads
                </h1>
              </Col>
            </Row>
            {downloads && downloads.length > 0 && (
              <Row className={`pt-3 ${styles.downloadsScrollContainer}`}>
                <Col>
                  <Table bordered={false} className={styles.downloadsTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Token ID</th>
                        <th>URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downloads.map((download) => (
                        <tr key={download.upload_url}>
                          <td>{download.date}</td>
                          <td>{download.token_id.toLocaleString()}</td>
                          <td>
                            <a
                              href={download.upload_url}
                              target="_blank"
                              rel="noreferrer">
                              {download.upload_url}
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
              <NothingHereYetSummer />
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
