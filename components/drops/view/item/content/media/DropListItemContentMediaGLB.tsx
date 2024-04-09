import "@google/model-viewer";

export default function DropListItemContentMediaGLB({
  src,
}: {
  readonly src: string;
}) {
  return (
    <model-viewer
      src={src}
      ar
      auto-rotate
      camera-controls
      className="tw-w-full tw-h-full"
    ></model-viewer>
  );
}
