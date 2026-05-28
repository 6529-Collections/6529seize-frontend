import SpinnerLoader from "@/components/common/SpinnerLoader";

export default function Loading() {
  return (
    <div className="tw-flex tw-min-h-[calc(100dvh-85px)] tw-items-center tw-justify-center tw-bg-iron-950">
      <SpinnerLoader text="" ariaLabel="Loading messages" />
    </div>
  );
}
