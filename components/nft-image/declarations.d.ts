declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": ModelViewerElementAttributes;
  }

  interface ModelViewerElementAttributes extends React.HTMLAttributes<HTMLElement> {
    ref?:
      | React.RefObject<HTMLElement | null>
      | React.MutableRefObject<HTMLElement | null>
      | ((instance: HTMLElement | null) => void)
      | null;
    src?: string;
    alt?: string;
    "auto-rotate"?: boolean;
    "disable-pan"?: boolean;
    "camera-controls"?: boolean;
    ar?: boolean;
    poster?: string;
    style?: React.CSSProperties;
  }
}
