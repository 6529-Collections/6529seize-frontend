import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import DateCountdown from "../date-countdown/DateCountdown";
import styles from "./MintCountdownBox.module.scss";

interface Props {
  mintInfo?: {
    title: string;
    date: number; // Unix seconds
    showAllowlistInfo?: boolean;
    isFinalized?: boolean;
    isEnded?: boolean;
  };
  linkInfo?: {
    href: string;
    target: "_blank" | "_self";
  };
  hideMintBtn?: boolean;
  small?: boolean;
}

export default function MintCountdownBox(props: Readonly<Props>) {
  const { mintInfo, linkInfo, hideMintBtn, small } = props;

  // Derived flags
  const hasMintInfo = Boolean(mintInfo);
  const canShowMintButton =
    !small && !hideMintBtn && hasMintInfo && Boolean(linkInfo);
  const showSkeletonButton = !hasMintInfo;

  // Safe date conversion (only when present)
  const countdownDate =
    mintInfo?.date === null || mintInfo?.date === undefined
      ? undefined
      : new Date(mintInfo.date * 1000);

  const showAllowlistInfo = mintInfo?.showAllowlistInfo;

  const containerClasses = [
    styles.countdownContainer,
    small ? styles.countdownContainerShort : "",
  ].join(" ");

  if (mintInfo?.isFinalized) {
    return (
      <div className={containerClasses}>
        <h4 className="mb-3">⌛️ Mint Phase Complete</h4>
        <p className="mb-1 tw-font-medium">This mint phase has ended.</p>
        <p className="mb-0 tw-text-md">Thank you for participating!</p>
      </div>
    );
  }

  if (mintInfo?.isEnded) {
    return (
      <div className={containerClasses}>
        <h4 className="mb-3">✅ Mint Complete - Sold Out!</h4>
        <p className="mb-1 tw-font-medium">
          All NFTs have been successfully minted.
        </p>
        <p className="mb-0 tw-text-md">Thank you for participating!</p>
      </div>
    );
  }

  // Default: minting state
  return (
    <div className={containerClasses}>
      {showAllowlistInfo && (
        <>
          <FontAwesomeIcon
            icon={faInfoCircle}
            data-tooltip-id="allowlist-info"
            data-tooltip-content="The timer displays the current time remaining for a specific phase of the drop. Please refer to the distribution plan to check if you are in the allowlist."
            className={styles.allowlistInfo}
          />
          <Tooltip
            id="allowlist-info"
            place="left"
            opacity={1}
            style={{
              backgroundColor: "#37373E",
              color: "white",
              padding: "10px 14px",
              maxWidth: "250px",
              fontSize: "14px",
              lineHeight: "1.4",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
              borderRadius: "6px",
            }}
          />
        </>
      )}
      <div
        className={`pt-2 pb-2 tw-w-full ${
          !canShowMintButton && "text-center"
        }`}>
        <DateCountdown title={mintInfo?.title} date={countdownDate} />
      </div>

      {showSkeletonButton && (
        <div className="pt-2 pb-2 tw-w-full">
          <button
            disabled
            className={`pt-2 pb-2 btn-block no-wrap ${styles.mintBtn} ${styles.skeletonBtn}`}>
            &nbsp;
          </button>
        </div>
      )}

      {canShowMintButton && linkInfo && (
        <div className="pt-2 pb-2 tw-w-full">
          <Link
            href={linkInfo.href}
            target={linkInfo.target}
            rel={
              linkInfo.target === "_blank" ? "noopener noreferrer" : undefined
            }>
            <button className={`pt-2 pb-2 btn-block no-wrap ${styles.mintBtn}`}>
              Mint
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
