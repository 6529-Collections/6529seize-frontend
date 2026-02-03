import styles from "./ExpandableTweetPreview.module.css";

export default function CompactControls({
  showFade,
  showButton,
  isExpanded,
  onExpand,
}: {
  readonly showFade: boolean;
  readonly showButton: boolean;
  readonly isExpanded: boolean;
  readonly onExpand: () => void;
}) {
  return (
    <>
      {showFade ? <div className={styles["fade"]} aria-hidden="true" /> : null}
      {showButton ? (
        <button
          type="button"
          className={styles["toggle"]}
          aria-expanded={isExpanded}
          onClick={onExpand}
        >
          Show full tweet
        </button>
      ) : null}
    </>
  );
}
