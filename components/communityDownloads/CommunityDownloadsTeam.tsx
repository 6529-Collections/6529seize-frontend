import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./CommunityDownloads.module.scss";
import { CommunityDownloadsComponentRow } from "./CommunityDownloadsComponent";
import NothingHereYetSummer from "../nothingHereYet/NothingHereYetSummer";

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
    {
      created_at: "2024-04-11 16:02:56",
      url: "https://arweave.net/Q1asRH7r36XAbAghCL_PbI0eZufThkMMnhYiD55KYc4",
    },
  ];

  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col>
                <h1>
                  <span className="font-lightest">Team</span> Downloads
                </h1>
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
              <NothingHereYetSummer />
            )}
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
