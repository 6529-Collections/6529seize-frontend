import styles from "./NFTImage.module.scss";

interface Props {
  readonly balance: number;
  readonly showOwned?: boolean;
  readonly showUnseized: boolean;
  readonly height: 300 | 650 | "full";
}

export default function NFTImageBalance({ balance, showOwned, showUnseized, height }: Props) {
  return (
    <>
      {balance > 0 && (
        <span
          className={`${styles.balance}  ${
            height === 650 ? styles.balanceBigger : ""
          }`}>
          <span>SEIZED{!showOwned ? ` x${balance}` : ""}</span>
        </span>
      )}
      {showUnseized && balance === 0 && (
        <span className={`${styles.balance}`}>UNSEIZED</span>
      )}
      {showUnseized && balance === -1 && (
        <span className={`${styles.balance}`}>...</span>
      )}
    </>
  );
}