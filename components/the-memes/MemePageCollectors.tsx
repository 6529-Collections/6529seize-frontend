import NFTLeaderboard from "@/components/leaderboard/NFTLeaderboard";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { numberWithCommas } from "@/helpers/Helpers";
import { Col, Container, Row, Table } from "react-bootstrap";
import { MemeCollectorsStats } from "./MemePageLiveStats";
import styles from "./TheMemes.module.scss";

export function MemePageCollectorsRightMenu(props: {
  show: boolean;
  nft: NFT | undefined;
}) {
  if (props.show && props.nft) {
    return (
      <Col
        xs={{ span: 12 }}
        sm={{ span: 12 }}
        md={{ span: 6 }}
        lg={{ span: 6 }}
        className="pt-2"
      >
        <Container className="p-0">
          <Row>
            <Col>
              <Row className="pt-2">
                <Col>
                  <h3>TDH</h3>
                </Col>
              </Row>
              <Table bordered={false} className={styles["hodlersTable"]}>
                <tbody>
                  <tr>
                    <td>TDH</td>
                    <td>
                      {numberWithCommas(
                        Math.round(props.nft.boosted_tdh * 100) / 100
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Unweighted TDH</td>
                    <td>
                      {numberWithCommas(
                        Math.round(props.nft.tdh__raw * 100) / 100
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Meme Rank</td>
                    <td>
                      {props.nft.tdh_rank ? `#${props.nft.tdh_rank}` : "-"}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Container>
      </Col>
    );
  }

  return <></>;
}

export function MemePageCollectorsSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta: MemesExtendedData | undefined;
}) {
  if (props.show && props.nft) {
    return (
      <>
        {props.nftMeta && (
          <Row className="pt-3">
            <Col>
              <MemeCollectorsStats nftMeta={props.nftMeta} />
            </Col>
          </Row>
        )}
        <Row className="pt-3">
          <Col>
            <NFTLeaderboard
              contract={props.nft.contract}
              nftId={props.nft.id}
            />
          </Col>
        </Row>
      </>
    );
  }

  return <></>;
}
