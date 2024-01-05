import Tippy from "@tippyjs/react";
import { IProfileConsolidation } from "../../../../../entities/IProfile";
import EtherscanIcon from "../../../utils/icons/EtherscanIcon";
import OpenseaIcon from "../../../utils/icons/OpenseaIcon";
import CopyIcon from "../../../../utils/icons/CopyIcon";
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "react-use";
import { useRouter } from "next/router";

export default function UserPageIdentityStatementsConsolidatedAddressesItem({
  address,
  primaryAddress,
}: {
  readonly address: IProfileConsolidation;
  readonly primaryAddress: string;
}) {
  const router = useRouter();
  const goToOpensea = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    window.open(
      `https://opensea.io/accounts/${address.wallet.address}`,
      "_blank"
    );
  };

  const goToEtherscan = () => {
    window.open(
      `https://etherscan.io/address/${address.wallet.address}`,
      "_blank"
    );
  };

  const isPrimary = address.wallet.address.toLowerCase() === primaryAddress;

  const [title, setTitle] = useState(address.wallet.address.slice(0, 6));
  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopy = () => {
    copyToClipboard(address.wallet.address);
    setTitle("Copied!");
    setTimeout(() => {
      setTitle(address.wallet.address.slice(0, 6));
    }, 1000);
  };
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);

  return (
    <li className="tw-h-5 tw-group tw-flex tw-items-center tw-group  tw-text-sm tw-font-medium tw-text-neutral-200 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-1">
      <Tippy
        content="Opensea"
        theme="dark"
        placement="top"
        disabled={isTouchScreen}
      >
        <button
          onClick={goToOpensea}
          className="tw-bg-transparent tw-border-none"
        >
          <div className="tw-flex-shrink-0 tw-h-5 tw-w-5 hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
            <OpenseaIcon />
          </div>
        </button>
      </Tippy>
      <Tippy
        content="Etherscan"
        theme="dark"
        placement="top"
        disabled={isTouchScreen}
      >
        <button
          onClick={goToEtherscan}
          className="tw-bg-transparent tw-border-none"
        >
          <div className="tw-flex-shrink-0 tw-h-5 tw-w-5  hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
            <EtherscanIcon />
          </div>
        </button>
      </Tippy>
      <div className="tw-space-x-3 tw-inline-flex tw-items-center">
        <span>{title}</span>
        {address.wallet.ens && <span>{address.wallet.ens}</span>}
        <div className="tw-inline-flex tw-items-center">
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="#3CCB7F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isPrimary && (
            <span className="tw-ml-1 tw-text-xs tw-font-bold tw-text-neutral-500">
              Primary
            </span>
          )}
          <Tippy
            content="Copy"
            theme="dark"
            placement="top"
            disabled={isTouchScreen}
          >
            <button
              className={`${
                isTouchScreen ? "tw-block" : "tw-hidden group-hover:tw-block"
              } tw-ml-4 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
              onClick={handleCopy}
            >
              <CopyIcon />
            </button>
          </Tippy>
        </div>
      </div>
    </li>
  );
}
