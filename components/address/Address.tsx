import styles from "./Address.module.scss";
import { formatAddress } from "../../helpers/Helpers";
import { useEnsName } from "wagmi";
import { MANIFOLD, SIX529_MUSEUM } from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface Props {
  address: `0x${string}` | undefined;
  ens: string | null;
  hideCopy?: boolean;
  resolveEns?: boolean;
  tags?: {
    memesCardsSets: number;
    memesBalance: number;
    genesis: boolean;
    gradientsBalance: number;
  };
  isUserPage?: boolean;
  disableLink?: boolean;
}

export default function Address(props: Props) {
  let ensResolution: any = null;

  if (props.resolveEns) {
    ensResolution = useEnsName({ address: props.address });
  }

  const [isCopied, setIsCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(props.address!);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }

  function resolveAddress() {
    if (props.ens) {
      return props.ens;
    }
    if (!props.address) {
      return "";
    }

    if (props.address?.toUpperCase() == SIX529_MUSEUM.toUpperCase()) {
      return "6529Museum";
    }
    if (props.address?.toUpperCase() == MANIFOLD.toUpperCase()) {
      return "Manifold Gallery";
    }

    if (ensResolution && ensResolution.data) {
      return ensResolution.data;
    }

    return formatAddress(props.address);
  }

  return (
    <span className={styles.addressWidget}>
      <>
        {
          <span className={styles.address}>
            {props.disableLink && resolveAddress()}
            {!props.disableLink && (
              <a href={`/${props.address}`}>{resolveAddress()}</a>
            )}
          </span>
        }
        <>
          {!props.hideCopy &&
            navigator.clipboard &&
            (isCopied ? (
              <FontAwesomeIcon
                icon="copy"
                className={`${styles.copy} ${styles.copyActive}`}
              />
            ) : (
              <FontAwesomeIcon
                icon="copy"
                className={styles.copy}
                onClick={copy}
              />
            ))}
          {props.isUserPage && <br />}
          {props.tags &&
            (props.tags.memesCardsSets > 0 ? (
              <span className={styles.memesCardsSetsTag}>
                {props.tags.memesCardsSets}x Memes Set
                {props.tags.memesCardsSets > 1 ? `s` : ""}
              </span>
            ) : props.tags.memesBalance > 0 ? (
              <span className={styles.memesTag}>
                {props.tags.memesBalance}x Meme
                {props.tags.memesBalance > 1 ? `s` : ""}
                {props.tags.genesis ? ` (+Genesis)` : ""}
              </span>
            ) : (
              ""
            ))}
          {props.tags && props.tags.gradientsBalance > 0 && (
            <span className={styles.gradientsTag}>
              {props.tags.gradientsBalance}x Gradient
              {props.tags.gradientsBalance > 1 ? `s` : ""}
            </span>
          )}
        </>
      </>
    </span>
  );
}
