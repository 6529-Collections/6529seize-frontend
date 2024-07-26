import AllowlistToolLoader, {
  AllowlistToolLoaderSize,
} from "../../allowlist-tool/common/AllowlistToolLoader";

export default function DistributionPlanToolPlansLoading() {
  return (
    <div className="tw-text-center">
      <AllowlistToolLoader size={AllowlistToolLoaderSize.LARGE} />
    </div>
  );
}
