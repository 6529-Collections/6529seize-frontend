import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import { Crumb } from "../breadcrumb/Breadcrumb";
import ConsolidationSwitch, {
  VIEW,
} from "../consolidation-switch/ConsolidationSwitch";
import styles from "./CommunityDownloads.module.scss";
import Image from "next/image";
import Pagination from "../pagination/Pagination";

const PAGE_SIZE = 25;

export default function CommunityDownloadsTDH() {
  const router = useRouter();

  const [view, setView] = useState<VIEW>(VIEW.CONSOLIDATION);

  const [downloads, setDownloads] = useState<any[]>();
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(myview: VIEW, mypage: number) {
    let url = `${process.env.API_ENDPOINT}/api/${
      myview == VIEW.WALLET ? "uploads" : "consolidated_uploads"
    }?page_size=${PAGE_SIZE}&page=${mypage}`;
    fetchUrl(url).then((response: DBResponse) => {
      setTotalResults(response.count);
      setDownloads(response.data);
    });
  }

  useEffect(() => {
    fetchResults(view, page);
  }, [page, router.isReady]);

  useEffect(() => {
    if (page == 1) {
      fetchResults(view, page);
    } else {
      setPage(1);
    }
  }, [view]);

  function printDate(dateString: any) {
    const d = new Date(
      dateString.substring(0, 4),
      dateString.substring(4, 6) - 1,
      dateString.substring(6, 8)
    );

    return d.toDateString();
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col xs={12} sm={6}>
                <h1>TDH DOWNLOADS</h1>
              </Col>
              <Col
                className="d-flex align-items-center justify-content-center"
                xs={12}
                sm={6}>
                <ConsolidationSwitch
                  view={view}
                  onSetView={(v) => setView(v)}
                  plural={true}
                />
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
  );
}
