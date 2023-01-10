import styles from "./Address.module.scss";
import { formatAddress } from "../../helpers/Helpers";
import { useEnsName } from "wagmi";
import { MANIFOLD, SIX529_MUSEUM } from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Dropdown } from "react-bootstrap";

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

  function copy(text: any) {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 300);
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
        <span
          className={
            props.isUserPage
              ? "d-flex justify-content-center align-items-center"
              : ""
          }>
          {
            <span className={styles.address}>
              {props.disableLink && resolveAddress()}
              {!props.disableLink && (
                <a href={`/${props.address}`}>{resolveAddress()}</a>
              )}
            </span>
          }
          {!props.hideCopy &&
            navigator.clipboard &&
            (props.ens ? (
              <span className={`${styles.copyDropdown} dropdown`}>
                <Dropdown.Toggle>
                  <FontAwesomeIcon
                    icon="copy"
                    className={`${styles.copy} ${
                      isCopied ? styles.copyActive : ""
                    }`}
                  />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    className={styles.copyDropdownItem}
                    onClick={() => copy(props.ens)}>
                    {props.ens}
                  </Dropdown.Item>
                  <Dropdown.Item
                    className={styles.copyDropdownItem}
                    onClick={() => copy(props.address)}>
                    {formatAddress(props.address as string)}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </span>
            ) : (
              <FontAwesomeIcon
                icon="copy"
                className={`${styles.copy} ${
                  isCopied ? styles.copyActive : ""
                }`}
                onClick={() => copy(props.address)}
              />
            ))}
        </span>
        {props.isUserPage && props.ens && (
          <>
            <span className={styles.userPageAddress}>
              {formatAddress(props.address as string)}
            </span>
            <br />
          </>
        )}
        {props.tags && (
          <span className={styles.noWrap}>
            {props.tags.memesCardsSets > 0 ? (
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
            )}
            {props.tags.gradientsBalance > 0 && (
              <span className={styles.gradientsTag}>
                {props.tags.gradientsBalance}x Gradient
                {props.tags.gradientsBalance > 1 ? `s` : ""}
              </span>
            )}
          </span>
        )}
      </>
    </span>
  );
}
