import "@google/model-viewer";

export default function DropListItemContentMediaGLB({
  src,
}: {
  readonly src: string;
}) {
  return (
    <model-viewer
      src={src}
      alt="A 3D model of an astronaut"
      auto-rotate
      camera-controls
      className="tw-w-full tw-h-full"
    ></model-viewer>
  );
}
