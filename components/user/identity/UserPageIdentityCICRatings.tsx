export default function CICRatings() {
  return (
    <div className="tw-bg-neutral-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <div className="tw-h-16 tw-px-8">
        <div className="tw-h-full tw-flex tw-items-center tw-justify-between tw-w-full tw-border-b tw-border-t-0 tw-border-x-0 tw-border-solid tw-border-[#333333]">
          <h3 className="mb-0 tw-text-lg tw-font-semibold tw-text-neutral-50 tw-tracking-tight">
            CIC Ratings of <span>Simo&apos;s</span>
          </h3>
        </div>
      </div>
      <div className="tw-max-h-[28rem] tw-transform-gpu tw-scroll-py-3 tw-overflow-y-auto">
        <ul
          role="list"
          className="tw-px-8 tw-list-none tw-divide-y tw-divide-white/5 tw-divide-solid tw-divide-x-0"
        >
           <li className="tw-py-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
              <div className="tw-inline-flex tw-items-center tw-space-x-3">
                <span className="tw-relative">
                  <div className="tw-flex tw-items-center tw-justify-center tw-h-5 tw-w-5 tw-text-[0.625rem] tw-leading-3 tw-font-bold tw-rounded-full tw-ring-2 tw-ring-neutral-300 tw-text-neutral-300">
                    50
                  </div>
                  <span className="tw-absolute -tw-right-1 -tw-top-1 tw-block tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-green"></span>
                </span>
                <div className="tw-inline-flex tw-space-x-1 5">
                  <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
                    Tarmo
                  </span>
                  <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
                    rated
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-green">
                    +10000
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-red">
                    -10000
                  </span>
                </div>
              </div>
              <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
                <span>1h</span>
                <span className="tw-ml-1">ago</span>
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
