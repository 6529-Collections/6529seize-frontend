declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": ModelViewerElementAttributes;
  }

  interface ModelViewerElementAttributes
    extends React.HTMLAttributes<HTMLElement> {
    src?: string;
    alt?: string;
    "auto-rotate"?: boolean;
    "camera-controls"?: boolean;
    ar?: boolean;
    poster?: string;
    style?: React.CSSProperties;
  }
}
