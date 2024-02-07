import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./CommunityDownloads.module.scss";
import Image from "next/image";
import { CommunityDownloadsComponentRow } from "./CommunityDownloadsComponent";

export default function CommunityDownloadsTeam() {
  const downloads = [
    {
      created_at: "2023-05-10 11:44:03",
      url: "https://arweave.net/lRR1YuRwnThzKVXNIuDCbA-LfyfyZYU6sezNtF9-Dn0",
    },
    {
      created_at: "2023-03-02 10:42:49",
      url: "https://arweave.net/iDa7cvYLdS95XNnISou4h3Zzvt0qu6w7BUXJiGrCyVE",
    },
  ];

  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col>
                <h1>Team Downloads</h1>
              </Col>
            </Row>
            {downloads && downloads.length > 0 && (
              <Row className={`pt-3 ${styles.downloadsScrollContainer}`}>
                <Col>
                  <Table bordered={false} className={styles.downloadsTable}>
                    <tbody>
                      {downloads.map((download) => (
                        <CommunityDownloadsComponentRow
                          key={download.created_at}
                          date={download.created_at}
                          url={download.url}
                        />
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
