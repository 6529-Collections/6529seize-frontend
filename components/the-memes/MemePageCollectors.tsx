import styles from "./TheMemes.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import { NFT } from "../../entities/INFT";
import { numberWithCommas, printMintDate } from "../../helpers/Helpers";
import NFTLeaderboard from "../leaderboard/NFTLeaderboard";

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
              <Table bordered={false} className={styles.hodlersTable}>
                <tbody>
                  <tr>
                    <td>Mint Date</td>
                    <td>{printMintDate(props.nft.mint_date)}</td>
                  </tr>
                  <tr>
                    <td>Mint Price</td>
                    <td>
                      {props.nft.mint_price > 0
                        ? `${numberWithCommas(
                            Math.round(props.nft.mint_price * 100000) / 100000
                          )} ETH`
                        : `N/A`}
                    </td>
                  </tr>
                  <tr>
                    <td>TDH Rate</td>
                    <td>
                      {numberWithCommas(
                        Math.round(props.nft.hodl_rate * 100) / 100
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Floor Price</td>
                    <td>
                      {props.nft.floor_price > 0
                        ? `${numberWithCommas(
                            Math.round(props.nft.floor_price * 100) / 100
                          )} ETH`
                        : `N/A`}
                    </td>
                  </tr>
                  <tr>
                    <td>Market Cap</td>
                    <td>
                      {props.nft.market_cap > 0
                        ? `${numberWithCommas(
                            Math.round(props.nft.market_cap * 100) / 100
                          )} ETH`
                        : `N/A`}
                    </td>
                  </tr>
                </tbody>
              </Table>
              <Row className="pt-2">
                <Col>
                  <h3>TDH</h3>
                </Col>
              </Row>
              <Table bordered={false} className={styles.hodlersTable}>
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
