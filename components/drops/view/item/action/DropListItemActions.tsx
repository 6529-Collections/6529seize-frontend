import { DropFull } from "../../../../../entities/IDrop";
import { RepActionExpandable } from "../DropsListItem";
import DropListItemActionsItemWrapper from "./DropListItemActionsItemWrapper";
import DropListItemActionsRep from "./DropListItemActionsRep";

export default function DropListItemActions({
  drop,
  state,
  setState,
}: {
  readonly drop: DropFull;
  readonly state: RepActionExpandable;
  readonly setState: (newState: RepActionExpandable) => void;
}) {
  const onActionClick = (action: RepActionExpandable) => {
    setState(action === state ? RepActionExpandable.IDLE : action);
  };

  return (
    <div className="tw-relative tw-z-[1] sm:tw-ml-12 tw-mt-4 tw-border-t tw-flex tw-items-center tw-justify-between lg:tw-gap-x-8">
      <DropListItemActionsItemWrapper
        state={RepActionExpandable.DISCUSSION}
        activeState={state}
        setState={onActionClick}
      >
        <>
          {/* <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-primary-400 tw-transition tw-ease-out tw-duration-300"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M1.26317 16.5C1.26317 12.9331 4.09172 10 7.63159 10C11.1715 10 14 12.9331 14 16.5C14 20.0669 11.1715 23 7.63159 23C6.90394 23 6.20298 22.875 5.54947 22.6444C5.44146 22.6063 5.37446 22.5827 5.32533 22.5664C5.31641 22.5635 5.30911 22.5611 5.30327 22.5593L5.29784 22.5599C5.26354 22.5637 5.21679 22.57 5.13013 22.5818L2.13533 22.9908C1.81127 23.0351 1.48606 22.9181 1.26448 22.6775C1.0429 22.4369 0.952961 22.1032 1.02365 21.7839L1.63499 19.0222C1.65624 18.9262 1.6676 18.8744 1.67491 18.8363C1.67532 18.8342 1.67604 18.8303 1.67604 18.8303C1.67423 18.824 1.67193 18.8162 1.66905 18.8066C1.65258 18.7521 1.62837 18.6778 1.589 18.5573C1.37731 17.9093 1.26317 17.2171 1.26317 16.5Z"
              fill="currentColor"
            />
            <path
              d="M5.14754 8.3726C5.92512 8.13071 6.75395 8 7.61788 8C12.3313 8 16.0001 11.8907 16.0001 16.5C16.0001 17.3136 15.8858 18.1049 15.6716 18.8563C16.2136 18.759 16.7393 18.6136 17.2438 18.4246C17.315 18.3979 17.386 18.3707 17.4579 18.3461C17.5159 18.3528 17.5737 18.3619 17.6315 18.3703L20.8444 18.8413C20.9961 18.8636 21.1682 18.8889 21.3182 18.8974C21.4843 18.9069 21.7426 18.9058 22.0162 18.7882C22.3579 18.6412 22.6328 18.3726 22.7876 18.0343C22.9115 17.7635 22.9185 17.5054 22.9129 17.3391C22.9078 17.1888 22.8865 17.0162 22.8677 16.864L22.4617 13.5661C22.4512 13.4804 22.4457 13.4354 22.4425 13.4024C22.4601 13.3301 22.4931 13.2602 22.5195 13.1909C22.8983 12.1979 23.1053 11.1219 23.1053 10C23.1053 5.02326 19.0461 1 14.0526 1C9.61686 1 5.9183 4.17483 5.14754 8.3726Z"
              fill="currentColor"
            />
          </svg> */}
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.09436 11.2288C6.03221 10.8282 5.99996 10.4179 5.99996 10C5.99996 5.58172 9.60525 2 14.0526 2C18.4999 2 22.1052 5.58172 22.1052 10C22.1052 10.9981 21.9213 11.9535 21.5852 12.8345C21.5154 13.0175 21.4804 13.109 21.4646 13.1804C21.4489 13.2512 21.4428 13.301 21.4411 13.3735C21.4394 13.4466 21.4493 13.5272 21.4692 13.6883L21.8717 16.9585C21.9153 17.3125 21.9371 17.4895 21.8782 17.6182C21.8266 17.731 21.735 17.8205 21.6211 17.8695C21.4911 17.9254 21.3146 17.8995 20.9617 17.8478L17.7765 17.3809C17.6101 17.3565 17.527 17.3443 17.4512 17.3448C17.3763 17.3452 17.3245 17.3507 17.2511 17.3661C17.177 17.3817 17.0823 17.4172 16.893 17.4881C16.0097 17.819 15.0524 18 14.0526 18C13.6344 18 13.2237 17.9683 12.8227 17.9073M7.63158 22C10.5965 22 13 19.5376 13 16.5C13 13.4624 10.5965 11 7.63158 11C4.66668 11 2.26316 13.4624 2.26316 16.5C2.26316 17.1106 2.36028 17.6979 2.53955 18.2467C2.61533 18.4787 2.65322 18.5947 2.66566 18.6739C2.67864 18.7567 2.68091 18.8031 2.67608 18.8867C2.67145 18.9668 2.65141 19.0573 2.61134 19.2383L2 22L4.9948 21.591C5.15827 21.5687 5.24 21.5575 5.31137 21.558C5.38652 21.5585 5.42641 21.5626 5.50011 21.5773C5.5701 21.5912 5.67416 21.6279 5.88227 21.7014C6.43059 21.8949 7.01911 22 7.63158 22Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="tw-text-iron-400 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
            Discuss
          </span>
          <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-iron-300 tw-text-xs tw-font-medium">
            {drop.discussion_comments_count}
          </div>
        </>
      </DropListItemActionsItemWrapper>
      <DropListItemActionsItemWrapper
        state={RepActionExpandable.QUOTE}
        activeState={state}
        setState={onActionClick}
      >
        <>
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300"
            viewBox="0 0 512 512"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="m123.19 137.32 33.81 33.85c9.51 9.51 25.31 9.74 34.64.05a24 24 0 0 0 -.32-33.61l-74.68-74.78a24.67 24.67 0 0 0 -34.9 0l-74.74 74.76a24 24 0 0 0 34 33.94l34.21-34.21v230a89.16 89.16 0 0 0 89.06 89.06h127.73a24 24 0 0 0 0-48h-127.73a41.11 41.11 0 0 1 -41.06-41.06z"
            ></path>
            <path
              fill="currentColor"
              d="m388.81 374.68-33.81-33.85c-9.51-9.51-25.31-9.74-34.64-.05a24 24 0 0 0 .32 33.61l74.72 74.78a24.67 24.67 0 0 0 34.9 0l74.7-74.76a24 24 0 0 0 -34-33.94l-34.21 34.21v-230a89.16 89.16 0 0 0 -89.06-89.08h-127.73a24 24 0 0 0 0 48h127.73a41.11 41.11 0 0 1 41.06 41.06z"
            ></path>
          </svg>
          <span className="tw-text-iron-400 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
            Redrop
          </span>
          <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-iron-300 tw-text-xs tw-font-medium">
            45
          </div>
        </>
      </DropListItemActionsItemWrapper>
      <div className="tw-mt-0.5">
        <DropListItemActionsRep
          drop={drop}
          activeState={state}
          setState={onActionClick}
        />
      </div>
    </div>
  );
}
