import CircleLoader, {
  CircleLoaderSize,
} from "../../../../distribution-plan-tool/common/CircleLoader";

export default function ImageComponent({ src }: { src: string }): JSX.Element {
  if (src === "loading") {
    return <CircleLoader size={CircleLoaderSize.MEDIUM} />;
  }
  return <img src={src} className="tailwind-scope tw-w-full" />;
}
