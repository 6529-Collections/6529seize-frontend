import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import { Crumb } from "../breadcrumb/Breadcrumb";
import styles from "./CommunityDownloads.module.scss";
import Image from "next/image";
import Pagination from "../pagination/Pagination";

export default function CommunityDownloadsTeam() {
  const [downloads, setDownloads] = useState<any[]>([
    {
      created_at: "2023-05-10 11:44:03",
      url: "https://arweave.net/lRR1YuRwnThzKVXNIuDCbA-LfyfyZYU6sezNtF9-Dn0",
    },
    {
      created_at: "2023-03-02 10:42:49",
      url: "https://arweave.net/iDa7cvYLdS95XNnISou4h3Zzvt0qu6w7BUXJiGrCyVE",
    },
  ]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function printDate(dateString: any) {
    const d = new Date(dateString);
    const hours = d.getUTCHours();
    const mins = d.getUTCMinutes();
    const timeString = `${hours < 10 ? "0" + hours : hours}:${
      mins < 10 ? "0" + mins : mins
    }`;
    return `${d.toDateString()} - ${timeString}`;
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col>
                <h1>TEAM DOWNLOADS</h1>
              </Col>
            </Row>
            {downloads && downloads.length > 0 && (
              <Row className={`pt-3 ${styles.downloadsScrollContainer}`}>
                <Col>
                  <Table bordered={false} className={styles.downloadsTable}>
                    <tbody>
                      {downloads.map((download) => (
                        <tr key={download.created_at}>
                          <td>{printDate(download.created_at)}</td>
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
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
