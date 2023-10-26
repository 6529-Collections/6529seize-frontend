import styles from "./Address.module.scss";
import {
  areEqualAddresses,
  containsEmojis,
  formatAddress,
  numberWithCommas,
  parseEmojis,
} from "../../helpers/Helpers";
import { MANIFOLD, SIX529_MUSEUM } from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import Tippy from "@tippyjs/react";
import Image from "next/image";
import { IProfileConsolidation } from "../../entities/IProfile";

interface Props {
  wallets: `0x${string}`[];
  consolidatedWallets?: IProfileConsolidation[];
  display: string | undefined;
  displayEns?: string | undefined;
  hideCopy?: boolean;
  tags?: {
    memesCardsSets: number;
    memesCardsSetS1: number;
    memesCardsSetS2: number;
    memesCardsSetS3: number;
    memesCardsSetS4: number;
    memesCardsSetS5: number;
    memesBalance: number;
    genesis: number;
    gradientsBalance: number;
    tdh_rank?: number;
    balance_rank?: number;
    unique_rank?: number;
  };
  isUserPage?: boolean;
  disableLink?: boolean;
  viewingWallet?: `0x${string}`;
  expandedTags?: boolean;
}

export const MEMES_SETS_ICON = "";

export const UNIQUE_MEMES_ICON = "";

export const SZN_1_ICON = "";

export const SZN_2_ICON = "";

export const SZN_3_ICON = "";

export const SZN_4_ICON = "";

export const SZN_5_ICON = "";

export const GRADIENT_ICON = "";

export function WalletAddress(props: {
  wallet: string;
  display: string | undefined;
  displayEns?: string | undefined;
  isUserPage?: boolean;
  disableLink?: boolean;
  hideCopy?: boolean;
}) {
  const [isCopied, setIsCopied] = useState(false);

  function resolveAddress() {
    if (props.wallet.toUpperCase() === SIX529_MUSEUM.toUpperCase()) {
      return "6529Museum";
    }
    if (props.wallet.toUpperCase() === MANIFOLD.toUpperCase()) {
      return "Manifold Minting Wallet";
    }

    if (props.displayEns) {
      if (containsEmojis(props.displayEns)) {
        return parseEmojis(props.displayEns);
      }
      return formatAddress(props.displayEns);
    }

    if (props.display) {
      if (containsEmojis(props.display)) {
        return parseEmojis(props.display);
      }
      return formatAddress(props.display);
    }

    return formatAddress(props.wallet);
  }

  function getLink() {
    let path = "";
    if (props.display && !containsEmojis(props.display)) {
      path = props.display;
    } else {
      path = props.wallet;
    }
    return `/${encodeURIComponent(path)}`;
  }

  function copy(text: any) {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }

  function getInnerHTML() {
    if (props.disableLink) {
      return resolveAddress();
    }

    return `<a href="${getLink()}">${resolveAddress()}</a>`;
  }

  const [walletEns] = useState(
    props.display?.endsWith(".eth") ? props.display : props.displayEns
  );

  return (
    <span>
      {(props.hideCopy || !navigator.clipboard) && (
        <span
          className={styles.address}
          dangerouslySetInnerHTML={{
            __html: getInnerHTML(),
          }}
        ></span>
      )}
      {!props.hideCopy && navigator.clipboard && (
        <>
          {!props.isUserPage && (
            <span
              className={`${styles.address} ${
                props.isUserPage ? styles.addressUserPage : ""
              }`}
            >
              <span
                className={styles.address}
                dangerouslySetInnerHTML={{
                  __html: getInnerHTML(),
                }}
              ></span>
            </span>
          )}
          {walletEns ? (
            <Dropdown className={`${styles.copyDropdown}`} autoClose="outside">
              <Tippy
                content={isCopied ? "Copied" : "Copy"}
                placement={"right"}
                theme={"light"}
                hideOnClick={false}
              >
                <Dropdown.Toggle
                  name={`copy-toggle`}
                  aria-label={`copy-toggle`}
                >
                  {props.isUserPage && (
                    <span
                      className={`${styles.address} ${
                        props.isUserPage ? styles.addressUserPage : ""
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: resolveAddress(),
                      }}
                    ></span>
                  )}
                  <FontAwesomeIcon
                    icon="copy"
                    name={`copy-btn`}
                    aria-label={`copy-btn`}
                    className={`${styles.copy}`}
                  />
                </Dropdown.Toggle>
              </Tippy>
              <Dropdown.Menu>
                {props.display && (
                  <Tippy
                    content={isCopied ? "Copied" : "Copy"}
                    placement={"right"}
                    theme={"light"}
                    hideOnClick={false}
                  >
                    <Dropdown.Item
                      name={`copy-ens-btn`}
                      aria-label={`copy-ens-btn`}
                      onClick={() => copy(props.display)}
                      dangerouslySetInnerHTML={{
                        __html: resolveAddress(),
                      }}
                    ></Dropdown.Item>
                  </Tippy>
                )}
                <Tippy
                  content={isCopied ? "Copied" : "Copy"}
                  placement={"right"}
                  theme={"light"}
                  hideOnClick={false}
                >
                  <Dropdown.Item
                    className={styles.copyDropdownItem}
                    name={`copy-address-btn`}
                    aria-label={`copy-address-btn`}
                    onClick={() => copy(props.wallet)}
                  >
                    {formatAddress(props.wallet as string)}
                  </Dropdown.Item>
                </Tippy>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <>
              <Dropdown
                className={`${styles.copyDropdown}`}
                autoClose="outside"
              >
                <Tippy
                  content={isCopied ? "Copied" : "Copy"}
                  placement={"right"}
                  theme={"light"}
                  hideOnClick={false}
                >
                  <Dropdown.Toggle
                    name={`copy-toggle`}
                    aria-label={`copy-toggle`}
                    onClick={() => copy(props.wallet)}
                  >
                    {props.isUserPage && (
                      <span
                        className={`${styles.address} ${
                          props.isUserPage ? styles.addressUserPage : ""
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: resolveAddress(),
                        }}
                      ></span>
                    )}
                    <FontAwesomeIcon
                      icon="copy"
                      name={`copy-btn`}
                      aria-label={`copy-btn`}
                      className={`${styles.copy}`}
                    />
                  </Dropdown.Toggle>
                </Tippy>
              </Dropdown>
            </>
          )}
        </>
      )}
    </span>
  );
}

