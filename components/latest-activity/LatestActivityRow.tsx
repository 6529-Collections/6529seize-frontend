import Image from "next/image";
import styles from "./LatestActivity.module.scss";
import { Transaction } from "../../entities/ITransaction";
import {
  areEqualAddresses,
  displayDecimal,
  getDateDisplay,
  isGradientsContract,
  isMemeLabContract,
  isMemesContract,
  numberWithCommas,
} from "../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MANIFOLD, NULL_ADDRESS } from "../../constants";
import { NFTLite } from "../../entities/INFT";
import Address from "../address/Address";
import Tippy from "@tippyjs/react";
import { Container, Row, Col } from "react-bootstrap";

interface Props {
  nft?: NFTLite;
  tr: Transaction;
  mykey?: string;
}

const ROYALTIES_PERCENTAGE = 0.069;

export default function LatestActivityRow(props: Props) {
  function printRoyalties() {
    if (
      props.tr.value == 0 ||
      areEqualAddresses(props.tr.from_address, NULL_ADDRESS) ||
      areEqualAddresses(props.tr.from_address, MANIFOLD)
    ) {
      return <></>;
    }
    let emoji;
    const royaltiesPercentage = props.tr.royalties / props.tr.value;
    if (props.tr.royalties > 0) {
      if (royaltiesPercentage >= ROYALTIES_PERCENTAGE) {
        emoji = "&#128512;";
      } else {
        emoji = "&#128578;";
      }
    } else {
      emoji = "&#128577;";
    }
    return (
      <Tippy
        content={
          <Container>
            <Row>
              <Col className="no-wrap">Royalties</Col>
              <Col className="text-right no-wrap">
                {props.tr.royalties > 0
                  ? `${displayDecimal(props.tr.royalties, 5)} (
                ${displayDecimal(royaltiesPercentage * 100, 2)}%)`
                  : "Not paid"}
              </Col>
            </Row>
          </Container>
        }
        placement={"top-end"}
        theme={"light"}
        hideOnClick={false}>
        <span
          className={styles.royalties}
          dangerouslySetInnerHTML={{
            __html: emoji,
          }}></span>
      </Tippy>
    );
  }
  function printInfo() {
    return (
      <span className="d-flex align-items-center gap-3">
        {printRoyalties()}
        <Tippy
          content={
            <Container>
              <Row>
                <Col className="no-wrap">Gas</Col>
                <Col className="text-right">
                  {displayDecimal(props.tr.gas, 5)}
                </Col>
              </Row>
              <Row>
                <Col className="no-wrap">GWEI</Col>
                <Col className="text-right">
                  {numberWithCommas(props.tr.gas_gwei)}
                </Col>
              </Row>
              <Row>
                <Col className="no-wrap">Gas Price</Col>
                <Col className="text-right">
                  {displayDecimal(props.tr.gas_price_gwei, 2)}
                </Col>
              </Row>
            </Container>
          }
          placement={"top-end"}
          theme={"light"}
          hideOnClick={false}>
          <FontAwesomeIcon
            className={styles.gasIcon}
            icon="gas-pump"></FontAwesomeIcon>
        </Tippy>
        <a
          href={`https://etherscan.io/tx/${props.tr.transaction}`}
          className={styles.transactionLink}
          target="_blank"
          rel="noreferrer">
          <FontAwesomeIcon
            className={styles.gasIcon}
            icon="external-link-square"></FontAwesomeIcon>
        </a>
      </span>
    );
  }
  return (
    <tr
      key={`${props.tr.from_address}-${props.tr.to_address}-${props.tr.transaction}-${props.tr.token_id}-latestactivity-row`}
      className={styles.latestActivityRow}>
      <td className="align-middle text-center">
        {getDateDisplay(new Date(props.tr.transaction_date))}
      </td>
      <td className="align-middle text-center">
        <FontAwesomeIcon
          className={
            props.tr.to_address === NULL_ADDRESS
              ? styles.iconRed
              : areEqualAddresses(MANIFOLD, props.tr.from_address) ||
                areEqualAddresses(NULL_ADDRESS, props.tr.from_address)
              ? styles.iconWhite
              : props.tr.value > 0
              ? styles.iconBlue
              : styles.iconGreen
          }
          icon={
            props.tr.to_address === NULL_ADDRESS
              ? `fire`
              : props.tr.value > 0
              ? areEqualAddresses(NULL_ADDRESS, props.tr.from_address) ||
                areEqualAddresses(MANIFOLD, props.tr.from_address)
                ? "cart-plus"
                : "shopping-cart"
              : areEqualAddresses(NULL_ADDRESS, props.tr.from_address)
              ? "parachute-box"
              : "exchange"
          }
        />
      </td>
      <td className="d-flex align-items-center justify-content-between gap-2">
        <span className="d-flex">
          {(areEqualAddresses(MANIFOLD, props.tr.from_address) ||
            areEqualAddresses(NULL_ADDRESS, props.tr.from_address)) && (
            <>
              {props.tr.value > 0 ? (
                <>
                  <Address
                    wallets={[props.tr.to_address]}
                    display={props.tr.to_display}
                  />
                  minted
                </>
              ) : (
                "airdrop"
              )}
              &nbsp;
              {props.tr.token_count}x&nbsp;
              {props.nft ? (
                <a
                  href={
                    isMemesContract(props.tr.contract)
                      ? `/the-memes/${props.nft?.id}`
                      : isGradientsContract(props.tr.contract)
                      ? `/6529-gradient/${props.nft?.id}`
                      : isMemeLabContract(props.tr.contract)
                      ? `/meme-lab/${props.nft?.id}`
                      : ``
                  }
                  target="_blank"
                  rel="noreferrer">
                  <Image
                    width={0}
                    height={0}
                    style={{ height: "40px", width: "auto" }}
                    src={
                      props.nft.thumbnail
                        ? props.nft.thumbnail
                        : props.nft.scaled
                    }
                    alt={props.nft.name}
                    onError={({ currentTarget }) => {
                      currentTarget.src = props.nft!.image;
                    }}
                    className={styles.nftImage}
                  />
                </a>
              ) : isMemesContract(props.tr.contract) ? (
                `Meme #${props.tr.token_id}`
              ) : isGradientsContract(props.tr.contract) ? (
                `Gradient #${props.tr.token_id}`
              ) : isMemeLabContract(props.tr.contract) ? (
                `MemeLab #${props.tr.token_id}`
              ) : (
                `#${props.tr.token_id}`
              )}
              {props.tr.value === 0 && (
                <>
                  &nbsp; to&nbsp;
                  <Address
                    wallets={[props.tr.to_address]}
                    display={props.tr.to_display}
                  />
                </>
              )}
              &nbsp;&nbsp;
              {props.tr.value > 0 &&
                `for ${Math.round(props.tr.value * 100000) / 100000} ETH`}
            </>
          )}
          {areEqualAddresses(NULL_ADDRESS, props.tr.to_address) && (
            <>
              <Address
                wallets={[props.tr.from_address]}
                display={props.tr.from_display}
              />
              {" burnt "}
              {props.tr.token_count}x&nbsp;
              {props.nft ? (
                <a
                  href={
                    isMemesContract(props.tr.contract)
                      ? `/the-memes/${props.nft?.id}`
                      : isGradientsContract(props.tr.contract)
                      ? `/6529-gradient/${props.nft?.id}`
                      : isMemeLabContract(props.tr.contract)
                      ? `/meme-lab/${props.nft?.id}`
                      : ``
                  }
                  target="_blank"
                  rel="noreferrer">
                  <Image
                    title={
                      isMemesContract(props.tr.contract)
                        ? `Meme #${props.tr.token_id}`
                        : isGradientsContract(props.tr.contract)
                        ? `Gradient #${props.tr.token_id}`
                        : isMemeLabContract(props.tr.contract)
                        ? `MemeLab #${props.tr.token_id}`
                        : `#${props.tr.token_id}`
                    }
                    width={0}
                    height={0}
                    style={{ height: "40px", width: "auto" }}
                    src={
                      props.nft.icon
                        ? props.nft.icon
                        : props.nft.thumbnail
                        ? props.nft.thumbnail
                        : props.nft.image
                    }
                    alt={props.nft.name}
                    onError={({ currentTarget }) => {
                      currentTarget.src = props.nft!.image;
                    }}
                    className={styles.nftImage}
                  />
                </a>
              ) : isMemesContract(props.tr.contract) ? (
                `Meme #${props.tr.token_id}`
              ) : isGradientsContract(props.tr.contract) ? (
                `Gradient #${props.tr.token_id}`
              ) : isMemeLabContract(props.tr.contract) ? (
                `MemeLab #${props.tr.token_id}`
              ) : (
                `#${props.tr.token_id}`
              )}
              &nbsp;
            </>
          )}
          {!areEqualAddresses(MANIFOLD, props.tr.from_address) &&
            !areEqualAddresses(NULL_ADDRESS, props.tr.from_address) &&
            !areEqualAddresses(NULL_ADDRESS, props.tr.to_address) && (
              <>
                <Address
                  wallets={[props.tr.to_address]}
                  display={props.tr.to_display}
                />
                &nbsp;
                {props.tr.value > 0 ? "bought" : "received"}&nbsp;
                {props.tr.token_count}x&nbsp;
                {props.nft ? (
                  <a
                    href={
                      isMemesContract(props.tr.contract)
                        ? `/the-memes/${props.nft?.id}`
                        : isGradientsContract(props.tr.contract)
                        ? `/6529-gradient/${props.nft?.id}`
                        : isMemeLabContract(props.tr.contract)
                        ? `/meme-lab/${props.nft?.id}`
                        : ``
                    }
                    target="_blank"
                    rel="noreferrer">
                    <Image
                      title={
                        isMemesContract(props.tr.contract)
                          ? `Meme #${props.tr.token_id}`
                          : isGradientsContract(props.tr.contract)
                          ? `Gradient #${props.tr.token_id}`
                          : isMemeLabContract(props.tr.contract)
                          ? `MemeLab #${props.tr.token_id}`
                          : `#${props.tr.token_id}`
                      }
                      width={0}
                      height={0}
                      style={{ height: "40px", width: "auto" }}
                      src={
                        props.nft.icon
                          ? props.nft.icon
                          : props.nft.thumbnail
                          ? props.nft.thumbnail
                          : props.nft.image
                      }
                      alt={props.nft.name}
                      onError={({ currentTarget }) => {
                        currentTarget.src = props.nft!.image;
                      }}
                      className={styles.nftImage}
                    />
                  </a>
                ) : isMemesContract(props.tr.contract) ? (
                  `Meme #${props.tr.token_id}`
                ) : isGradientsContract(props.tr.contract) ? (
                  `Gradient #${props.tr.token_id}`
                ) : isMemeLabContract(props.tr.contract) ? (
                  `MemeLab #${props.tr.token_id}`
                ) : (
                  `#${props.tr.token_id}`
                )}
                &nbsp; from&nbsp;
                <Address
                  wallets={[props.tr.from_address]}
                  display={props.tr.from_display}
                />
                {props.tr.value > 0 &&
                  ` for ${Math.round(props.tr.value * 100000) / 100000} ETH`}
              </>
            )}
        </span>
        {printInfo()}
      </td>
    </tr>
  );
}
