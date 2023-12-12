import Tippy from "@tippyjs/react";
import {
  IProfileAndConsolidations,
  ProfileActivityLogPrimaryWalletEdit,
} from "../../../../../../entities/IProfile";
import { formatAddress } from "../../../../../../helpers/Helpers";
import EthereumIcon from "../../../../utils/icons/EthereumIcon";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import CopyIcon from "../../../../../utils/icons/CopyIcon";
import { useState } from "react";
import { useCopyToClipboard } from "react-use";

export default function UserPageIdentityActivityLogPrimaryWallet({
  log,
  profile,
}: {
  log: ProfileActivityLogPrimaryWalletEdit;
  profile: IProfileAndConsolidations;
}) {
  const [oldTitle, setOldTitle] = useState(
    formatAddress(log.contents.old_value)
  );
  const [newTitle, setNewTitle] = useState(
    formatAddress(log.contents.new_value)
  );

  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopyOld = () => {
    copyToClipboard(log.contents.old_value);
    setOldTitle("Copied!");
    setTimeout(() => {
      setOldTitle(formatAddress(log.contents.old_value));
    }, 1000);
  };

  const handleCopyNew = () => {
    copyToClipboard(log.contents.new_value);
    setNewTitle("Copied!");
    setTimeout(() => {
      setNewTitle(formatAddress(log.contents.new_value));
    }, 1000);
  };

  return (
    <li className="tw-py-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          {/* <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-100">
            <EthereumIcon />
          </div> */}
          <div className="tw-inline-flex tw-space-x-1.5">
            <span className="tw-truncate tw-max-w-[12rem] tw-text-sm tw-font-semibold tw-text-iron-100">
              {profile?.profile?.handle}
            </span>
            <span className="tw-text-sm tw-text-iron-400 tw-font-semibold">
              changed
            </span>
            <span className="tw-text-sm tw-text-iron-300 tw-font-medium">
              primary wallet
            </span>
            <span className="tw-whitespace-nowrap tw-group tw-inline-flex tw-text-sm tw-font-semibold tw-text-iron-100">
              {oldTitle}
              <Tippy content="Copy" theme="dark" placement="top">
                <button
                  onClick={handleCopyOld}
                  className="tw-hidden group-hover:tw-block tw-mx-1 tw-h-4 tw-w-4 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-white tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <CopyIcon />
                </button>
              </Tippy>
            </span>
            <svg
              className="tw-h-5 tw-w-5 tw-text-iron-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 12H20M20 12L14 6M20 12L14 18"
                stroke="currentcOLOR"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tw-group tw-inline-flex  tw-text-sm tw-font-semibold tw-text-iron-100">
              {newTitle}
              <Tippy content="Copy" theme="dark" placement="top">
                <button
                  onClick={handleCopyNew}
                  className="tw-hidden group-hover:tw-block tw-mx-1 tw-h-4 tw-w-4 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-white tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <CopyIcon />
                </button>
              </Tippy>
            </span>
          </div>
        </div>
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </div>
    </li>
  );
}
