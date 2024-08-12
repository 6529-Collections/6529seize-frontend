import { Drop } from "../../../../generated/models/Drop";
import DropPfp from "../../create/utils/DropPfp";

export default function DropItem({ drop }: { readonly drop: Drop }) {
  return (
    <div>
      {/*  <DropPfp pfpUrl={drop.author.pfp} /> */}

      <div className="tw-flex tw-flex-col tw-gap-y-2">
        <div className="tw-ml-12 tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-flex tw-items-center tw-gap-x-1.5">
            <div className="tw-h-6 tw-w-6 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
              <div className="tw-rounded-lg tw-h-full tw-w-full">
                <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-800">
                  <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
                    <img
                      src="#"
                      alt="Drop Profile"
                      className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
            <span className="tw-text-sm tw-text-iron-50 tw-font-semibold">
              user
            </span>
          </div>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-50 tw-font-normal">
            Lorem ipsum dolor sit amet consectetur adipisicing.
          </p>
        </div>

        <div className="tw-flex tw-items-stretch tw-gap-x-3">
          <div className="tw-flex tw-flex-col tw-gap-y-1">
            <div className="tw-relative tw-flex tw-justify-end tw-mb-1">
              <div className="tw-w-0.5 tw-bg-iron-700 tw-min-h-2.5 tw-left-[49%] tw-absolute -tw-top-2"></div>
             <div className="tw-h-4 tw-absolute -tw-top-6 tw-border-iron-700 tw-border-0 tw-border-solid tw-border-t-[2px] tw-border-l-[2px] tw-cursor-pointer tw-w-[calc(50%+0.5px)] tw-rounded-tl-[12px]"></div>
            </div>
            <div className="tw-h-10 tw-w-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-lg z-10">
              <div className="tw-rounded-lg tw-h-full tw-w-full">
                <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-800">
                  <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
                    <img
                      src="#"
                      alt="Drop Profile"
                      className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="tw-h-full tw-flex tw-flex-col tw-justify-between">
            <div>
              <div>name</div>
              <div>wave</div>
              <div>Lorem ipsum dolor sit amet.</div>
              <div className="tw-flex tw-gap-x-6 tw-pt-4 tw-pb-4">
                <div>reply</div>
                <div>requote</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
