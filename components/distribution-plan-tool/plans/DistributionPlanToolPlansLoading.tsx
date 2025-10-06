import AllowlistToolLoader, {
  AllowlistToolLoaderSize,
} from "@/components/allowlist-tool/common/AllowlistToolLoader";

export default function DistributionPlanToolPlansLoading() {
  return (
    <div className="tw-text-center">
      <AllowlistToolLoader size={AllowlistToolLoaderSize.LARGE} />
    </div>
  );
}
