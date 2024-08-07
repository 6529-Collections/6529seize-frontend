import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./CapacitorWidget.module.scss";
import {
  faArrowLeft,
  faArrowRight,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CapacitorWidget() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`${styles.capacitorWidget} ${
        isExpanded ? styles.expanded : ""
      }`}>
      <div className="d-flex flex-column align-items-end">
        <span className={styles.slider}>
          <button className={styles.expandButton} onClick={toggleExpand}>
            <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronUp} />
          </button>
        </span>
        <span className={styles.buttonContainer}>
          <button
            className={styles.button}
            disabled={!router.back}
            onClick={() => router.back()}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <button
            className={styles.button}
            disabled={!router.forward}
            onClick={() => router.forward()}>
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
          <button className={styles.button} onClick={() => router.refresh()}>
            <FontAwesomeIcon icon={faRefresh} />
          </button>
        </span>
      </div>
    </div>
  );
}
