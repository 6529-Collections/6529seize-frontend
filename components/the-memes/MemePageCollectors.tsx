import NFTLeaderboard from "@/components/leaderboard/NFTLeaderboard";
import { NftPageStats } from "@/components/nft-attributes/NftStats";
import type { NFT } from "@/entities/INFT";
import { numberWithCommas, printMintDate } from "@/helpers/Helpers";
import { Col, Container, Row, Table } from "react-bootstrap";
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
        className="pt-2">
        <Container className="p-0">
          <Row>
            <Col>
              <h3>NFT</h3>
            </Col>
          </Row>
          <Row>
            <Col>
              <Table bordered={false} className={styles["hodlersTable"]}>
                <tbody>
                  <tr>
                    <td>Mint Date</td>
                    <td>{printMintDate(props.nft.mint_date)}</td>
                  </tr>
                  <NftPageStats nft={props.nft} />
                </tbody>
              </Table>
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
  } else {
    return <></>;
  }
}

export function MemePageCollectorsSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
}) {
  if (props.show && props.nft) {
    return (
      <Row className="pt-3">
        <Col>
          <NFTLeaderboard contract={props.nft.contract} nftId={props.nft.id} />
        </Col>
      </Row>
    );
  } else {
    return <></>;
  }
}
