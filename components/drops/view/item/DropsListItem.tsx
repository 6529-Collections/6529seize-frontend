import Link from "next/link";
import { DropFull } from "../../../../entities/IDrop";
import { getTimeAgo } from "../../../../helpers/Helpers";
import DropPfp from "../../create/utils/DropPfp";
import DropListItemContent from "./content/DropListItemContent";
import { useRouter } from "next/router";
import DropListItemDiscussion from "./discussion/DropListItemDiscussion";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function DropsListItem({ drop }: { readonly drop: DropFull }) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string)?.toLowerCase();
  const isMyDrop = drop.author.handle.toLowerCase() === handleOrWallet;
  const [discussionOpen, setDiscussionOpen] = useState<boolean>(false);
  const [showMoreOpen, setShowMoreOpen] = useState<boolean>(false);

  return (
    <div className="tw-border-solid tw-border tw-border-iron-800 tw-rounded-xl tw-bg-iron-900">
      <div className="tw-p-4 sm:tw-p-5">
        <div className="tw-flex tw-gap-x-3">
          <DropPfp pfpUrl={drop.author.pfp} />
          <div className="tw-flex tw-flex-col tw-w-full">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              {isMyDrop ? (
                <p className="tw-mb-0 tw-text-md tw-leading-none tw-font-semibold tw-text-iron-50">
                  {drop.author.handle}
                </p>
              ) : (
                <p className="tw-mb-0 tw-text-md tw-leading-none tw-font-semibold tw-text-iron-50">
                  <Link
                    href={`/${drop.author.handle}`}
                    className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
                  >
                    {drop.author.handle}
                  </Link>
                </p>
              )}
              <span className="tw-text-iron-500">&bull;</span>
              <p className="tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-text-md tw-leading-none tw-text-iron-500">
                {getTimeAgo(drop.created_at)}
              </p>
            </div>
            <div className="tw-mt-1 tw-w-full">
              <DropListItemContent drop={drop} />
            </div>
          </div>
        </div>
        <div className="tw-mt-2 tw-ml-[3.25rem]">
          <button
            onClick={() => setShowMoreOpen(!showMoreOpen)}
            type="button"
            className={`${
              showMoreOpen ? "tw-text-primary-400" : ""
            } tw-group tw-text-iron-400 hover:tw-text-primary-400 tw-bg-transparent tw-rounded-lg tw-border-none tw-flex tw-items-center tw-gap-x-1 -tw-ml-2 tw-px-2 tw-py-1 tw-transition tw-ease-out tw-duration-300`}
          >
            <p className="tw-text-xxs tw-font-medium tw-mb-0">Show more</p>
            <svg
              className={`${
                showMoreOpen ? "tw-rotate-90" : ""
              } -tw-mr-1 tw-transform tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <AnimatePresence mode="wait" initial={false}>
            {showMoreOpen && (
              <motion.div
                key={drop.id}
                initial={{ height: "0", opacity: 0 }}
                animate={{
                  height: "auto",
                  opacity: 1,
                  transition: {
                    height: { duration: 0.3 },
                    opacity: { duration: 0.3, delay: 0.3 },
                  },
                }}
                exit={{
                  height: "0",
                  opacity: 0,
                  transition: {
                    opacity: { duration: 0 },
                    height: { duration: 0.3 },
                  },
                }}
              >
                <div className="tw-space-y-1">
                  <div>
                    <p className="tw-mb-0 tw-text-xxs tw-text-iron-500 tw-font-normal">
                      Profiles mentioned
                    </p>
                    <ul className="tw-pl-0 tw-mb-0 tw-inline-flex tw-list-none tw-gap-x-1 tw-text-xxs tw-text-iron-50 tw-font-medium">
                      <li>Brrokr</li>
                    </ul>
                  </div>
                  <div>
                    <p className="tw-mb-0 tw-text-xxs tw-text-iron-500 tw-font-normal">
                      Metadata
                    </p>
                    <ul className="tw-pl-0 tw-mb-0 tw-inline-flex tw-list-none tw-gap-x-1 tw-text-xxs tw-text-iron-50 tw-font-medium">
                      <li>
                        <span className="tw-text-iron-300 tw-font-normal">
                          Collection:
                        </span>{" "}
                        <span>Meme Court</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="tw-mt-4 tw-ml-12 tw-border-t tw-flex tw-items-center tw-justify-between tw-gap-x-8">
          <button
            onClick={() => setDiscussionOpen(!discussionOpen)}
            type="button"
            className="tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition tw-ease-out tw-duration-300"
          >
            <svg
              className="tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 group-hover:tw-text-primary-400 tw-transition tw-ease-out tw-duration-300"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.09436 11.2288C6.03221 10.8282 5.99996 10.4179 5.99996 10C5.99996 5.58172 9.60525 2 14.0526 2C18.4999 2 22.1052 5.58172 22.1052 10C22.1052 10.9981 21.9213 11.9535 21.5852 12.8345C21.5154 13.0175 21.4804 13.109 21.4646 13.1804C21.4489 13.2512 21.4428 13.301 21.4411 13.3735C21.4394 13.4466 21.4493 13.5272 21.4692 13.6883L21.8717 16.9585C21.9153 17.3125 21.9371 17.4895 21.8782 17.6182C21.8266 17.731 21.735 17.8205 21.6211 17.8695C21.4911 17.9254 21.3146 17.8995 20.9617 17.8478L17.7765 17.3809C17.6101 17.3565 17.527 17.3443 17.4512 17.3448C17.3763 17.3452 17.3245 17.3507 17.2511 17.3661C17.177 17.3817 17.0823 17.4172 16.893 17.4881C16.0097 17.819 15.0524 18 14.0526 18C13.6344 18 13.2237 17.9683 12.8227 17.9073M7.63158 22C10.5965 22 13 19.5376 13 16.5C13 13.4624 10.5965 11 7.63158 11C4.66668 11 2.26316 13.4624 2.26316 16.5C2.26316 17.1106 2.36028 17.6979 2.53955 18.2467C2.61533 18.4787 2.65322 18.5947 2.66566 18.6739C2.67864 18.7567 2.68091 18.8031 2.67608 18.8867C2.67145 18.9668 2.65141 19.0573 2.61134 19.2383L2 22L4.9948 21.591C5.15827 21.5687 5.24 21.5575 5.31137 21.558C5.38652 21.5585 5.42641 21.5626 5.50011 21.5773C5.5701 21.5912 5.67416 21.6279 5.88227 21.7014C6.43059 21.8949 7.01911 22 7.63158 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tw-hidden sm:tw-block group-hover:tw-text-primary-400 tw-transition tw-ease-out tw-duration-300">
              Discuss
            </span>
            <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-iron-300 tw-text-xs tw-font-medium">
              39
            </div>
          </button>
          <button
            type="button"
            className="tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-medium tw-text-iron-400"
          >
            <svg
              className="tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 group-hover:tw-text-primary-400 tw-transition tw-ease-out tw-duration-300"
              viewBox="0 0 512 512"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="currentColor"
                d="m123.19 137.32 33.81 33.85c9.51 9.51 25.31 9.74 34.64.05a24 24 0 0 0 -.32-33.61l-74.68-74.78a24.67 24.67 0 0 0 -34.9 0l-74.74 74.76a24 24 0 0 0 34 33.94l34.21-34.21v230a89.16 89.16 0 0 0 89.06 89.06h127.73a24 24 0 0 0 0-48h-127.73a41.11 41.11 0 0 1 -41.06-41.06z"
              ></path>
              <path
                fill="currentColor"
                d="m388.81 374.68-33.81-33.85c-9.51-9.51-25.31-9.74-34.64-.05a24 24 0 0 0 .32 33.61l74.72 74.78a24.67 24.67 0 0 0 34.9 0l74.7-74.76a24 24 0 0 0 -34-33.94l-34.21 34.21v-230a89.16 89.16 0 0 0 -89.06-89.08h-127.73a24 24 0 0 0 0 48h127.73a41.11 41.11 0 0 1 41.06 41.06z"
              ></path>
            </svg>
            <span className="tw-hidden sm:tw-block group-hover:tw-text-primary-400 tw-transition tw-ease-out tw-duration-300">
              Redrop
            </span>
            <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-iron-300 tw-text-xs tw-font-medium">
              45
            </div>
          </button>
          <button
            type="button"
            className="tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-medium tw-text-iron-400"
          >
            <svg
              className="tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 group-hover:tw-text-primary-400 tw-transition tw-ease-out tw-duration-300"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 6H17.8C16.1198 6 15.2798 6 14.638 6.32698C14.0735 6.6146 13.6146 7.07354 13.327 7.63803C13 8.27976 13 9.11984 13 10.8V12M21 6L18 3M21 6L18 9M10 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tw-hidden sm:tw-block group-hover:tw-text-primary-400 tw-transition tw-ease-out tw-duration-300">
              Share
            </span>
            <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-iron-300 tw-text-xs tw-font-medium">
              3
            </div>
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {discussionOpen && (
          <motion.div
            key={drop.id}
            initial={{ height: "0", opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.3 },
                opacity: { duration: 0.3, delay: 0.3 },
              },
            }}
            exit={{
              height: "0",
              opacity: 0,
              transition: {
                opacity: { duration: 0 },
                height: { duration: 0.3 },
              },
            }}
          >
            <DropListItemDiscussion />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
