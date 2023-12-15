import Tippy from "@tippyjs/react";
import {
  IProfileAndConsolidations,
  ProfileActivityLogPrimaryWalletEdit,
} from "../../../../../../entities/IProfile";
import { formatAddress } from "../../../../../../helpers/Helpers";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import CopyIcon from "../../../../../utils/icons/CopyIcon";
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "react-use";
import { useRouter } from "next/router";
import UserPageIdentityActivityLogItemHandle from "./utils/UserPageIdentityActivityLogItemHandle";
import UserPageIdentityActivityLogItemAction from "./utils/UserPageIdentityActivityLogItemAction";

export default function UserPageIdentityActivityLogPrimaryWallet({
  log,
  profile,
}: {
  log: ProfileActivityLogPrimaryWalletEdit;
  profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
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

  const isAdded = !log.contents.old_value;
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);

  return (
    <tr>
      <td className="tw-py-4 tw-flex tw-items-center">
        <div className="tw-space-x-1.5">
          <UserPageIdentityActivityLogItemHandle profile={profile} />
          <UserPageIdentityActivityLogItemAction
            action={isAdded ? "added" : "changed"}
          />

          <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
            primary wallet
          </span>
          {!isAdded && (
            <>
              <span className="tw-whitespace-nowrap tw-group tw-inline-flex tw-text-sm tw-font-semibold tw-text-iron-100">
                {oldTitle}
                <Tippy
                  content="Copy"
                  theme="dark"
                  placement="top"
                  disabled={isTouchScreen}
                >
                  <button
                    onClick={handleCopyOld}
                    className={`${
                      isTouchScreen
                        ? "tw-block"
                        : "tw-hidden group-hover:tw-block"
                    } tw-mx-1 tw-h-5 tw-w-5 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
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
            </>
          )}
          <span className="tw-whitespace-nowrap tw-group tw-inline-flex  tw-text-sm tw-font-semibold tw-text-iron-100">
            {newTitle}
            <Tippy
              content="Copy"
              theme="dark"
              placement="top"
              disabled={isTouchScreen}
            >
              <button
                onClick={handleCopyNew}
                className={`${
                  isTouchScreen ? "tw-block" : "tw-hidden group-hover:tw-block"
                } tw-mx-1 tw-h-5 tw-w-5 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
              >
                <CopyIcon />
              </button>
            </Tippy>
          </span>
        </div>
      </td>
      <td className="tw-py-4 tw-pl-3 tw-text-right">
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
