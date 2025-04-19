import { assertUnreachable } from "../../../../../../../helpers/AllowlistToolHelpers";
import { TransactionType } from "./UserPageStatsActivityWalletTableRow";

export default function UserPageStatsActivityWalletTableRowIcon({
  type,
}: {
  readonly type: TransactionType;
}) {
  switch (type) {
    case TransactionType.RECEIVED_AIRDROP:
    case TransactionType.AIRDROPPED:
      return (
        <svg
          className="tw-shrink-0 tw-h-6 tw-w-6 tw-mr-2 tw-text-iron-300"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_419_169)">
            <path
              d="M22.1871 9.19354C22.1871 6.72272 21.1155 4.40442 19.17 2.66565C17.2467 0.946655 14.6948 0 11.9843 0C9.27356 0 6.72162 0.946655 4.79828 2.66565C2.85278 4.40442 1.78125 6.72272 1.78125 9.19354C1.78125 9.19629 1.78162 9.19885 1.78198 9.20142C1.78345 9.34515 1.82812 9.48981 1.92078 9.61377L8.22253 18.0652V23.2969C8.22253 23.6852 8.53729 24 8.92566 24H15.0425C15.4308 24 15.7456 23.6852 15.7456 23.2969V18.0652L22.0475 9.61377C22.1404 9.48944 22.1849 9.34442 22.1862 9.20032C22.1863 9.19794 22.1871 9.19592 22.1871 9.19354ZM10.6533 17.1288L8.21191 9.63043C8.94507 9.40723 10.2947 9.08569 11.9837 9.08569C13.719 9.08569 15.269 9.42426 16.1169 9.6524L13.3865 17.1288H10.6533ZM12.1309 1.40771C12.1813 1.40845 12.2316 1.40973 12.2818 1.41119C13.6203 1.5271 15.988 3.92047 16.2962 8.24359C15.3376 7.99622 13.7631 7.67944 11.9835 7.67944C10.305 7.67944 8.93628 7.96234 8.06982 8.20532C8.39319 3.85272 10.806 1.46759 12.1309 1.40771ZM6.77454 9.75861L9.09338 16.8805L3.66559 9.60132C4.01239 9.5343 4.42859 9.47992 4.86639 9.47992C5.63983 9.47992 6.37262 9.64728 6.77454 9.75861ZM15.0698 16.6192L17.5809 9.74304C17.9147 9.63702 18.5316 9.47992 19.2585 9.47992C19.6522 9.47992 20.0131 9.52606 20.3148 9.58521L15.0698 16.6192ZM20.714 8.23132C20.309 8.14435 19.8098 8.07367 19.2585 8.07367C18.6616 8.07367 18.1269 8.15662 17.7054 8.2533C17.5644 6.10474 16.9413 4.11493 15.9152 2.57318C15.8005 2.40106 15.6824 2.23663 15.5612 2.07971C18.3181 3.17047 20.3293 5.4809 20.714 8.23132ZM8.96265 1.87976C8.78467 2.09509 8.61237 2.32599 8.44794 2.573C7.4176 4.12152 6.79358 6.12158 6.65607 8.2804C6.17084 8.17365 5.53711 8.07367 4.86639 8.07367C4.26068 8.07367 3.69928 8.15533 3.25177 8.25018C3.6546 5.30933 5.9165 2.86908 8.96265 1.87976ZM14.3394 22.5938H9.62878V18.535H10.1378C10.1395 18.535 10.1409 18.5352 10.1426 18.5352C10.144 18.5352 10.1457 18.535 10.1472 18.535H13.8741C13.8754 18.535 13.8768 18.5352 13.8783 18.5352C13.8799 18.5352 13.8814 18.535 13.8831 18.535H14.3395V22.5938H14.3394Z"
              fill="currentColor"
            />
          </g>
          <defs>
            <clipPath id="clip0_419_169">
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
    case TransactionType.SEIZED:
    case TransactionType.SEIZED_TO:
      return (
        <svg
          className="tw-shrink-0 tw-w-6 tw-h-6 tw-mr-2 tw-text-iron-300"
          viewBox="0 0 27 27"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5.00014 17H18.1359C19.1487 17 19.6551 17 20.0582 16.8112C20.4134 16.6448 20.7118 16.3777 20.9163 16.0432C21.1485 15.6633 21.2044 15.16 21.3163 14.1534L21.9013 8.88835C21.9355 8.58088 21.9525 8.42715 21.9031 8.30816C21.8597 8.20366 21.7821 8.11697 21.683 8.06228C21.5702 8 21.4155 8 21.1062 8H4.50014M2 5H3.24844C3.51306 5 3.64537 5 3.74889 5.05032C3.84002 5.09463 3.91554 5.16557 3.96544 5.25376C4.02212 5.35394 4.03037 5.48599 4.04688 5.7501L4.95312 20.2499C4.96963 20.514 4.97788 20.6461 5.03456 20.7462C5.08446 20.8344 5.15998 20.9054 5.25111 20.9497C5.35463 21 5.48694 21 5.75156 21H19M7.5 24.5H7.51M16.5 24.5H16.51M8 24.5C8 24.7761 7.77614 25 7.5 25C7.22386 25 7 24.7761 7 24.5C7 24.2239 7.22386 24 7.5 24C7.77614 24 8 24.2239 8 24.5ZM17 24.5C17 24.7761 16.7761 25 16.5 25C16.2239 25 16 24.7761 16 24.5C16 24.2239 16.2239 24 16.5 24C16.7761 24 17 24.2239 17 24.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g mask="url(#mask0_420_171)">
            <path
              d="M27 7.5C27 3.35786 23.6421 0 19.5 0C15.3579 0 12 3.35786 12 7.5C12 11.6421 15.3579 15 19.5 15C23.6421 15 27 11.6421 27 7.5Z"
              fill="#131316"
            />
            <path
              d="M19.5 5V10M17 7.5H22M25.75 7.5C25.75 10.9518 22.9518 13.75 19.5 13.75C16.0482 13.75 13.25 10.9518 13.25 7.5C13.25 4.04822 16.0482 1.25 19.5 1.25C22.9518 1.25 25.75 4.04822 25.75 7.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      );
    case TransactionType.SALE:
      return (
        <svg
          className="tw-shrink-0 tw-w-6 tw-h-6 tw-mr-2 tw-text-iron-300"
          viewBox="0 0 27 27"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5.00014 17H18.1359C19.1487 17 19.6551 17 20.0582 16.8112C20.4134 16.6448 20.7118 16.3777 20.9163 16.0432C21.1485 15.6633 21.2044 15.16 21.3163 14.1534L21.9013 8.88835C21.9355 8.58088 21.9525 8.42715 21.9031 8.30816C21.8597 8.20366 21.7821 8.11697 21.683 8.06228C21.5702 8 21.4155 8 21.1062 8H4.50014M2 5H3.24844C3.51306 5 3.64537 5 3.74889 5.05032C3.84002 5.09463 3.91554 5.16557 3.96544 5.25376C4.02212 5.35394 4.03037 5.48599 4.04688 5.7501L4.95312 20.2499C4.96963 20.514 4.97788 20.6461 5.03456 20.7462C5.08446 20.8344 5.15998 20.9054 5.25111 20.9497C5.35463 21 5.48694 21 5.75156 21H19M7.5 24.5H7.51M16.5 24.5H16.51M8 24.5C8 24.7761 7.77614 25 7.5 25C7.22386 25 7 24.7761 7 24.5C7 24.2239 7.22386 24 7.5 24C7.77614 24 8 24.2239 8 24.5ZM17 24.5C17 24.7761 16.7761 25 16.5 25C16.2239 25 16 24.7761 16 24.5C16 24.2239 16.2239 24 16.5 24C16.7761 24 17 24.2239 17 24.5Z"
            stroke="#CECFD4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g clipPath="url(#clip0_425_191)">
            <rect x="12" width="15" height="15" rx="7.5" fill="#131316" />
            <path
              d="M22 7.5L19.5 5M19.5 5L17 7.5M19.5 5V10M25.75 7.5C25.75 10.9518 22.9518 13.75 19.5 13.75C16.0482 13.75 13.25 10.9518 13.25 7.5C13.25 4.04822 16.0482 1.25 19.5 1.25C22.9518 1.25 25.75 4.04822 25.75 7.5Z"
              stroke="#CECFD4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_425_191">
              <rect x="12" width="15" height="15" rx="7.5" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
    case TransactionType.PURCHASE:
      return (
        <svg
          className="tw-shrink-0 tw-w-6 tw-h-6 tw-mr-2 tw-text-iron-300"
          viewBox="0 0 27 27"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5.00014 17H18.1359C19.1487 17 19.6551 17 20.0582 16.8112C20.4134 16.6448 20.7118 16.3777 20.9163 16.0432C21.1485 15.6633 21.2044 15.16 21.3163 14.1534L21.9013 8.88835C21.9355 8.58088 21.9525 8.42715 21.9031 8.30816C21.8597 8.20366 21.7821 8.11697 21.683 8.06228C21.5702 8 21.4155 8 21.1062 8H4.50014M2 5H3.24844C3.51306 5 3.64537 5 3.74889 5.05032C3.84002 5.09463 3.91554 5.16557 3.96544 5.25376C4.02212 5.35394 4.03037 5.48599 4.04688 5.7501L4.95312 20.2499C4.96963 20.514 4.97788 20.6461 5.03456 20.7462C5.08446 20.8344 5.15998 20.9054 5.25111 20.9497C5.35463 21 5.48694 21 5.75156 21H19M7.5 24.5H7.51M16.5 24.5H16.51M8 24.5C8 24.7761 7.77614 25 7.5 25C7.22386 25 7 24.7761 7 24.5C7 24.2239 7.22386 24 7.5 24C7.77614 24 8 24.2239 8 24.5ZM17 24.5C17 24.7761 16.7761 25 16.5 25C16.2239 25 16 24.7761 16 24.5C16 24.2239 16.2239 24 16.5 24C16.7761 24 17 24.2239 17 24.5Z"
            stroke="#CECFD4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g clipPath="url(#clip0_425_191)">
            <rect x="12" width="15" height="15" rx="7.5" fill="#131316" />
            <path
              d="M17 7.5L19.5 10M19.5 10L22 7.5M19.5 10V5M25.75 7.5C25.75 10.9518 22.9518 13.75 19.5 13.75C16.0482 13.75 13.25 10.9518 13.25 7.5C13.25 4.04822 16.0482 1.25 19.5 1.25C22.9518 1.25 25.75 4.04822 25.75 7.5Z"
              stroke="#CECFD4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_425_191">
              <rect x="12" width="15" height="15" rx="7.5" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
    case TransactionType.TRANSFER_IN:
    case TransactionType.TRANSFER_OUT:
      return (
        <svg
          className="tw-shrink-0 tw-w-6 tw-h-6 tw-mr-2 tw-text-iron-300"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 17H4M4 17L8 13M4 17L8 21M4 7H20M20 7L16 3M20 7L16 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case TransactionType.BURNED:
    case TransactionType.RECEIVED_BURN:
      return (
        <svg
          className="tw-shrink-0 tw-w-6 tw-h-6 tw-mr-2 tw-text-iron-300"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
          />
        </svg>
      );
    default:
      assertUnreachable(type);
      return null;
  }
}
