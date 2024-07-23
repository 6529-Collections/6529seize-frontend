import Link from "next/link";
import { IFeedItemDropCommented } from "../../../../../types/feed.types";
import DropAuthor from "../../../../drops/create/utils/author/DropAuthor";
import DropPfp from "../../../../drops/create/utils/DropPfp";
import DropPart, { DropPartSize } from "../../../../drops/view/part/DropPart";
import RateClapOutlineIcon from "../../../../utils/icons/RateClapOutlineIcon";

export default function FeedItemDropCommented({
  item,
}: {
  readonly item: IFeedItemDropCommented;
}) {
  return (
    <div className="tw-flex tw-gap-x-3">
      <div className="tw-mt-0.5 tw-flex-1 tw-space-y-2">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <div className="md:tw-absolute md:-tw-left-10 tw-flex-shrink-0 tw-h-8 tw-w-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          </div>

          <div className="tw-flex tw-gap-x-3">
            <div className="tw-h-6 tw-w-6">
              <img
                src="#"
                alt="#"
                className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
              />
            </div>
            <span className="tw-text-sm tw-font-medium tw-text-iron-50">
              <span className="tw-font-semibold">
                {item.item.comment.author.handle}
              </span>{" "}
              commented
            </span>
          </div>
        </div>

        <div className="tw-relative tw-bg-iron-900 tw-rounded-[14px] tw-border tw-border-solid tw-border-iron-800 tw-cursor-pointer">
          <div className="tw-w-[672px] tw-py-2 sm:tw-py-3">
            <div className="tw-relative tw-h-full tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
              <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
                <div className="tw-space-y-6 tw-h-full">
                  <div className="tw-flex tw-w-full tw-h-full">
                    <div className="tw-flex tw-flex-col tw-justify-between tw-h-full tw-w-full tw-relative">
                      <div className="tw-flex-1 tw-px-4 tw-relative tw-z-20">
                        <div className="tw-relative tw-overflow-y-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out">
                          <div className="tw-flex tw-gap-x-3 tw-h-full">
                            <div className="tw-flex tw-flex-col tw-w-full tw-h-full tw-self-center sm:tw-self-start">
                              {/*   <div className="tw-flex tw-gap-x-3">
                                <DropPfp
                                  pfpUrl={item.item.comment.author.pfp}
                                />
                                <div className="tw-w-full tw-h-10 tw-flex tw-flex-col tw-justify-between">
                                  <DropAuthor
                                    profile={item.item.comment.author}
                                    timestamp={item.item.comment.created_at}
                                  ></DropAuthor>
                                  <div>
                                    <Link
                                      onClick={(e) => e.stopPropagation()}
                                      href={`/waves/${item.item.drop.wave.id}`}
                                      className="tw-flex tw-items-center tw-gap-x-2 tw-mb-0 tw-pb-0 tw-no-underline tw-text-xs tw-text-iron-400 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
                                    >
                                      <span>{item.item.drop.wave.name}</span>
                                    </Link>
                                  </div>
                                </div>
                              </div> */}
                              <div className="tw-h-full">
                                <div className="tw-w-full tw-inline-flex tw-justify-between tw-space-x-2">
                                  <div className="tw-h-full tw-w-full">
                                    {item.item.comment.comment}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="tw-mt-2 tw-px-4 tw-pb-4 tw-pt-1 tw-border-iron-700 tw-rounded-lg tw-border tw-border-solid">
                            <DropPart
                              profile={item.item.drop.author}
                              mentionedUsers={item.item.drop.mentioned_users}
                              referencedNfts={item.item.drop.referenced_nfts}
                              partContent={
                                item.item.drop.parts[0].content ?? null
                              }
                              smallMenuIsShown={false}
                              partMedia={
                                item.item.drop.parts[0].media.length
                                  ? {
                                      mimeType:
                                        item.item.drop.parts[0].media[0]
                                          .mime_type,
                                      mediaSrc:
                                        item.item.drop.parts[0].media[0].url,
                                    }
                                  : null
                              }
                              showFull={false}
                              createdAt={item.item.drop.created_at}
                              dropTitle={item.item.drop.title}
                              wave={{
                                name: item.item.drop.wave.name,
                                image: item.item.drop.wave.picture,
                                id: item.item.drop.wave.id,
                              }}
                              size={DropPartSize.SMALL}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
