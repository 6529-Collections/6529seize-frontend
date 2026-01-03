import MediaDisplayGLB from "./MediaDisplayGLB";

export default function DropListItemContentMediaGLB({
  src,
}: {
  readonly src: string;
}) {
  return (
    <div className="tw-w-full tw-h-full">
      <MediaDisplayGLB src={src} />
    </div>
  );
}
