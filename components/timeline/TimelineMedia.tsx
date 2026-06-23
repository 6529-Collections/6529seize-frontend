import styles from "./Timeline.module.scss";
import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface Props {
  type: MediaType;
  url: string;
  label?: string;
  locale?: SupportedLocale;
}

export enum MediaType {
  IMAGE,
  VIDEO,
  HTML,
}

export default function TimelineMediaComponent(props: Readonly<Props>) {
  const locale = props.locale ?? DEFAULT_LOCALE;
  const label = props.label ?? t(locale, "timeline.media.defaultLabel");

  if (props.type === MediaType.VIDEO) {
    return (
      <SeizeVideoPlayer
        template="ambient-media"
        className={styles["timelineMediaImage"]}
        src={props.url}
        autoPlay
        muted
        loop
        align="center"
        aria-label={t(locale, "timeline.media.videoAriaLabel", { label })}
      />
    );
  }
  if (props.type === MediaType.HTML) {
    return (
      <iframe
        className={styles["timelineMediaImage"]}
        src={props.url}
        sandbox="allow-scripts"
        title={t(locale, "timeline.media.htmlTitle", { label })}
      ></iframe>
    );
  }
  return (
    // Native img is intentional: timeline media hosts come from arbitrary NFT metadata.
    <img
      src={props.url}
      className={styles["timelineMediaImage"]}
      alt={t(locale, "timeline.media.imageAlt", { label })}
    />
  );
}
