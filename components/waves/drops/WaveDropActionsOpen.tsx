import React from "react";
import { ApiDropType } from "../../../generated/models/ApiDropType";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useRouter } from "next/router";

interface WaveDropActionsOpenProps {
  readonly drop: ExtendedDrop;
}

const WaveDropActionsOpen: React.FC<WaveDropActionsOpenProps> = ({ drop }) => {
  const router = useRouter();
  const canBeOpened = drop.drop_type !== ApiDropType.Chat;

  const onDropClick = (drop: ExtendedDrop) => {
    const currentQuery = { ...router.query };
    currentQuery.drop = drop.id;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  if (!canBeOpened) {
    return null;
  }

  return (
    <Tippy
      content={
        <div className="tw-text-center">
          <span className="tw-text-xs tw-font-normal tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out">
            Open
          </span>
        </div>
      }
      placement="top"
      trigger="mouseenter"
      hideOnClick={false}
    >
      <button
        className="tw-text-yellow/80 tw-px-2 desktop-hover:hover:tw-text-yellow tw-h-full tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
        onClick={() => onDropClick(drop)}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 9L21 3M21 3H15M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </Tippy>
  );
};

export default WaveDropActionsOpen;
