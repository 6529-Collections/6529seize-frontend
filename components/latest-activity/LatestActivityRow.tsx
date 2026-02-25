import {
  faCartPlus,
  faExchange,
  faExternalLinkSquare,
  faFire,
  faGasPump,
  faParachuteBox,
  faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { Tooltip } from "react-tooltip";

import { MANIFOLD } from "@/constants/constants";
import type { NextGenCollection } from "@/entities/INextgen";
import type { NFTLite } from "@/entities/INFT";
import type { Transaction } from "@/entities/ITransaction";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import {
  areEqualAddresses,
  areEqualURLS,
  displayDecimal,
  getDateDisplay,
  getRoyaltyImage,
  isGradientsContract,
  isMemeLabContract,
  isMemesContract,
  isNextgenContract,
  isNullAddress,
  numberWithCommas,
} from "@/helpers/Helpers";

import Address from "../address/Address";
import {
  getNextGenIconUrl,
  getNextGenImageUrl,
} from "../nextGen/collections/nextgenToken/NextGenTokenImage";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextGen/nextgen_contracts";
import { normalizeNextgenTokenID } from "../nextGen/nextgen_helpers";

import styles from "./LatestActivity.module.scss";

function calculateRoyaltiesPercentage(value: number, royalties: number) {
  return Math.round((royalties / value) * 10000) / 10000;
}

export function printRoyalties(value: number, royalties: number, from: string) {
  if (value == 0 || isNullAddress(from) || areEqualAddresses(from, MANIFOLD)) {
    return <></>;
  }
  const royaltiesPercentage = calculateRoyaltiesPercentage(value, royalties);
  if (royalties <= 0) return <></>;

  const imgSrc = getRoyaltyImage(royaltiesPercentage);
  const id = getRandomObjectId();

  return (
    <>
      <Image
        unoptimized
        data-tooltip-id={id}
        width={0}
        height={0}
        style={{ height: "25px", width: "auto" }}
        src={`/${imgSrc}`}
        alt={imgSrc}
        className="cursor-pointer"
      />
      <Tooltip
        id={id}
        delayShow={150}
        place="top-end"
        opacity={1}
        variant="light"
        className="tw-leading-tight"
      >
        <div className="tw-flex tw-gap-3">
          <span>Royalties</span>
          <span>
            {royalties > 0
              ? `${displayDecimal(royalties)} (${displayDecimal(
                  royaltiesPercentage * 100
                )}%)`
              : "-"}
          </span>
        </div>
      </Tooltip>
    </>
  );
}

export function printGas(
  gas: number,
  gas_gwei: number,
  gas_price_gwei: number
) {
  const id = getRandomObjectId();
  return (
    <>
      <FontAwesomeIcon
        data-tooltip-id={id}
        className={styles["gasIcon"]}
        icon={faGasPump}
      ></FontAwesomeIcon>
      <Tooltip
        id={id}
        delayShow={150}
        place="top-end"
        opacity={1}
        variant="light"
        className="tw-leading-tight"
      >
        <div className="tw-flex tw-flex-col tw-gap-1">
          {[
            ["Gas", `${displayDecimal(gas)}`],
            ["GWEI", numberWithCommas(gas_gwei)],
            ["Gas Price", `${displayDecimal(gas_price_gwei)}`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="tw-flex tw-w-full tw-justify-between tw-gap-4"
            >
              <span className="tw-w-1/2 tw-text-left">{label}</span>
              <span className="tw-w-1/2 tw-text-right">{value}</span>
            </div>
          ))}
        </div>
      </Tooltip>
    </>
  );
}

interface Props {
  nft?: NFTLite | undefined;
  nextgen_collection?: NextGenCollection | undefined;
  tr: Transaction;
  hideNextgenTokenId?: boolean | undefined;
}

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
        <a href={getHref()} target="_blank" rel="noopener noreferrer">
          <Image
            unoptimized
            width={0}
            height={0}
            style={{ height: "40px", width: "auto" }}
            src={getNftImageSrc(props.nft)}
            alt={props.nft.name}
            onError={({ currentTarget }) => {
              currentTarget.src = getNftImageSrc(props.nft, currentTarget.src);
            }}
            className={styles["nftImage"]}
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
                seized
              </>
            ) : (
              "Airdrop"
            )}
            &nbsp;
            {props.tr.token_count}x&nbsp;
            {printNft()}
            {props.tr.value === 0 && (
              <>
                &nbsp;to&nbsp;
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
              &nbsp;from&nbsp;
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
    const normalized = normalizeNextgenTokenID(props.tr.token_id);
    const collectionName = props.nextgen_collection?.name ?? (
      <>NextGen #{normalized.collection_id}</>
    );
    const tokenInfo = (
      <a
        href={`/nextgen/token/${props.tr.token_id}/provenance`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {collectionName} #{normalized.token_id}
        <Image
          unoptimized
          width={0}
          height={0}
          style={{
            height: "40px",
            width: "auto",
            marginLeft: "8px",
            marginRight: "8px",
          }}
          src={getNextGenIconUrl(props.tr.token_id)}
          alt={`#${props.tr.token_id.toString()}`}
          className={styles["nftImage"]}
          onError={({ currentTarget }) => {
            if (currentTarget.src === getNextGenIconUrl(props.tr.token_id)) {
              currentTarget.src = getNextGenImageUrl(props.tr.token_id);
            }
          }}
        />
      </a>
    );

    if (isNullAddress(props.tr.from_address)) {
      return (
        <>
          {!props.hideNextgenTokenId ? <>{tokenInfo} seized by</> : `Seized by`}
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
          {!props.hideNextgenTokenId ? <>{tokenInfo} burnt by</> : `Burnt by`}
          <Address
            wallets={[props.tr.from_address]}
            display={props.tr.from_display}
          />
        </>
      );
    }

    return (
      <>
        {props.tr.value > 0 ? (
          <>
            {!props.hideNextgenTokenId ? (
              <>{tokenInfo} purchased by</>
            ) : (
              `Purchased by`
            )}
          </>
        ) : (
          <>
            {!props.hideNextgenTokenId ? (
              <>{tokenInfo} transferred to</>
            ) : (
              `Transferred to`
            )}
          </>
        )}
        &nbsp;
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
        {printRoyalties(
          props.tr.value,
          props.tr.royalties,
          props.tr.from_address
        )}
        {printGas(props.tr.gas, props.tr.gas_gwei, props.tr.gas_price_gwei)}
        <Link
          href={`https://etherscan.io/tx/${props.tr.transaction}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-flex"
        >
          <FontAwesomeIcon
            className={styles["gasIcon"]}
            icon={faExternalLinkSquare}
          ></FontAwesomeIcon>
        </Link>
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
      return styles["iconRed"];
    }
    if (isMint() || isAirdrop()) {
      return styles["iconWhite"];
    }
    if (props.tr.value > 0) {
      return styles["iconBlue"];
    }
    return styles["iconGreen"];
  }

  function getIcon() {
    if (isBurn()) {
      return faFire;
    }

    if (props.tr.value > 0) {
      return isMint() ? faCartPlus : faShoppingCart;
    }

    if (isAirdrop()) {
      return faParachuteBox;
    }

    return faExchange;
  }

  if (!props.tr.token_count) {
    return <></>;
  }

  return (
    <tr
      key={`${props.tr.from_address}-${props.tr.to_address}-${props.tr.transaction}-${props.tr.token_id}-latestactivity-row`}
      className={styles["latestActivityRow"]}
    >
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
