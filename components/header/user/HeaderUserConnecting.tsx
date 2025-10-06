import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";

export default function HeaderUserConnecting() {
  return (
    <div className="tw-h-11 tw-w-11 tw-mr-4 tw-flex tw-items-center tw-justify-center">
      <CircleLoader size={CircleLoaderSize.MEDIUM} />
    </div>
  );
}
