import "@google/model-viewer";

export default function DropListItemContentMediaGLB({
  src,
}: {
  readonly src: string;
}) {
  return (
    <div className="tw-mt-1">
      <model-viewer
        src={src}
        ar
        auto-rotate
        camera-controls
        className="tw-w-full tw-h-full"
      ></model-viewer>
    </div>
  );
}
