import Link from "next/link";
import { IFeedItemDropVoted } from "../../../../../types/feed.types";
import DropAuthor from "../../../../drops/create/utils/author/DropAuthor";
import DropPfp from "../../../../drops/create/utils/DropPfp";
import DropPart, { DropPartSize } from "../../../../drops/view/part/DropPart";
import {
  formatNumberWithCommas,
  numberWithCommas,
} from "../../../../../helpers/Helpers";
import RateClapOutlineIcon from "../../../../utils/icons/RateClapOutlineIcon";

export default function FeedItemDropVoted({
  item,
}: {
  readonly item: IFeedItemDropVoted;
}) {
  const getVoteColor = (vote: number) => {
    if (vote > 0) {
      return "tw-text-green";
    }
    if (vote < 0) {
      return "tw-text-red";
    }
    return "tw-text-iron-500";
  };

  return (
    <div className="tw-flex tw-gap-x-3">
      <div className="tw-mt-0.5 tw-flex-1 tw-space-y-2">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <div className="md:tw-absolute md:-tw-left-10 tw-flex-shrink-0 tw-h-8 tw-w-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
            <div className="tw-h-[1.15rem] tw-w-[1.15rem] -tw-mt-2.5 tw-text-iron-300">
              <RateClapOutlineIcon />
            </div>
          </div>
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            {item.item.vote.voter.handle} rated
          </span>
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
                          <div className="tw-pt-2 tw-flex tw-gap-x-3 tw-h-full">
                            <div className="tw-flex tw-flex-col tw-w-full tw-h-full tw-self-center sm:tw-self-start">
                              <div className="tw-flex tw-gap-x-3">
                                <DropPfp pfpUrl={item.item.vote.voter.pfp} />
                                <div className="tw-w-full tw-h-10 tw-flex tw-flex-col tw-justify-between">
                                  <DropAuthor
                                    profile={item.item.vote.voter}
                                    timestamp={item.item.drop.created_at}
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
                              </div>
                              <div className="tw-mt-2 tw-h-full">
                                <div className="tw-w-full tw-inline-flex tw-justify-between tw-space-x-2">
                                  <div className="tw-h-full tw-w-full">
                                    {item.item.vote.voter.handle} rated
                                    <span
                                      className={`${getVoteColor(
                                        item.item.vote.vote
                                      )} tw-pl-1 tw-font-medium`}
                                    >
                                      {numberWithCommas(item.item.vote.vote)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="tw-inline-flex tw-items-center tw-gap-x-2 tw-text-xs tw-text-iron-500">
                            <span>
                              <span className="tw-mr-1 tw-text-iron-50 tw-font-medium">
                                {formatNumberWithCommas(
                                  item.item.drop.raters_count
                                )}
                              </span>
                              raters
                            </span>
                            <div className="tw-h-1 tw-w-1 tw-bg-iron-600 tw-rounded-full"></div>
                            <span>
                              <span
                                className={`${getVoteColor(
                                  item.item.drop.rating
                                )} tw-mr-1 tw-font-medium`}
                              >
                                {formatNumberWithCommas(item.item.drop.rating)}
                              </span>
                              total ratings
                            </span>
                          </div>
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

        {/* <div className="tw-relative tw-bg-iron-900 tw-rounded-[14px] tw-border tw-border-solid tw-border-iron-800 tw-cursor-pointer">
          <div className="tw-w-[672px] tw-py-2 sm:tw-py-3">
            <div className="tw-relative tw-h-full tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
              <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
                <div className="tw-space-y-6 tw-h-full">
                  <div className="tw-flex tw-w-full tw-h-full">
                    <div className="tw-flex tw-flex-col tw-justify-between tw-h-full tw-w-full tw-relative">
                      <div className="tw-flex-1 tw-px-4 tw-relative tw-z-20">
                        <div className="tw-relative tw-overflow-y-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out">
                          <div className="tw-pt-2 tw-flex tw-gap-x-3 tw-h-full">
                            <div className="tw-flex tw-flex-col tw-w-full tw-h-full tw-self-center sm:tw-self-start">
                              <div className="tw-flex tw-gap-x-3">
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
                              </div>
                              <div className="tw-mt-2 tw-h-full">
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
        </div> */}
      </div>
    </div>
  );
}
