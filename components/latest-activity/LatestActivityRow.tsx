import Image from "next/image";
import styles from "./LatestActivity.module.scss";
import dynamic from "next/dynamic";
import { Transaction } from "../../entities/ITransaction";
import {
  areEqualAddresses,
  getDateDisplay,
  isGradientsContract,
  isMemesContract,
} from "../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NULL_ADDRESS } from "../../constants";
import { NFT } from "../../entities/INFT";

const Address = dynamic(() => import("../address/Address"), { ssr: false });

interface Props {
  nft?: NFT;
  tr: Transaction;
  mykey?: string;
}

export default function LatestActivityRow(props: Props) {
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
            props.tr.value > 0
              ? styles.iconBlue
              : areEqualAddresses(NULL_ADDRESS, props.tr.from_address)
              ? styles.iconWhite
              : styles.iconGreen
          }
          icon={
            props.tr.value > 0
              ? "shopping-cart"
              : areEqualAddresses(NULL_ADDRESS, props.tr.from_address)
              ? "parachute-box"
              : "exchange"
          }
        />
      </td>
      <td>
        {areEqualAddresses(NULL_ADDRESS, props.tr.from_address) && (
          <>
            airdrop {props.tr.token_count}x{" "}
            {props.nft ? (
              <a
                href={
                  isMemesContract(props.tr.contract)
                    ? `/the-memes/${props.nft?.id}`
                    : isGradientsContract(props.tr.contract)
                    ? `/6529-gradient/${props.nft?.id}`
                    : ``
                }
                target="_blank"
                rel="noreferrer">
                <Image
                  loading={"lazy"}
                  width={0}
                  height={0}
                  style={{ height: "40px", width: "auto" }}
                  src={
                    props.nft.thumbnail ? props.nft.thumbnail : props.nft.scaled
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
            ) : (
              `#${props.tr.token_id}`
            )}{" "}
            to{" "}
            <Address address={props.tr.to_address} ens={props.tr.to_display} />
          </>
        )}
        {!areEqualAddresses(NULL_ADDRESS, props.tr.from_address) && (
          <>
            <Address address={props.tr.to_address} ens={props.tr.to_display} />{" "}
            {props.tr.value > 0 ? "bought" : "received"} {props.tr.token_count}x{" "}
            {props.nft ? (
              <a
                href={
                  isMemesContract(props.tr.contract)
                    ? `/the-memes/${props.nft?.id}`
                    : isGradientsContract(props.tr.contract)
                    ? `/6529-gradient/${props.nft?.id}`
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
                      : `#${props.tr.token_id}`
                  }
                  width={0}
                  height={0}
                  style={{ height: "40px", width: "auto" }}
                  src={
                    props.nft.thumbnail ? props.nft.thumbnail : props.nft.image
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
            ) : (
              `#${props.tr.token_id}`
            )}{" "}
            from{" "}
            <Address
              address={props.tr.from_address}
              ens={props.tr.from_display}
            />
            {props.tr.value > 0 &&
              ` for ${Math.round(props.tr.value * 100000) / 100000} ETH`}
            &nbsp;&nbsp;
            <a
              href={`https://etherscan.io/tx/${props.tr.transaction}`}
              className={styles.transactionLink}
              target="_blank"
              rel="noreferrer">
              view txn
            </a>
          </>
        )}
      </td>
    </tr>
  );
}
