import { Drop } from "../../../../generated/models/Drop";
import DropPfp from "../../create/utils/DropPfp";

export default function DropItem({ drop }: { readonly drop: Drop }) {
  return (
    <div>
      {/*  <DropPfp pfpUrl={drop.author.pfp} /> */}

      <div className="tw-flex tw-items-stretch">
        <div className="tw-flex tw-flex-col tw-flex-grow-0 tw-mr-2">
          <div className="tw-flex tw-items-stretch tw-gap-x-2">
            <div className="tw-flex tw-flex-col tw-flex-grow-0">
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
              <div className="tw-w-0.5 tw-min-h-10 tw-h-full tw-bg-iron-700 tw-my-1 tw-flex-grow tw-mx-auto"></div>
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

          <div className="tw-pb-4 tw-text-iron-400">replying input</div>

          <div className="tw-flex tw-items-stretch tw-gap-x-2">
            <div className="tw-flex tw-flex-col tw-flex-grow-0">
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

              <div className="tw-flex-grow">
                <div className="tw-w-0.5 tw-min-h-10 tw-h-full tw-bg-iron-700 tw-flex-grow tw-mx-auto"></div>
                <div className="tw-flex tw-justify-end tw-relative">
                  <div className="tw-h-4 tw-border-iron-700 tw-border-0 tw-border-solid tw-border-b-[2px] tw-border-l-[2px] tw-cursor-pointer tw-w-[calc(50%+0.5px)] tw-rounded-bl-[12px]"></div>
                  <div className="tw-h-4 tw-border-0 tw-border-iron-700 tw-border-solid tw-border-b-[1px] tw-w-[2px] tw-absolute -tw-right-2"></div>
                </div>
              </div>
            </div>
            <div className="tw-h-full tw-flex tw-flex-col tw-justify-between">
              <div>
                <div>name</div>
                <div>wave</div>
                <div className="tw-text-emerald-600">first level reply</div>
                <div className="tw-flex tw-gap-x-6 tw-pt-4 tw-pb-4">
                  <div>reply</div>
                  <div>requote</div>
                </div>
              </div>
            </div>
          </div>
          <div className="tw-ml-12">
            <div className="tw-flex tw-gap-x-2">
              <div className="tw-flex tw-flex-col tw-flex-grow-0">
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
                  <div className="tw-text-green">second level reply</div>
                  <div className="tw-flex tw-gap-x-6 tw-pt-4 tw-pb-4">
                    <div>reply</div>
                    <div>requote</div>
                  </div>
                </div>
                <div className="tw-text-iron-400">replying input second level</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
