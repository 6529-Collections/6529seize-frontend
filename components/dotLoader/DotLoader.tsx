import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./DotLoader.module.scss";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function DotLoader() {
  return (
    <div className={styles.loader}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
}

export function Spinner(
  props: Readonly<{
    dimension?: number;
  }>
) {
  return (
    <FontAwesomeIcon
      icon={faSpinner}
      className={styles.spinner}
      style={
        props.dimension
          ? { height: props.dimension, width: props.dimension }
          : {}
      }
    />
  );
}
