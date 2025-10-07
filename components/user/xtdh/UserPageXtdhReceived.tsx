"use client";

export default function UserPageXtdhReceived() {
  return (
    <div className="tw-text-sm tw-text-iron-300">
      <span>
        This shows NFTs held by this identity that have received xTDH grants
        from others. Currently, there are no items receiving xTDH.
      </span>
      <span
        className="tw-ml-1 tw-inline-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-700 tw-text-[10px] tw-font-semibold tw-text-iron-100"
        tabIndex={0}
        aria-label="When others grant xTDH to NFT collections, any holder of those NFTs receives xTDH generation capacity"
        title="When others grant xTDH to NFT collections, any holder of those NFTs receives xTDH generation capacity"
      >
        i
      </span>
    </div>
  );
}
