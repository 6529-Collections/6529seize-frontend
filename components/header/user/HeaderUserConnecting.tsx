import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";

export default function HeaderUserConnecting() {
  return (
    <div>
      <CircleLoader size={CircleLoaderSize.MEDIUM} />
    </div>
  );
}
