import styles from "../UserPage.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { areEqualAddresses, numberWithCommas } from "../../../helpers/Helpers";
import { GRADIENT_CONTRACT, MEMES_CONTRACT } from "../../../constants";
import NFTImage from "../../nft-image/NFTImage";
import { IUserNFT } from "./UserPageCollectionNfts";

export default function UserPageCollectionNft({
  nft,
}: {
  readonly nft: IUserNFT;
}) {
  return (
    <Col
      key={`${nft.contract}-${nft.id}`}
      className="pt-3 pb-3"
      xs={{ span: 6 }}
      sm={{ span: 4 }}
      md={{ span: 3 }}
      lg={{ span: 3 }}
    >
      <Container fluid className="no-padding">
        <Row>
          <a
            className={styles.nftImagePadding}
            href={`/${
              areEqualAddresses(nft.contract, MEMES_CONTRACT)
                ? "the-memes"
                : "6529-gradient"
            }/${nft.id}`}
          >
            <NFTImage
              nft={nft}
              animation={false}
              height={300}
              balance={nft.userBalance}
              showOwned={
                !!(
                  areEqualAddresses(nft.contract, GRADIENT_CONTRACT) &&
                  nft.userBalance > 0
                )
              }
              showThumbnail={true}
              showUnseized={true}
            />
          </a>
        </Row>
        <Row>
          <Col className="text-center pt-2">
            <a
              href={`/${
                areEqualAddresses(nft.contract, MEMES_CONTRACT)
                  ? "the-memes"
                  : "6529-gradient"
              }/${nft.id}`}
            >
              {areEqualAddresses(nft.contract, MEMES_CONTRACT)
                ? `#${nft.id} - ${nft.name}`
                : nft.name}
            </a>
          </Col>
        </Row>
        {nft.boostedTDH && nft.nftRank && (
          <Row>
            <Col className="text-center pt-2">
              TDH: {numberWithCommas(Math.round(nft.boostedTDH))} | Rank #
              {nft.nftRank}
            </Col>
          </Row>
        )}
        {!nft.nftTDH && nft.userBalance > 0 && (
          <Row>
            <Col className="text-center pt-2">TDH: 0 | Rank N/A</Col>
          </Row>
        )}
      </Container>
    </Col>
  );
}
