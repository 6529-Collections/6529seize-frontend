export default function WaveDetailedDropReply() {
  return (
    <div className="tw-mb-4">
      <div className="tw-relative tw-flex tw-justify-end">
        <div className="tw-h-6 tw-absolute tw-top-2.5 tw-left-5 tw-border-iron-700 tw-border-0 tw-border-solid tw-border-t-[1.5px] tw-border-l-[1.5px] tw-cursor-pointer tw-w-6 tw-rounded-tl-[12px]"></div>
      </div>
      <div className="tw-ml-[52px] tw-flex tw-items-center tw-gap-x-1.5 tw-cursor-pointer">
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <div className="tw-h-6 tw-w-6 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
            <div className="tw-rounded-md tw-h-full tw-w-full">
              <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-md tw-overflow-hidden tw-bg-iron-800">
                <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-md tw-overflow-hidden">
                  pfp
                </div>
              </div>
            </div>
          </div>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-200 tw-font-semibold">
            author
          </p>
        </div>
        <div>text</div>
      </div>
    </div>
  );
}
