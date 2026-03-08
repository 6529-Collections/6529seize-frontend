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

const DEFAULT_UNTRUSTED_IFRAME_SANDBOX = "allow-scripts";

const canonicalizeUntrustedHtmlMediaUrl = (rawUrl: string): string | null => {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (trimmed !== rawUrl) {
    return null;
  }

  const normalized =
    trimmed.startsWith("ipfs://") &&
    trimmed.length > "ipfs://".length &&
    !trimmed.slice("ipfs://".length).startsWith("/")
      ? `https://ipfs.io/ipfs/${trimmed.slice("ipfs://".length)}`
      : trimmed;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== "https:") {
    return null;
  }

  if (parsedUrl.username || parsedUrl.password) {
    return null;
  }

  if (parsedUrl.port) {
    if (parsedUrl.port === "443") {
      parsedUrl.port = "";
    } else {
      return null;
    }
  }

  let normalizedHostname = parsedUrl.hostname.toLowerCase();
  while (normalizedHostname.endsWith(".")) {
    normalizedHostname = normalizedHostname.slice(0, -1);
  }

  if (!normalizedHostname) {
    return null;
  }

  if (parsedUrl.hostname !== normalizedHostname) {
    parsedUrl.hostname = normalizedHostname;
  }

  return parsedUrl.toString();
};

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
    const safeSrc = canonicalizeUntrustedHtmlMediaUrl(props.url);
    if (!safeSrc) {
      return (
        <div className={styles["timelineMediaImage"]}>
          Unsupported interactive media
        </div>
      );
    }

    return (
      <iframe
        className={styles["timelineMediaImage"]}
        src={safeSrc}
        title="Untrusted interactive content"
        sandbox={DEFAULT_UNTRUSTED_IFRAME_SANDBOX}
        allow=""
        referrerPolicy="no-referrer"
        loading="lazy"
      />
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
