import { useEffect, useState } from "react";
import styles from "./Timeline.module.scss";
import { getContentTypeFromURL } from "../../helpers/Helpers";

interface Props {
  url: string;
}
export default function TimelineMediaComponent(props: Props) {
  const [contentType, setContentType] = useState<string | null>();

  return <img src={props.url} className={styles.imageChange} alt={props.url} />;
}
