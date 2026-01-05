import styles from "./Timeline.module.scss";

interface Props {
  type: MediaType;
  url: string;
}

export enum MediaType {
  IMAGE,
  VIDEO,
  HTML,
}

export default function TimelineMediaComponent(props: Readonly<Props>) {
  if (props.type === MediaType.VIDEO) {
    return (
      <video
        autoPlay
        muted
        controls
        loop
        playsInline
        className={styles["timelineMediaImage"]}
        src={props.url}></video>
    );
  }
  if (props.type === MediaType.HTML) {
    return (
      <iframe className={styles["timelineMediaImage"]} src={props.url}></iframe>
    );
  }
  return (
    <img
      src={props.url}
      className={styles["timelineMediaImage"]}
      alt={props.url}
    />
  );
}
