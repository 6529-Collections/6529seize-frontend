import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./DotLoader.module.scss";

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
      icon="spinner"
      className={styles.spinner}
      style={
        props.dimension
          ? { height: props.dimension, width: props.dimension }
          : {}
      }
    />
  );
}
