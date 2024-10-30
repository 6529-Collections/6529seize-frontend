import { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApiWaveOutcome } from "../../../../generated/models/ApiWaveOutcome";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

interface WaveDetailedRepOutcomeProps {
  readonly outcome: ApiWaveOutcome;
}

const DEFAULT_AMOUNTS_TO_SHOW = 3;

export const WaveDetailedRepOutcome: FC<WaveDetailedRepOutcomeProps> = ({
  outcome,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const winnersCount = outcome.distribution?.filter((d) => !!d).length ?? 0;
  const totalCount = outcome.distribution?.length ?? 0;
  const [showAll, setShowAll] = useState(false);

  const getAmounts = (): number[] => {
    if (showAll) {
      return outcome.distribution?.map((d) => d ?? 0) ?? [];
    }
    return outcome.distribution?.slice(0, DEFAULT_AMOUNTS_TO_SHOW) ?? [];
  };
  const [amounts, setAmounts] = useState<number[]>(getAmounts());

  useEffect(() => {
    setAmounts(getAmounts());
  }, [showAll]);

  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-300 hover:tw-border-iron-700/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-border-0 tw-w-full tw-px-4 tw-py-3 tw-flex tw-flex-col tw-bg-iron-900/80 tw-transition-colors tw-duration-300 hover:tw-bg-iron-800/50 group"
      >
        <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-rounded-lg tw-bg-[#75E0A7]/5">
              <svg
                className="tw-size-5 tw-text-[#ABEFC6]"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_4054_1029)">
                  <path
                    d="M14.8483 16.2358C15.7808 15.4333 16.3723 14.2452 16.3723 12.9213V12.6908C16.3723 10.2798 14.4108 8.31836 11.9998 8.31836C9.58884 8.31836 7.62735 10.2798 7.62735 12.6908V12.9213C7.62735 14.2452 8.21882 15.4334 9.15131 16.2358C6.14047 17.1605 3.94531 19.9671 3.94531 23.277C3.94531 23.6583 4.25441 23.9674 4.63569 23.9674H19.3639C19.7452 23.9674 20.0543 23.6583 20.0543 23.277C20.0543 19.9671 17.8592 17.1605 14.8483 16.2358ZM9.00815 12.9214V12.6909C9.00815 11.0412 10.3502 9.69921 11.9998 9.69921C13.6494 9.69921 14.9915 11.0413 14.9915 12.6909V12.9214C14.9915 14.571 13.6494 15.913 11.9998 15.913C10.3502 15.913 9.00815 14.5709 9.00815 12.9214ZM5.36567 22.5866C5.70894 19.6113 8.24362 17.2937 11.3094 17.2937H12.6902C15.756 17.2937 18.2907 19.6113 18.634 22.5867L5.36567 22.5866Z"
                    fill="currentColor"
                  />
                  <path
                    d="M15.6817 2.70799C15.6127 2.49574 15.4454 2.3299 15.2326 2.26282L13.5726 1.73974L12.5622 0.322751C12.4326 0.14111 12.2232 0.0332031 12 0.0332031C11.7769 0.0332031 11.5675 0.14111 11.4379 0.322751L10.4275 1.73983L8.76757 2.26291C8.55471 2.33004 8.38746 2.49583 8.31846 2.70808C8.24951 2.92024 8.28738 3.15279 8.42013 3.33213L9.4556 4.73098L9.44013 6.47136C9.43817 6.69448 9.54415 6.90481 9.72471 7.03606C9.8442 7.12287 9.98656 7.16787 10.1306 7.16787C10.2042 7.16787 10.2781 7.15611 10.3497 7.13215L12.0001 6.57964L13.6505 7.13211C13.8621 7.20312 14.0949 7.16722 14.2754 7.03597C14.456 6.90481 14.562 6.69443 14.56 6.47126L14.5445 4.73088L15.58 3.33204C15.7128 3.15274 15.7506 2.92024 15.6817 2.70799ZM13.2971 4.09526C13.2079 4.21582 13.1603 4.36216 13.1617 4.51216L13.1706 5.51543L12.2192 5.19692C12.1481 5.17306 12.074 5.1612 12 5.1612C11.9259 5.1612 11.8519 5.1731 11.7808 5.19692L10.8294 5.51543L10.8383 4.51212C10.8396 4.36216 10.7921 4.21582 10.7028 4.09526L10.1059 3.28882L11.0629 2.98727C11.2059 2.94222 11.3304 2.85176 11.4175 2.7296L12 1.91271L12.5825 2.7296C12.6696 2.85171 12.7941 2.94213 12.9371 2.98727L13.8941 3.28882L13.2971 4.09526Z"
                    fill="currentColor"
                  />
                  <path
                    d="M23.9663 4.78026C23.8973 4.56805 23.73 4.40221 23.5172 4.33513L21.8573 3.8121L20.8469 2.39502C20.7173 2.21338 20.5079 2.10547 20.2847 2.10547C20.0616 2.10547 19.8522 2.21338 19.7226 2.39502L18.7122 3.8121L17.0523 4.33513C16.8394 4.40221 16.6721 4.568 16.6032 4.78026C16.5342 4.99246 16.572 5.22501 16.7048 5.40435L17.7403 6.80324L17.7248 8.54362C17.7228 8.76679 17.8288 8.97712 18.0094 9.10833C18.19 9.23958 18.4227 9.2752 18.6344 9.20451L20.2847 8.65204L21.9351 9.20451C22.0067 9.22851 22.0807 9.24019 22.1542 9.24019C22.2982 9.24019 22.4406 9.19514 22.5601 9.10833C22.7406 8.97717 22.8466 8.76679 22.8446 8.54362L22.8292 6.80324L23.8646 5.40435C23.9974 5.22501 24.0353 4.99246 23.9663 4.78026ZM21.5819 6.16748C21.4927 6.28809 21.4451 6.43443 21.4464 6.58443L21.4553 7.58774L20.5039 7.26918C20.4328 7.24537 20.3587 7.23351 20.2847 7.23351C20.2106 7.23351 20.1366 7.24542 20.0655 7.26918L19.1141 7.58774L19.123 6.58443C19.1243 6.43443 19.0768 6.28813 18.9876 6.16748L18.3906 5.36108L19.3475 5.05954C19.4906 5.01449 19.6151 4.92402 19.7021 4.80186L20.2846 3.98497L20.8672 4.80186C20.9542 4.92397 21.0787 5.0144 21.2218 5.05954L22.1787 5.36108L21.5819 6.16748Z"
                    fill="currentColor"
                  />
                  <path
                    d="M7.397 4.78021C7.32805 4.568 7.16075 4.40216 6.94794 4.33508L5.28804 3.81205L4.27751 2.39502C4.14795 2.21338 3.93856 2.10547 3.71538 2.10547C3.49221 2.10547 3.28282 2.21338 3.15326 2.39502L2.14282 3.8121L0.482877 4.33513C0.270017 4.40221 0.102767 4.568 0.0338138 4.78026C-0.0351864 4.99246 0.00273558 5.22501 0.135486 5.40435L1.17096 6.80324L1.15549 8.54362C1.15352 8.76675 1.2595 8.97708 1.44007 9.10828C1.62063 9.23953 1.85346 9.2752 2.06505 9.20447L3.71543 8.652L5.36581 9.20447C5.43729 9.22837 5.51126 9.24009 5.58486 9.24009C5.72881 9.24009 5.87122 9.19504 5.9907 9.10823C6.17122 8.97708 6.27725 8.7667 6.27528 8.54358L6.25981 6.8032L7.29528 5.4043C7.42808 5.22501 7.466 4.99246 7.397 4.78021ZM5.01251 6.16752C4.92331 6.28809 4.87573 6.43443 4.87704 6.58438L4.88595 7.58774L3.93452 7.26918C3.86341 7.24537 3.7894 7.23351 3.71534 7.23351C3.64127 7.23351 3.56731 7.24542 3.49615 7.26918L2.54472 7.58774L2.55363 6.58438C2.55499 6.43443 2.50741 6.28809 2.41816 6.16752L1.82121 5.36113L2.77816 5.05958C2.92123 5.01454 3.04573 4.92407 3.13277 4.80191L3.71529 3.98502L4.29781 4.80191C4.3849 4.92402 4.5094 5.01444 4.65242 5.05958L5.60937 5.36113L5.01251 6.16752Z"
                    fill="currentColor"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_4054_1029">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="tw-flex tw-flex-col">
              <span className="tw-text-iron-50 tw-text-sm tw-font-medium">
                {formatNumberWithCommas(outcome.amount ?? 0)} Rep
              </span>
              <span className="tw-text-xs tw-font-medium tw-text-[#ABEFC6]">
                {formatNumberWithCommas(winnersCount)} winners
              </span>
            </div>
          </div>
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="tw-flex-shrink-0 tw-size-4 tw-text-iron-400 tw-transition-transform tw-duration-300"
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </motion.svg>
        </div>
        <div className="tw-mt-2 tw-text-iron-300 tw-text-sm tw-text-left tw-break-words tw-line-clamp-3">
          {outcome.rep_category}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="tw-overflow-hidden"
          >
            <div className="tw-divide-y tw-divide-iron-900 tw-divide-solid tw-divide-x-0">
              {amounts.map((amount, i) => (
                <div
                  key={`wave-detailed-rep-outcome-row-${i}`}
                  className="tw-px-4 tw-py-2 tw-bg-iron-900/30"
                >
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <span className="tw-flex tw-items-center tw-justify-center tw-size-6 tw-rounded-full tw-bg-[#75E0A7]/5 tw-text-[#ABEFC6] tw-text-xs tw-font-medium">
                      {i + 1}
                    </span>
                    <span className="tw-whitespace-nowrap tw-text-[#ABEFC6] tw-text-sm tw-font-medium">
                      {formatNumberWithCommas(amount)} Rep
                    </span>
                  </div>
                </div>
              ))}

              {totalCount > DEFAULT_AMOUNTS_TO_SHOW && !showAll && (
                <button
                  className="tw-border-0 tw-w-full tw-px-4 tw-py-2 tw-text-left tw-bg-iron-900/20 tw-text-primary-300/80 tw-text-xs hover:tw-text-primary-300 tw-transition-colors tw-duration-200 hover:tw-bg-iron-900/30"
                  onClick={() => setShowAll(true)}
                >
                  <span>View more</span>
                  <span className="tw-ml-1 tw-text-iron-400">•</span>
                  <span className="tw-ml-1 tw-text-iron-400">
                    {totalCount - DEFAULT_AMOUNTS_TO_SHOW} more
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // {/* Rep Outcome Card */}
  // <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-900 tw-transition-all tw-duration-200 hover:tw-border-iron-700/50">
  //   <button
  //     type="button"
  //     className="tw-border-0 tw-w-full tw-px-4 tw-py-3 tw-flex tw-flex-col tw-bg-iron-900/50 tw-transition-colors tw-duration-200 hover:tw-bg-iron-900 group"
  //   >
  //     <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
  //       <div className="tw-flex tw-items-center tw-gap-3">
  //         <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-rounded-lg tw-bg-[#75E0A7]/5">
  //           <svg
  //             className="tw-size-5 tw-text-[#ABEFC6]"
  //             viewBox="0 0 24 24"
  //             fill="none"
  //             xmlns="http://www.w3.org/2000/svg"
  //           >
  //             <g clip-path="url(#clip0_4054_1029)">
  //               <path
  //                 d="M14.8483 16.2358C15.7808 15.4333 16.3723 14.2452 16.3723 12.9213V12.6908C16.3723 10.2798 14.4108 8.31836 11.9998 8.31836C9.58884 8.31836 7.62735 10.2798 7.62735 12.6908V12.9213C7.62735 14.2452 8.21882 15.4334 9.15131 16.2358C6.14047 17.1605 3.94531 19.9671 3.94531 23.277C3.94531 23.6583 4.25441 23.9674 4.63569 23.9674H19.3639C19.7452 23.9674 20.0543 23.6583 20.0543 23.277C20.0543 19.9671 17.8592 17.1605 14.8483 16.2358ZM9.00815 12.9214V12.6909C9.00815 11.0412 10.3502 9.69921 11.9998 9.69921C13.6494 9.69921 14.9915 11.0413 14.9915 12.6909V12.9214C14.9915 14.571 13.6494 15.913 11.9998 15.913C10.3502 15.913 9.00815 14.5709 9.00815 12.9214ZM5.36567 22.5866C5.70894 19.6113 8.24362 17.2937 11.3094 17.2937H12.6902C15.756 17.2937 18.2907 19.6113 18.634 22.5867L5.36567 22.5866Z"
  //                 fill="currentColor"
  //               />
  //               <path
  //                 d="M15.6817 2.70799C15.6127 2.49574 15.4454 2.3299 15.2326 2.26282L13.5726 1.73974L12.5622 0.322751C12.4326 0.14111 12.2232 0.0332031 12 0.0332031C11.7769 0.0332031 11.5675 0.14111 11.4379 0.322751L10.4275 1.73983L8.76757 2.26291C8.55471 2.33004 8.38746 2.49583 8.31846 2.70808C8.24951 2.92024 8.28738 3.15279 8.42013 3.33213L9.4556 4.73098L9.44013 6.47136C9.43817 6.69448 9.54415 6.90481 9.72471 7.03606C9.8442 7.12287 9.98656 7.16787 10.1306 7.16787C10.2042 7.16787 10.2781 7.15611 10.3497 7.13215L12.0001 6.57964L13.6505 7.13211C13.8621 7.20312 14.0949 7.16722 14.2754 7.03597C14.456 6.90481 14.562 6.69443 14.56 6.47126L14.5445 4.73088L15.58 3.33204C15.7128 3.15274 15.7506 2.92024 15.6817 2.70799ZM13.2971 4.09526C13.2079 4.21582 13.1603 4.36216 13.1617 4.51216L13.1706 5.51543L12.2192 5.19692C12.1481 5.17306 12.074 5.1612 12 5.1612C11.9259 5.1612 11.8519 5.1731 11.7808 5.19692L10.8294 5.51543L10.8383 4.51212C10.8396 4.36216 10.7921 4.21582 10.7028 4.09526L10.1059 3.28882L11.0629 2.98727C11.2059 2.94222 11.3304 2.85176 11.4175 2.7296L12 1.91271L12.5825 2.7296C12.6696 2.85171 12.7941 2.94213 12.9371 2.98727L13.8941 3.28882L13.2971 4.09526Z"
  //                 fill="currentColor"
  //               />
  //               <path
  //                 d="M23.9663 4.78026C23.8973 4.56805 23.73 4.40221 23.5172 4.33513L21.8573 3.8121L20.8469 2.39502C20.7173 2.21338 20.5079 2.10547 20.2847 2.10547C20.0616 2.10547 19.8522 2.21338 19.7226 2.39502L18.7122 3.8121L17.0523 4.33513C16.8394 4.40221 16.6721 4.568 16.6032 4.78026C16.5342 4.99246 16.572 5.22501 16.7048 5.40435L17.7403 6.80324L17.7248 8.54362C17.7228 8.76679 17.8288 8.97712 18.0094 9.10833C18.19 9.23958 18.4227 9.2752 18.6344 9.20451L20.2847 8.65204L21.9351 9.20451C22.0067 9.22851 22.0807 9.24019 22.1542 9.24019C22.2982 9.24019 22.4406 9.19514 22.5601 9.10833C22.7406 8.97717 22.8466 8.76679 22.8446 8.54362L22.8292 6.80324L23.8646 5.40435C23.9974 5.22501 24.0353 4.99246 23.9663 4.78026ZM21.5819 6.16748C21.4927 6.28809 21.4451 6.43443 21.4464 6.58443L21.4553 7.58774L20.5039 7.26918C20.4328 7.24537 20.3587 7.23351 20.2847 7.23351C20.2106 7.23351 20.1366 7.24542 20.0655 7.26918L19.1141 7.58774L19.123 6.58443C19.1243 6.43443 19.0768 6.28813 18.9876 6.16748L18.3906 5.36108L19.3475 5.05954C19.4906 5.01449 19.6151 4.92402 19.7021 4.80186L20.2846 3.98497L20.8672 4.80186C20.9542 4.92397 21.0787 5.0144 21.2218 5.05954L22.1787 5.36108L21.5819 6.16748Z"
  //                 fill="currentColor"
  //               />
  //               <path
  //                 d="M7.397 4.78021C7.32805 4.568 7.16075 4.40216 6.94794 4.33508L5.28804 3.81205L4.27751 2.39502C4.14795 2.21338 3.93856 2.10547 3.71538 2.10547C3.49221 2.10547 3.28282 2.21338 3.15326 2.39502L2.14282 3.8121L0.482877 4.33513C0.270017 4.40221 0.102767 4.568 0.0338138 4.78026C-0.0351864 4.99246 0.00273558 5.22501 0.135486 5.40435L1.17096 6.80324L1.15549 8.54362C1.15352 8.76675 1.2595 8.97708 1.44007 9.10828C1.62063 9.23953 1.85346 9.2752 2.06505 9.20447L3.71543 8.652L5.36581 9.20447C5.43729 9.22837 5.51126 9.24009 5.58486 9.24009C5.72881 9.24009 5.87122 9.19504 5.9907 9.10823C6.17122 8.97708 6.27725 8.7667 6.27528 8.54358L6.25981 6.8032L7.29528 5.4043C7.42808 5.22501 7.466 4.99246 7.397 4.78021ZM5.01251 6.16752C4.92331 6.28809 4.87573 6.43443 4.87704 6.58438L4.88595 7.58774L3.93452 7.26918C3.86341 7.24537 3.7894 7.23351 3.71534 7.23351C3.64127 7.23351 3.56731 7.24542 3.49615 7.26918L2.54472 7.58774L2.55363 6.58438C2.55499 6.43443 2.50741 6.28809 2.41816 6.16752L1.82121 5.36113L2.77816 5.05958C2.92123 5.01454 3.04573 4.92407 3.13277 4.80191L3.71529 3.98502L4.29781 4.80191C4.3849 4.92402 4.5094 5.01444 4.65242 5.05958L5.60937 5.36113L5.01251 6.16752Z"
  //                 fill="currentColor"
  //               />
  //             </g>
  //             <defs>
  //               <clipPath id="clip0_4054_1029">
  //                 <rect width="24" height="24" fill="white" />
  //               </clipPath>
  //             </defs>
  //           </svg>
  //         </div>
  //         <div className="tw-flex tw-items-center tw-gap-x-2">
  //           <span className="tw-text-iron-50 tw-text-sm tw-font-medium">
  //             1k Rep
  //           </span>
  //           <span className="tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-rounded-md tw-bg-[#75E0A7]/10 tw-text-[#ABEFC6]">
  //             Rank 11-20
  //           </span>
  //         </div>
  //       </div>
  //       <svg
  //         xmlns="http://www.w3.org/2000/svg"
  //         fill="none"
  //         viewBox="0 0 24 24"
  //         strokeWidth="2"
  //         stroke="currentColor"
  //         className="tw-flex-shrink-0 tw-size-4 tw-text-iron-400 tw-transition-transform tw-duration-200 group-hover:tw-text-iron-300"
  //       >
  //         <path
  //           strokeLinecap="round"
  //           strokeLinejoin="round"
  //           d="m19.5 8.25-7.5 7.5-7.5-7.5"
  //         />
  //       </svg>
  //     </div>
  //     <div className="tw-mt-2 tw-text-iron-300 tw-text-sm tw-text-left tw-break-words">
  //       Memes of month January
  //     </div>
  //   </button>

  //   <div className="tw-divide-y tw-divide-iron-900 tw-divide-solid tw-divide-x-0">
  //     <div className="tw-px-4 tw-py-2 tw-bg-iron-900/30">
  //       <div className="tw-flex tw-items-center tw-gap-3">
  //         <span className="tw-flex tw-items-center tw-justify-center tw-size-6 tw-rounded-full tw-bg-[#75E0A7]/5 tw-text-[#ABEFC6] tw-text-xs tw-font-medium">
  //           1
  //         </span>
  //         <span className="tw-whitespace-nowrap tw-text-[#ABEFC6] tw-text-sm tw-font-medium">
  //           300 Rep
  //         </span>
  //       </div>
  //     </div>

  //     <div className="tw-px-4 tw-py-2 tw-bg-iron-900/30">
  //       <div className="tw-flex tw-items-center tw-gap-3">
  //         <span className="tw-flex tw-items-center tw-justify-center tw-size-6 tw-rounded-full tw-bg-[#75E0A7]/5 tw-text-[#ABEFC6] tw-text-xs tw-font-medium">
  //           2
  //         </span>
  //         <span className="tw-whitespace-nowrap tw-text-[#ABEFC6] tw-text-sm tw-font-medium">
  //           150 Rep
  //         </span>
  //       </div>
  //     </div>

  //     <div className="tw-px-4 tw-py-2 tw-bg-iron-900/30">
  //       <div className="tw-flex tw-items-center tw-gap-3">
  //         <span className="tw-flex tw-items-center tw-justify-center tw-size-6 tw-rounded-full tw-bg-[#75E0A7]/5 tw-text-[#ABEFC6] tw-text-xs tw-font-medium">
  //           3
  //         </span>
  //         <span className="tw-whitespace-nowrap tw-text-[#ABEFC6] tw-text-sm tw-font-medium">
  //           75 Rep
  //         </span>
  //       </div>
  //     </div>

  //     <button className="tw-border-0 tw-w-full tw-px-4 tw-py-2 tw-text-left tw-bg-iron-900/20 tw-text-primary-300/80 tw-text-xs hover:tw-text-primary-300 tw-transition-colors tw-duration-200 hover:tw-bg-iron-900/30">
  //       View more
  //       <span className="tw-ml-1 tw-text-iron-400">•</span>
  //       <span className="tw-ml-1 tw-text-iron-400">7 more</span>
  //     </button>
  //   </div>
  // </div>;
};
