import { Wave } from "../../../generated/models/Wave";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import DropItem from "../../drops/view/item/DropItem";
import DropsListItem from "../../drops/view/item/DropsListItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";

export default function WavesListWrapper({
  waves,
  loading,
  availableCredit,
  onBottomIntersection,
}: {
  readonly waves: Wave[];
  readonly loading: boolean;
  readonly availableCredit: number | null;
  readonly onBottomIntersection: (state: boolean) => void;
}) {
  return (
    <div className="tw-overflow-hidden">
      <div className="tw-mt-2 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4">



        <div className="tw-pb-4 tw-relative tw-bg-iron-900 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800">
          <div className="tw-relative tw-w-full tw-h-10 tw-rounded-t-xl tw-bg-gradient-to-tr tw-from-white tw-to-transparent"></div>
          <div className="-tw-mt-4 tw-flex-shrink-0 tw-px-4">
            <div className="tw-h-10 tw-w-10">
              <img
                className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-border-[3px] tw-border-solid tw-border-iron-900"
                src="#"
                alt="#"
              />
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-between tw-px-4">
            <span className="tw-text-lg tw-font-semibold tw-text-white">
              Welcome n00bs
            </span>
            <button
              type="button"
              className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              <span>Join</span>
            </button>
          </div>
          <div className="tw-mt-4 tw-px-4 tw-flex tw-items-center tw-gap-x-3">
            <div className="tw-px-4 tw-py-4 tw-w-full tw-rounded-lg tw-bg-iron-800">
              <div className="tw-flex tw-gap-x-3">
                <img
                  src="#"
                  alt="#"
                  className="tw-flex-shrink-0 tw-bg-iron-800 tw-h-8 tw-w-8 tw-rounded-lg tw-object-contain"
                />
                <div className="tw-flex tw-flex-col tw-gap-y-1">
                  <div className="tw-flex tw-items-center tw-gap-x-4">
                    <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-center">
                      <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold tw-text-iron-50">
                        <a className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
                          simo
                        </a>
                      </p>
                      <div className="tw-relative">
                        <div className="tw-h-4 tw-w-4 tw-text-[9px] tw-flex tw-items-center tw-justify-center tw-leading-3 tw-font-bold tw-rounded-full tw-ring-2 tw-ring-iron-300 tw-text-iron-300">
                          6
                        </div>
                        <span className="-tw-top-[0.1875rem] tw-h-2 tw-w-2 tw-bg-[#FEDF89] tw-flex-shrink-0 tw-absolute -tw-right-1 tw-block tw-rounded-full"></span>
                      </div>
                    </div>
                    <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                      3 days ago
                    </p>
                  </div>
                  <p className="last:tw-mb-0 tw-text-md tw-leading-5 tw-text-iron-50 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break tw-text-balance">
                    Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                    Eum cum temporibus tenetur?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>




        {/* 
        {waves.map((wave) => (
          <DropsListItem
            key={wave.id}
            drop={wave.description_drop}
            isWaveDescriptionDrop={true}
            showWaveInfo={true}
            availableCredit={availableCredit}
          />
        ))} */}
      </div>
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <CommonIntersectionElement onIntersection={onBottomIntersection} />
    </div>
  );
}
