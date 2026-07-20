"use client";

import type { IProfileConsolidation } from "@/entities/IProfile";
import { numberWithCommas, parseEmojis } from "@/helpers/Helpers";
import { faArrowsTurnRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { WalletAddress } from "./WalletAddress";

interface Props {
  wallets: `0x${string}`[];
  consolidatedWallets?: IProfileConsolidation[] | undefined;
  display: string | undefined;
  displayEns?: string | undefined;
  hideCopy?: boolean | undefined;
  tags?:
    | {
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
        tdh_rank?: number | undefined;
        balance_rank?: number | undefined;
        unique_rank?: number | undefined;
      }
    | undefined;
  isUserPage?: boolean | undefined;
  disableLink?: boolean | undefined;
  viewingWallet?: `0x${string}` | undefined;
  expandedTags?: boolean | undefined;
  setLinkQueryAddress?: boolean | undefined;
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

const ADDRESS_TAG_CLASS_NAME =
  "tw-mr-2.5 tw-whitespace-nowrap tw-bg-iron-700 tw-px-1.5 tw-py-0.5 tw-font-bold tw-text-white tw-shadow-md tw-text-xs lg:tw-text-sm xl:tw-text-base";
const ADDRESS_TAG_ICON_CLASS_NAME = "tw-mx-1 tw-max-h-10 tw-max-w-10 tw-py-0.5";

export default function Address(props: Readonly<Props>) {
  const [consolidationExpanded, setConsolidationExpanded] = useState(
    !!props.isUserPage
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
          wallet={props.wallets[0]!}
          display={props.display}
          displayEns={props.displayEns}
          hideCopy={props.hideCopy}
          disableLink={props.disableLink}
          isUserPage={props.isUserPage}
          setLinkQueryAddress={props.setLinkQueryAddress}
        />
      ) : (
        <span className="tw-inline-flex tw-items-center">
          <button
            type="button"
            name="consolidation-toggle"
            aria-label="consolidation-toggle"
            aria-expanded={consolidationExpanded}
            onClick={() => {
              if (!props.isUserPage) {
                setConsolidationExpanded(!consolidationExpanded);
              }
            }}
            className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-white focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          >
            <Image
              unoptimized
              loading="eager"
              priority
              src="/consolidation-icon.png"
              alt="consolidation"
              width={25}
              height={25}
              className={`tw-transition-transform tw-duration-200 ${
                consolidationExpanded ? "tw-rotate-90" : "tw-rotate-0"
              }`}
            />
          </button>
          &nbsp;&nbsp;
          <Link
            className="tw-no-underline hover:tw-underline"
            href={getProfileLink()}
          >
            <span
              className={`tw-whitespace-break-spaces tw-font-bold tw-text-white ${
                props.isUserPage ? "tw-text-3xl" : ""
              }`}
              dangerouslySetInnerHTML={{
                __html: props.display ? parseEmojis(props.display) : ``,
              }}
            ></span>
          </Link>
        </span>
      )}
      <span
        className={
          props.isUserPage
            ? `tw-flex tw-flex-wrap tw-items-center tw-gap-2`
            : `tw-flex tw-flex-col`
        }
      >
        {(consolidationExpanded || props.isUserPage) &&
          props.wallets.length > 1 &&
          props.wallets.map((w, index) => (
            <div
              key={w}
              className={`tw-flex tw-items-center tw-justify-start ${
                props.isUserPage ? "tw-text-lg" : ""
              }`}
            >
              <FontAwesomeIcon
                icon={faArrowsTurnRight}
                name={`arrow-turn-right`}
                aria-label={`arrow-turn-right`}
                className="tw-ml-1.5 tw-mr-2.5 tw-w-[15px] tw-scale-y-[-1] tw-text-[15px]"
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
        <span className="tw-whitespace-nowrap">
          {(props.tags.tdh_rank || props.tags.balance_rank) && (
            <>
              {props.tags.balance_rank &&
                props.tags.balance_rank > 0 &&
                props.expandedTags && (
                  <span className={ADDRESS_TAG_CLASS_NAME}>
                    All Cards Rank #{numberWithCommas(props.tags.balance_rank)}
                  </span>
                )}
              {props.tags.unique_rank &&
                props.tags.unique_rank > 0 &&
                props.expandedTags && (
                  <span className={ADDRESS_TAG_CLASS_NAME}>
                    Unique Cards Rank #
                    {numberWithCommas(props.tags.unique_rank)}
                  </span>
                )}
              {props.tags.tdh_rank &&
                props.tags.tdh_rank > 0 &&
                props.expandedTags && (
                  <span className={ADDRESS_TAG_CLASS_NAME}>
                    TDH Rank #{numberWithCommas(props.tags.tdh_rank)}
                  </span>
                )}
              <br />
            </>
          )}
          {props.tags.memesCardsSets > 0 ? (
            <span
              className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#da2089] tw-leading-6`}
            >
              {(props.isUserPage || !MEMES_SETS_ICON) && `Memes Sets x`}
              {props.tags.memesCardsSets}
              {MEMES_SETS_ICON && (
                <img
                  src={MEMES_SETS_ICON}
                  className={ADDRESS_TAG_ICON_CLASS_NAME}
                  alt="Memes Sets"
                />
              )}
            </span>
          ) : props.tags.memesBalance > 0 ? (
            <span
              className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#c51d34] tw-leading-6`}
            >
              {(props.isUserPage || !UNIQUE_MEMES_ICON) && `Memes x`}
              {props.tags.memesBalance}
              {props.tags.genesis > 0 ? ` (+Genesis) ` : ""}
              {UNIQUE_MEMES_ICON && (
                <img
                  src={UNIQUE_MEMES_ICON}
                  className={ADDRESS_TAG_ICON_CLASS_NAME}
                  alt="Unique Memes"
                />
              )}
            </span>
          ) : (
            ""
          )}
          {props.tags.gradientsBalance > 0 && !props.expandedTags ? (
            <span
              className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#444] tw-leading-6`}
            >
              {(props.isUserPage || !GRADIENT_ICON) && `Gradients x`}
              {props.tags.gradientsBalance}
              {GRADIENT_ICON && (
                <img
                  src={GRADIENT_ICON}
                  className={ADDRESS_TAG_ICON_CLASS_NAME}
                  alt="6529 Gradient"
                />
              )}
            </span>
          ) : (
            <>
              {props.tags.memesCardsSetS1 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#208359] tw-leading-6`}
                  >
                    {(props.isUserPage || !SZN_1_ICON) && `SZN1 Sets x`}
                    {props.tags.memesCardsSetS1}
                    {SZN_1_ICON && (
                      <img
                        src={SZN_1_ICON}
                        className={ADDRESS_TAG_ICON_CLASS_NAME}
                        alt="Memes SZN1"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS2 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#267c93] tw-leading-6`}
                  >
                    {(props.isUserPage || !SZN_2_ICON) && `SZN2 Sets x`}
                    {props.tags.memesCardsSetS2}
                    {SZN_2_ICON && (
                      <img
                        src={SZN_2_ICON}
                        className={ADDRESS_TAG_ICON_CLASS_NAME}
                        alt="Memes SZN2"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS3 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#d7710d] tw-leading-6`}
                  >
                    {(props.isUserPage || !SZN_3_ICON) && `SZN3 Sets x`}
                    {props.tags.memesCardsSetS3}
                    {SZN_3_ICON && (
                      <img
                        src={SZN_3_ICON}
                        className={ADDRESS_TAG_ICON_CLASS_NAME}
                        alt="Memes SZN3"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS4 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#a8a800] tw-leading-6`}
                  >
                    {(props.isUserPage || !SZN_4_ICON) && `SZN4 Sets x`}
                    {props.tags.memesCardsSetS4}
                    {SZN_4_ICON && (
                      <img
                        src={SZN_4_ICON}
                        className={ADDRESS_TAG_ICON_CLASS_NAME}
                        alt="Memes SZN4"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS5 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#8c00a8] tw-leading-6`}
                  >
                    {(props.isUserPage || !SZN_5_ICON) && `SZN5 Sets x`}
                    {props.tags.memesCardsSetS5}
                    {SZN_5_ICON && (
                      <img
                        src={SZN_5_ICON}
                        className={ADDRESS_TAG_ICON_CLASS_NAME}
                        alt="Memes SZN5"
                      />
                    )}
                  </span>
                )}
              {props.tags.memesCardsSetS6 > 0 &&
                (props.tags.memesCardsSets === 0 || props.expandedTags) && (
                  <span
                    className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#110b54] tw-leading-6`}
                  >
                    {(props.isUserPage || !SZN_6_ICON) && `SZN6 Sets x`}
                    {props.tags.memesCardsSetS6}
                    {SZN_6_ICON && (
                      <img
                        src={SZN_6_ICON}
                        className={ADDRESS_TAG_ICON_CLASS_NAME}
                        alt="Memes SZN6"
                      />
                    )}
                  </span>
                )}
              {props.tags.gradientsBalance > 0 && props.expandedTags && (
                <span
                  className={`${ADDRESS_TAG_CLASS_NAME} tw-bg-[#444] tw-leading-6`}
                >
                  {(props.isUserPage || !GRADIENT_ICON) && `Gradients x`}
                  {props.tags.gradientsBalance}
                  {GRADIENT_ICON && (
                    <img
                      src={GRADIENT_ICON}
                      className={ADDRESS_TAG_ICON_CLASS_NAME}
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
