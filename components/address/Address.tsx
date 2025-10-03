"use client";

import { IProfileConsolidation } from "@/entities/IProfile";
import { numberWithCommas, parseEmojis } from "@/helpers/Helpers";
import { faArrowsTurnRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import styles from "./Address.module.scss";
import { WalletAddress } from "./WalletAddress";

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
    memesCardsSetS6: number;
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
  setLinkQueryAddress?: boolean;
}

const MEMES_SETS_ICON = "";

const UNIQUE_MEMES_ICON = "";

const SZN_1_ICON = "";

const SZN_2_ICON = "";

const SZN_3_ICON = "";

const SZN_4_ICON = "";

const SZN_5_ICON = "";

const SZN_6_ICON = "";

const GRADIENT_ICON = "";

export default function Address(props: Readonly<Props>) {
  const [consolidationExpanded, setConsolidationExpanded] = useState(
    props.isUserPage ? true : false
  );

  const getWalletDisplayAndEns = (
    wallet: string,
    index: number
  ): { display: string | undefined; displayEns: string | undefined } => {
    const walletObj = props.consolidatedWallets?.find(
      (c) => c.wallet.address.toLowerCase() === wallet.toLowerCase()
    );

    if (walletObj) {
      return {
        display: walletObj.wallet.ens,
        displayEns: walletObj.wallet.ens,
      };
    }

    const ens = props.display?.split(" - ")[index]?.endsWith(".eth")
      ? props.display?.split(" - ")[index]
      : undefined;

    return {
      display: ens ?? wallet,
      displayEns: ens,
    };
  };

  function getProfileLink() {
    if (props.display && !props.display.includes(" ")) {
      return `/${props.display}`;
    }
    return `/${props.wallets[0]}`;
  }

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
          setLinkQueryAddress={props.setLinkQueryAddress}
        />
      ) : (
        <Dropdown
          className={`${styles.consolidationDropdown}`}
          autoClose="outside">
          <Dropdown.Toggle
            name={`consolidation-toggle`}
            aria-label={`consolidation-toggle`}>
            <Image
              unoptimized
              loading="eager"
              priority
              src="/consolidation-icon.png"
              alt="consolidation"
              width={25}
              height={25}
              style={{
                transition: "transform 0.2s ease",
                transform: consolidationExpanded
                  ? "rotate(90deg)"
                  : "rotate(0deg)",
              }}
              onClick={() => {
                if (!props.isUserPage) {
                  setConsolidationExpanded(!consolidationExpanded);
                }
              }}
            />
            &nbsp;&nbsp;
            <Link
              className="decoration-none decoration-hover-underline"
              href={getProfileLink()}>
              <span
                className={`${styles.consolidationDisplay} ${
                  props.isUserPage ? styles.consolidationDisplayUserPage : ""
                }`}
                dangerouslySetInnerHTML={{
                  __html: props.display ? parseEmojis(props.display) : ``,
                }}></span>
            </Link>
          </Dropdown.Toggle>
        </Dropdown>
      )}
      <span
        className={
          props.isUserPage
            ? `d-flex flex-wrap align-items-center gap-2`
            : `d-flex flex-column`
        }>
        {(consolidationExpanded || props.isUserPage) &&
          props.wallets.length > 1 &&
          props.wallets.map((w, index) => (
            <div
              key={w}
              className={`d-flex align-items-center justify-content-start ${
                props.isUserPage ? styles.consolidationDiv : ""
              }`}>
              <FontAwesomeIcon
                icon={faArrowsTurnRight}
                name={`arrow-turn-right`}
                aria-label={`arrow-turn-right`}
                className={`${styles.arrowTurnRight}`}
              />
              <WalletAddress
                wallet={w}
                display={getWalletDisplayAndEns(w, index).display}
                displayEns={getWalletDisplayAndEns(w, index).displayEns}
                hideCopy={props.hideCopy}
                disableLink={false}
                setLinkQueryAddress={props.setLinkQueryAddress}
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
              }`}>
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
              }`}>
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
              }`}>
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
                    }`}>
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
                    }`}>
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
                    }`}>
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
                    }`}>
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
                      !SZN_5_ICON ? styles.memeSzn5Tag : ""
                    }`}>
                    {(props.isUserPage || !SZN_5_ICON) && `SZN5 Sets x`}
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
              {props.tags.memesCardsSetS6 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${styles.addressTag} ${
                      !SZN_6_ICON ? styles.memeSzn6Tag : ""
                    }`}>
                    {(props.isUserPage || !SZN_6_ICON) && `SZN6 Sets x`}
                    {props.tags.memesCardsSetS6}
                    {SZN_6_ICON && (
                      <img
                        src={SZN_6_ICON}
                        className={styles.addressTagIcon}
                        alt="Memes SZN6"
                      />
                    )}
                  </span>
                )}
              {props.tags.gradientsBalance > 0 && props.expandedTags && (
                <span
                  className={`${styles.addressTag} ${
                    !GRADIENT_ICON ? styles.gradientTag : ""
                  }`}>
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
