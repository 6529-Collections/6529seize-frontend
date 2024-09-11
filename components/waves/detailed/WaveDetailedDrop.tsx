import WaveDetailedDropActions from "../WaveDetailedDropActions";
import WaveDetailedDropReply from "../WaveDetailedDropReply";

export default function WaveDetailedDrop() {
  return (
    <div className="tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-p-2">
      <WaveDetailedDropReply />

      <div className="tw-flex tw-gap-x-3">
        <div className="tw-h-10 tw-w-10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
          <div className="tw-rounded-lg tw-h-full tw-w-full">
            <div className="tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900">
              <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
                <img
                  src="#"
                  alt=""
                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="-tw-mt-0.5 tw-flex tw-flex-col">
          <div className="tw-flex tw-items-center">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <div className="tw-relative">
                <div className="tw-h-5 tw-w-5 tw-text-[9px] tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-border-2 tw-border-solid tw-border-[#284A87] tw-text-iron-300">
                  32
                </div>
                <span className="-tw-top-[0.1875rem] tw-h-2 tw-w-2 tw-bg-[#3CCB7F] tw-flex-shrink-0 tw-absolute -tw-right-1 tw-block tw-rounded-full"></span>
              </div>

              <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                <a
                  href=""
                  className="tw-no-underline hover:tw-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
                >
                  John Doe
                </a>
              </p>
            </div>
            <button
              type="button"
              className="tw-text-iron-500 hover:tw-text-iron-50 tw-flex tw-border-none tw-bg-transparent tw-py-2.5 tw-px-2.5 tw-rounded-full tw-m-0 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-h-3 tw-w-3"
                width="17"
                height="15"
                viewBox="0 0 17 15"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
                  fill="currentColor"
                ></path>
              </svg>
            </button>
            <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
              5h
            </p>
          </div>
          <span className="tw-text-[11px] tw-leading-0 -tw-mt-1 tw-text-iron-500">
            Wave name
          </span>

          <div className="tw-mt-1">
            <p className="last:tw-mb-0 tw-leading-5 tw-text-iron-200 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break tw-transition tw-duration-300 tw-ease-out tw-text-md">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit.
            </p>
          </div>
        </div>
      </div>

      <WaveDetailedDropActions />

      <div className="tw-flex tw-justify-end">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-flex tw-items-center -tw-space-x-2">
            <img
              src=""
              alt=""
              className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-700"
            />
          </div>
          <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
            13 raters
          </span>
          <div className="tw-h-1 tw-w-1 tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
            8 ratings
          </span>
        </div>
      </div>
    </div>
  );
}