export default function Address(props: Props) {
  const [consolidationExpanded, setConsolidationExpanded] = useState(
    props.isUserPage ? true : false
  );

  return (
    <>
      {props.wallets.length === 1 ? (
        <WalletAddress
          wallet={props.wallets[0]}
          display={props.display}
          displayEns={props.displayEns}
          hideCopy={props.hideCopy}
          disableLink={props.disableLink}
          isUserPage={props.isUserPage}
        />
      ) : (
        <Dropdown
          className={`${styles.consolidationDropdown}`}
          autoClose="outside"
        >
          <Dropdown.Toggle
            onClick={() => {
              if (!props.isUserPage) {
                setConsolidationExpanded(!consolidationExpanded);
              }
            }}
            name={`consolidation-toggle`}
            aria-label={`consolidation-toggle`}
          >
            <Image
              loading="eager"
              priority
              src="/consolidation-icon.png"
              alt="consolidation"
              width={25}
              height={25}
            />
            &nbsp;&nbsp;
            <span
              className={`${styles.consolidationDisplay} ${
                props.isUserPage ? styles.consolidationDisplayUserPage : ""
              }`}
              dangerouslySetInnerHTML={{
                __html: props.display ? parseEmojis(props.display) : ``,
              }}
            ></span>
          </Dropdown.Toggle>
        </Dropdown>
      )}
      <span
        className={
          props.isUserPage
            ? `d-flex flex-wrap align-items-center gap-2`
            : `d-flex flex-column`
        }
      >
        {(consolidationExpanded || props.isUserPage) &&
          props.wallets.length > 1 &&
          props.wallets.map((w, index) => (
            <div
              key={w}
              className={`d-flex align-items-center justify-content-start ${
                props.isUserPage ? styles.consolidationDiv : ""
              }`}
            >
              <FontAwesomeIcon
                icon="arrow-turn-right"
                name={`arrow-turn-right`}
                aria-label={`arrow-turn-right`}
                className={`${styles.arrowTurnRight}`}
              />
              <WalletAddress
                wallet={w}
                display={
                  props.consolidatedWallets?.find(
                    (c) => c.wallet.address.toLowerCase() === w.toLowerCase()
                  )?.wallet.ens ?? w
                }
                hideCopy={props.hideCopy}
                disableLink={areEqualAddresses(w, props.viewingWallet)}
              />
            </div>
          ))}
      </span>
      {props.tags && (
        <span className={styles.noWrap}>
          {(props.tags.tdh_rank || props.tags.balance_rank) && (
            <>
              {props.tags.balance_rank &&
                props.tags.balance_rank > 0 &&
                props.expandedTags && (
                  <span className={`${styles.addressTag} ${styles.rankTag}`}>
                    All Cards Rank #{numberWithCommas(props.tags.balance_rank)}
                  </span>
                )}
              {props.tags.unique_rank &&
                props.tags.unique_rank > 0 &&
                props.expandedTags && (
                  <span className={`${styles.addressTag} ${styles.rankTag}`}>
                    Unique Cards Rank #
                    {numberWithCommas(props.tags.unique_rank)}
                  </span>
                )}
              {props.tags.tdh_rank &&
                props.tags.tdh_rank > 0 &&
                props.expandedTags && (
                  <span className={`${styles.addressTag} ${styles.rankTag}`}>
                    TDH Rank #{numberWithCommas(props.tags.tdh_rank)}
                  </span>
                )}
              <br />
            </>
          )}
          {props.tags.memesCardsSets > 0 ? (
            <span
              className={`${styles.addressTag} ${
                !MEMES_SETS_ICON ? styles.memesSetTag : ""
              }`}
            >
              {(props.isUserPage || !MEMES_SETS_ICON) && `Memes Sets x`}
              {props.tags.memesCardsSets}
              {MEMES_SETS_ICON && (
                <img
                  src={MEMES_SETS_ICON}
                  className={styles.addressTagIcon}
                  alt="Memes Sets"
                />
              )}
            </span>
          ) : props.tags.memesBalance > 0 ? (
            <span
              className={`${styles.addressTag} ${
                !UNIQUE_MEMES_ICON ? styles.memesTag : ""
              }`}
            >
              {(props.isUserPage || !UNIQUE_MEMES_ICON) && `Memes x`}
              {props.tags.memesBalance}
              {props.tags.genesis > 0 ? ` (+Genesis) ` : ""}
              {UNIQUE_MEMES_ICON && (
                <img
                  src={UNIQUE_MEMES_ICON}
                  className={styles.addressTagIcon}
                  alt="Unique Memes"
                />
              )}
            </span>
          ) : (
            ""
          )}
          {props.tags.gradientsBalance > 0 && !props.expandedTags ? (
            <span
              className={`${styles.addressTag} ${
                !GRADIENT_ICON ? styles.gradientTag : ""
              }`}
            >
              {(props.isUserPage || !GRADIENT_ICON) && `Gradients x`}
              {props.tags.gradientsBalance}
              {GRADIENT_ICON && (
                <img
                  src={GRADIENT_ICON}
                  className={styles.addressTagIcon}
                  alt="6529 Gradient"
                />
              )}
            </span>
          ) : (
            <>
              {props.tags.memesCardsSetS1 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${styles.addressTag} ${
                      !SZN_1_ICON ? styles.memeSzn1Tag : ""
                    }`}
                  >
                    {(props.isUserPage || !SZN_1_ICON) && `SZN1 Sets x`}
                    {props.tags.memesCardsSetS1}
                    {SZN_1_ICON && (
                      <img
                        src={SZN_1_ICON}
                        className={styles.addressTagIcon}
                        alt="Memes SZN1"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS2 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${styles.addressTag} ${
                      !SZN_2_ICON ? styles.memeSzn2Tag : ""
                    }`}
                  >
                    {(props.isUserPage || !SZN_2_ICON) && `SZN2 Sets x`}
                    {props.tags.memesCardsSetS2}
                    {SZN_2_ICON && (
                      <img
                        src={SZN_2_ICON}
                        className={styles.addressTagIcon}
                        alt="Memes SZN2"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS3 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${styles.addressTag} ${
                      !SZN_3_ICON ? styles.memeSzn3Tag : ""
                    }`}
                  >
                    {(props.isUserPage || !SZN_3_ICON) && `SZN3 Sets x`}
                    {props.tags.memesCardsSetS3}
                    {SZN_3_ICON && (
                      <img
                        src={SZN_3_ICON}
                        className={styles.addressTagIcon}
                        alt="Memes SZN3"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS4 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${styles.addressTag} ${
                      !SZN_4_ICON ? styles.memeSzn4Tag : ""
                    }`}
                  >
                    {(props.isUserPage || !SZN_4_ICON) && `SZN4 Sets x`}
                    {props.tags.memesCardsSetS4}
                    {SZN_4_ICON && (
                      <img
                        src={SZN_4_ICON}
                        className={styles.addressTagIcon}
                        alt="Memes SZN4"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS5 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${styles.addressTag} ${
                      !SZN_4_ICON ? styles.memeSzn5Tag : ""
                    }`}
                  >
                    {(props.isUserPage || !SZN_4_ICON) && `SZN5 Sets x`}
                    {props.tags.memesCardsSetS5}
                    {SZN_5_ICON && (
                      <img
                        src={SZN_5_ICON}
                        className={styles.addressTagIcon}
                        alt="Memes SZN5"
                      />
                    )}
                  </span>
                )}
              {props.tags.gradientsBalance > 0 && props.expandedTags && (
                <span
                  className={`${styles.addressTag} ${
                    !GRADIENT_ICON ? styles.gradientTag : ""
                  }`}
                >
                  {(props.isUserPage || !GRADIENT_ICON) && `Gradients x`}
                  {props.tags.gradientsBalance}
                  {GRADIENT_ICON && (
                    <img
                      src={GRADIENT_ICON}
                      className={styles.addressTagIcon}
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
