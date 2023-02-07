import styles from "./Address.module.scss";
import { formatAddress, numberWithCommas } from "../../helpers/Helpers";
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
    memesCardsSetS1: number;
    memesCardsSetS2: number;
    memesBalance: number;
    genesis: number;
    gradientsBalance: number;
    tdh_rank?: number;
    balance_rank?: number;
  };
  expandedTags?: boolean;
  isUserPage?: boolean;
  disableLink?: boolean;
}

const MEMES_SETS_ICON = "";

const UNIQUE_MEMES_ICON = "";

const SZN_1_ICON = "";

const SZN_2_ICON = "";

const GRADIENT_ICON = "";

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
    <>
      <span
        className={
          props.isUserPage
            ? "d-flex justify-content-center align-items-center"
            : ""
        }>
        {(props.hideCopy || !navigator.clipboard) && (
          <span className={styles.address}>
            {props.disableLink && resolveAddress()}
            {!props.disableLink && (
              <a href={`/${props.address}`}>{resolveAddress()}</a>
            )}
          </span>
        )}
        {!props.hideCopy && navigator.clipboard && (
          <>
            {!props.isUserPage && (
              <span
                className={`${styles.address} ${
                  props.isUserPage ? styles.addressUserPage : ""
                }`}>
                <a href={`/${props.address}`}>{resolveAddress()}</a>
              </span>
            )}
            {props.ens ? (
              <Dropdown className={`${styles.copyDropdown}`}>
                <Dropdown.Toggle name={`${props.address}-copy-toggle`}>
                  {props.isUserPage && (
                    <span
                      className={`${styles.address} ${
                        props.isUserPage ? styles.addressUserPage : ""
                      }`}>
                      {resolveAddress()}
                    </span>
                  )}
                  <FontAwesomeIcon
                    icon="copy"
                    name={`${props.address}-copy-btn-main`}
                    className={`${styles.copy} ${
                      isCopied ? styles.copyActive : ""
                    }`}
                  />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {props.ens && (
                    <Dropdown.Item
                      className={styles.copyDropdownItem}
                      name={`${props.ens}-copy-btn`}
                      onClick={() => copy(props.ens)}>
                      {props.ens}
                    </Dropdown.Item>
                  )}
                  <Dropdown.Item
                    className={styles.copyDropdownItem}
                    name={`${props.address}-copy-btn`}
                    onClick={() => copy(props.address)}>
                    {formatAddress(props.address as string)}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                {props.isUserPage && (
                  <span
                    onClick={() => copy(props.address)}
                    className={`${styles.address} ${
                      props.isUserPage ? styles.addressUserPage : ""
                    }`}>
                    {resolveAddress()}
                  </span>
                )}
                <FontAwesomeIcon
                  icon="copy"
                  onClick={() => copy(props.address)}
                  name={`${props.address}-copy-btn`}
                  className={`${styles.copy} ${
                    isCopied ? styles.copyActive : ""
                  }`}
                />
              </>
            )}
          </>
        )}
      </span>
      {props.tags && (
        <span className={styles.noWrap}>
          {(props.tags.tdh_rank || props.tags.balance_rank) && (
            <>
              {props.tags.balance_rank &&
                props.tags.balance_rank > 0 &&
                props.expandedTags && (
                  <span className={`${styles.tag} ${styles.rankTag}`}>
                    Cards Rank #{numberWithCommas(props.tags.balance_rank)}
                  </span>
                )}
              {props.tags.tdh_rank &&
                props.tags.tdh_rank > 0 &&
                props.expandedTags && (
                  <span className={`${styles.tag} ${styles.rankTag}`}>
                    TDH Rank #{numberWithCommas(props.tags.tdh_rank)}
                  </span>
                )}
              <br />
            </>
          )}
          {props.tags.memesCardsSets > 0 ? (
            <span
              className={`${styles.tag} ${
                !MEMES_SETS_ICON ? styles.memesSetTag : ""
              }`}>
              {props.tags.memesCardsSets}x{" "}
              {(props.isUserPage || !MEMES_SETS_ICON) &&
                `Memes Set${props.tags.memesCardsSets > 1 ? "s " : " "}`}
              {MEMES_SETS_ICON && (
                <img
                  src={MEMES_SETS_ICON}
                  className={styles.tagIcon}
                  alt="Memes Sets"
                />
              )}
            </span>
          ) : props.tags.memesBalance > 0 ? (
            <span
              className={`${styles.tag} ${
                !UNIQUE_MEMES_ICON ? styles.memesTag : ""
              }`}>
              {props.tags.memesBalance}x{" "}
              {(props.isUserPage || !UNIQUE_MEMES_ICON) &&
                `Meme${props.tags.memesCardsSets > 1 ? "s " : " "}${
                  props.tags.genesis > 0 ? ` (+Genesis) ` : ""
                }`}
              {UNIQUE_MEMES_ICON && (
                <img
                  src={UNIQUE_MEMES_ICON}
                  className={styles.tagIcon}
                  alt="Unique Memes"
                />
              )}
            </span>
          ) : (
            ""
          )}
          {props.tags.gradientsBalance > 0 && !props.expandedTags ? (
            <span
              className={`${styles.tag} ${
                !GRADIENT_ICON ? styles.gradientTag : ""
              }`}>
              {props.tags.gradientsBalance}x{" "}
              {(props.isUserPage || !GRADIENT_ICON) &&
                `Gradient${props.tags.gradientsBalance > 1 ? "s " : " "}`}
              {GRADIENT_ICON && (
                <img
                  src={GRADIENT_ICON}
                  className={styles.tagIcon}
                  alt="6529 Gradient"
                />
              )}
            </span>
          ) : (
            <>
              {props.tags.memesCardsSetS1 > 0 &&
                (props.tags.memesCardsSets == 0 || props.expandedTags) && (
                  <span
                    className={`${styles.tag} ${
                      !SZN_1_ICON ? styles.memeSzn1Tag : ""
                    }`}>
                    {props.tags.memesCardsSetS1}x{" "}
                    {(props.isUserPage || !SZN_1_ICON) &&
                      `SZN1 Set${props.tags.memesCardsSetS1 > 1 ? "s " : " "}`}
                    {SZN_1_ICON && (
                      <img
                        src={SZN_1_ICON}
                        className={styles.tagIcon}
                        alt="Memes SZN1"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS2 > 0 &&
                (props.tags.memesCardsSets == 0 || props.expandedTags) && (
                  <span
                    className={`${styles.tag} ${
                      !SZN_2_ICON ? styles.memeSzn2Tag : ""
                    }`}>
                    {props.tags.memesCardsSetS2}x{" "}
                    {(props.isUserPage || !SZN_2_ICON) &&
                      `SZN2 Set${props.tags.memesCardsSetS2 > 1 ? "s " : " "}`}
                    {SZN_2_ICON && (
                      <img
                        src={SZN_2_ICON}
                        className={styles.tagIcon}
                        alt="Memes SZN2"
                      />
                    )}
                  </span>
                )}
              {props.tags.gradientsBalance > 0 && props.expandedTags && (
                <span
                  className={`${styles.tag} ${
                    !GRADIENT_ICON ? styles.gradientTag : ""
                  }`}>
                  {props.tags.gradientsBalance}x{" "}
                  {(props.isUserPage || !GRADIENT_ICON) &&
                    `Gradient${props.tags.gradientsBalance > 1 ? "s " : " "}`}
                  {GRADIENT_ICON && (
                    <img
                      src={GRADIENT_ICON}
                      className={styles.tagIcon}
                      alt="6529 Gradient"
                    />
                  )}
                </span>
              )}
            </>
          )}
        </span>
      )}
    </>
  );
}
