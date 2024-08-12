import { Drop } from "../../../../generated/models/Drop";
import DropPfp from "../../create/utils/DropPfp";

export default function DropItem({ drop }: { readonly drop: Drop }) {
  return (
    <div>
      {/*  <DropPfp pfpUrl={drop.author.pfp} /> */}

      <div className="tw-flex tw-items-stretch">

        <div className="tw-flex tw-flex-col tw-items-center tw-flex-grow-0 tw-mr-2">

          {/*  PFP starts */}
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
          {/*  PFP ends */}

          <div className="tw-w-0.5 tw-min-h-10 tw-h-full tw-bg-iron-700 tw-my-1 tw-flex-grow tw-mx-auto"></div>

           {/*  PFP starts */}
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
          {/*  PFP ends */}

        </div>

    
      </div>

    </div>
  );
}
