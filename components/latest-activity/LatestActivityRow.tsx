import Image from "next/image";
import styles from "./LatestActivity.module.scss";
import { Transaction } from "../../entities/ITransaction";
import {
  areEqualAddresses,
  areEqualURLS,
  displayDecimal,
  getDateDisplay,
  isNextgenContract,
  isGradientsContract,
  isMemeLabContract,
  isMemesContract,
  isNullAddress,
  numberWithCommas,
} from "../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MANIFOLD } from "../../constants";
import { NFTLite } from "../../entities/INFT";
import Address from "../address/Address";
import Tippy from "@tippyjs/react";
import { Container, Row, Col } from "react-bootstrap";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextGen/nextgen_contracts";

interface Props {
  nft?: NFTLite;
  tr: Transaction;
  mykey?: string;
  hideNextgenTokenId?: boolean;
}

const ROYALTIES_PERCENTAGE = 0.069;

export default function LatestActivityRow(props: Readonly<Props>) {
  function getNftImageSrc(nft?: NFTLite, src?: string) {
    if (!nft) {
      return "";
    }
    if (!src) {
      return nft.icon;
    }
    if (areEqualURLS(src, nft.icon)) {
      return nft.thumbnail;
    }
    if (areEqualURLS(src, nft.thumbnail)) {
      return nft.scaled;
    }
    if (areEqualURLS(src, nft.scaled)) {
      return nft.image;
    }
    return "";
  }

  function calculateRoyaltiesPercentage() {
    return Math.round((props.tr.royalties / props.tr.value) * 10000) / 10000;
  }

  function getRoyaltyImage(royaltiesPercentage: number) {
    return royaltiesPercentage >= ROYALTIES_PERCENTAGE
      ? "pepe-xglasses.png"
      : "pepe-smile.png";
  }

  function printRoyalties() {
    if (
      props.tr.value == 0 ||
      isNullAddress(props.tr.from_address) ||
      areEqualAddresses(props.tr.from_address, MANIFOLD)
    ) {
      return <></>;
    }
    const royaltiesPercentage = calculateRoyaltiesPercentage();
    if (props.tr.royalties <= 0) return <></>;

    const imgSrc = getRoyaltyImage(royaltiesPercentage);

    return (
      <Tippy
        content={
          <Container>
            <Row>
              <Col className="no-wrap">Royalties</Col>
              <Col className="text-right no-wrap">
                {props.tr.royalties > 0
                  ? `${displayDecimal(props.tr.royalties, 5)} (${displayDecimal(
                      royaltiesPercentage * 100,
                      2
                    )}%)`
                  : "-"}
              </Col>
            </Row>
          </Container>
        }
        placement={"top-end"}
        theme={"light"}
        hideOnClick={false}>
        <Image
          width={0}
          height={0}
          style={{ height: "25px", width: "auto" }}
          src={`/${imgSrc}`}
          alt={imgSrc}
          className="cursor-pointer"
        />
      </Tippy>
    );
  }

  function printGas() {
    return (
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
    );
  }

  function getHref() {
    if (isMemesContract(props.tr.contract)) {
      return `/the-memes/${props.nft?.id}`;
    }
    if (isGradientsContract(props.tr.contract)) {
      return `/6529-gradient/${props.nft?.id}`;
    }
    if (isMemeLabContract(props.tr.contract)) {
      return `/meme-lab/${props.nft?.id}`;
    }
    return `#${props.tr.token_id}`;
  }

  function printNft() {
    if (props.nft) {
      return (
        <a href={getHref()} target="_blank" rel="noreferrer">
          <Image
            width={0}
            height={0}
            style={{ height: "40px", width: "auto" }}
            src={getNftImageSrc(props.nft)}
            alt={props.nft.name}
            onError={({ currentTarget }) => {
              currentTarget.src = getNftImageSrc(props.nft, currentTarget.src);
            }}
            className={styles.nftImage}
          />
        </a>
      );
    } else if (isMemesContract(props.tr.contract)) {
      return `Meme #${props.tr.token_id}`;
    } else if (isGradientsContract(props.tr.contract)) {
      return `Gradient #${props.tr.token_id}`;
    } else if (isMemeLabContract(props.tr.contract)) {
      return `MemeLab #${props.tr.token_id}`;
    } else if (isNextgenContract(props.tr.contract)) {
      return `NextGen #${props.tr.token_id}`;
    } else {
      return `#${props.tr.token_id}`;
    }
  }

  function printDescription() {
    return (
      <span className="d-flex">
        {(areEqualAddresses(MANIFOLD, props.tr.from_address) ||
          isNullAddress(props.tr.from_address)) && (
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
            {printNft()}
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
        {isNullAddress(props.tr.to_address) && (
          <>
            <Address
              wallets={[props.tr.from_address]}
              display={props.tr.from_display}
            />
            {" burnt "}
            {props.tr.token_count}x&nbsp;
            {printNft()}
            &nbsp;
          </>
        )}
        {!areEqualAddresses(MANIFOLD, props.tr.from_address) &&
          !isNullAddress(props.tr.from_address) &&
          !isNullAddress(props.tr.to_address) && (
            <>
              <Address
                wallets={[props.tr.to_address]}
                display={props.tr.to_display}
              />
              &nbsp;
              {props.tr.value > 0 ? "bought" : "received"}&nbsp;
              {props.tr.token_count}x&nbsp;
              {printNft()}
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
    );
  }

  function getDescription() {
    if (isNullAddress(props.tr.from_address)) {
      return (
        <>
          {!props.hideNextgenTokenId
            ? `Nextgen #${props.tr.token_id} minted to`
            : `Minted to`}
          &nbsp;
          <Address
            wallets={[props.tr.to_address]}
            display={props.tr.to_display}
          />
        </>
      );
    }

    if (isNullAddress(props.tr.to_address)) {
      return (
        <>
          Burnt by&nbsp;
          <Address
            wallets={[props.tr.from_address]}
            display={props.tr.from_display}
          />
        </>
      );
    }

    return (
      <>
        {props.tr.value > 0 ? <>Purchased by</> : <>Transferred to</>}&nbsp;
        <Address
          wallets={[props.tr.to_address]}
          display={props.tr.to_display}
        />
        from&nbsp;
        <Address
          wallets={[props.tr.from_address]}
          display={props.tr.from_display}
        />
      </>
    );
  }

  function printDescriptionNextgen() {
    return (
      <span className="d-flex">
        {getDescription()}
        {props.tr.value > 0 &&
          ` for ${Math.round(props.tr.value * 100000) / 100000} ETH`}
      </span>
    );
  }

  function printInfo() {
    return (
      <span className="d-flex align-items-center gap-3">
        {printRoyalties()}
        {printGas()}
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

  function isBurn() {
    return isNullAddress(props.tr.to_address);
  }

  function isMint() {
    return (
      areEqualAddresses(MANIFOLD, props.tr.from_address) ||
      isNullAddress(props.tr.from_address)
    );
  }

  function isAirdrop() {
    return isNullAddress(props.tr.from_address);
  }

  function getIconClass() {
    if (isBurn()) {
      return styles.iconRed;
    }
    if (isMint() || isAirdrop()) {
      return styles.iconWhite;
    }
    if (props.tr.value > 0) {
      return styles.iconBlue;
    }
    return styles.iconGreen;
  }

  function getIcon() {
    if (isBurn()) {
      return "fire";
    }

    if (props.tr.value > 0) {
      return isMint() ? "cart-plus" : "shopping-cart";
    }

    if (isAirdrop()) {
      return "parachute-box";
    }

    return "exchange";
  }

  return (
    <tr
      key={`${props.tr.from_address}-${props.tr.to_address}-${props.tr.transaction}-${props.tr.token_id}-latestactivity-row`}
      className={styles.latestActivityRow}>
      <td className="align-middle text-center">
        {getDateDisplay(new Date(props.tr.transaction_date))}
      </td>
      <td className="align-middle text-center">
        <FontAwesomeIcon className={getIconClass()} icon={getIcon()} />
      </td>
      <td className="d-flex align-items-center justify-content-between gap-2">
        {areEqualAddresses(props.tr.contract, NEXTGEN_CORE[NEXTGEN_CHAIN_ID])
          ? printDescriptionNextgen()
          : printDescription()}
        {printInfo()}
      </td>
    </tr>
  );
}
