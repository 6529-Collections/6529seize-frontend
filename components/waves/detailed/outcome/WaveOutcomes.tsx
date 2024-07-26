import { Wave } from "../../../../generated/models/Wave";

export default function WaveOutcomes({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-w-full">
      <div className="tw-group">
        <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
          <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <div className="tw-px-4 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
              <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
                Outcome
              </p>
            </div>
            <div className="tw-px-4 tw-py-6 tw-flex tw-flex-col tw-gap-y-6">
              <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                <span className="tw-font-medium tw-text-iron-400">
                  Threshold
                </span>
                <span className="tw-font-medium tw-text-white tw-text-md">
                  200
                </span>
              </div>
              <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                <span className="tw-font-medium tw-text-iron-400">Time</span>
                <span className="tw-font-medium tw-text-white tw-text-md">
                  2 weeks
                </span>
              </div>

              <div className="tw-flex tw-flex-col tw-gap-y-3">
                {/* RANK */}
                <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                  <div className="tw-bg-gradient-to-r tw-from-primary-400/[0.15] tw-to-primary-400/[0.05] tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400/10 tw-px-4 tw-h-9">
                    <div className="tw-w-full tw-h-full tw-flex tw-items-center">
                      <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                        Manual stuff
                      </p>
                    </div>
                  </div>
                </div>
                <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                  <div className="tw-bg-gradient-to-r tw-from-primary-400/[0.15] tw-to-primary-400/[0.05] tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400/10 tw-px-4 tw-h-9">
                    <div className="tw-flex tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-h-full">
                      <div className="tw-w-1/2 ">
                        <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                          Rep category
                        </p>
                      </div>
                      <div className="tw-w-[25%] ">
                        <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                          2M Rep
                        </p>
                      </div>
                      <div className="tw-w-[25%]  tw-max-w-[58px]">
                        <div className="tw-flex tw-items-center tw-gap-x-2">
                          <svg
                            className="tw-size-5 tw-text-primary-400 tw-flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></path>
                          </svg>
                          <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                            23
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                  <div className="tw-bg-gradient-to-r tw-from-primary-400/[0.15] tw-to-primary-400/[0.05] tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400/10 tw-px-4 tw-h-9">
                    <div className="tw-flex tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-h-full">
                      <div className="tw-w-1/2"></div>
                      <div className="tw-w-[25%] ">
                        <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                          100k CIC
                        </p>
                      </div>
                      <div className="tw-w-[25%]  tw-max-w-[58px]">
                        <div className="tw-flex tw-items-center tw-gap-x-2">
                          <svg
                            className="tw-size-5 tw-text-primary-400 tw-flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></path>
                          </svg>
                          <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                            10k
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* APPROVE */}
                <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                  <div className="tw-bg-gradient-to-r tw-from-primary-400/[0.15] tw-to-primary-400/[0.05] tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400/10 tw-px-4 tw-h-9">
                    <div className="tw-flex tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-h-full">
                      <div className="tw-w-[75%]">
                        <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                          Some long manual stuff
                        </p>
                      </div>
                      <div className="tw-w-[25%]  tw-max-w-[58px]">
                        <div className="tw-flex tw-items-center tw-gap-x-2">
                          <svg
                            className="tw-size-5 tw-text-primary-400 tw-flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></path>
                          </svg>
                          <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                            999k
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                  <div className="tw-bg-gradient-to-r tw-from-primary-400/[0.15] tw-to-primary-400/[0.05] tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400/10 tw-px-4 tw-h-9">
                    <div className="tw-flex tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-h-full">
                      <div className="tw-w-1/2 ">
                        <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                          Rep category
                        </p>
                      </div>
                      <div className="tw-w-[25%] ">
                        <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                          2M Rep
                        </p>
                      </div>
                      <div className="tw-w-[25%]  tw-max-w-[58px]">
                        <div className="tw-flex tw-items-center tw-gap-x-2">
                          <svg
                            className="tw-size-5 tw-text-primary-400 tw-flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></path>
                          </svg>
                          <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                            23
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                  <div className="tw-bg-gradient-to-r tw-from-primary-400/[0.15] tw-to-primary-400/[0.05] tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400/10 tw-px-4 tw-h-9">
                    <div className="tw-flex tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-h-full">
                      <div className="tw-w-1/2"></div>
                      <div className="tw-w-[25%] ">
                        <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                          100k CIC
                        </p>
                      </div>
                      <div className="tw-w-[25%]  tw-max-w-[58px]">
                        <div className="tw-flex tw-items-center tw-gap-x-2">
                          <svg
                            className="tw-size-5 tw-text-primary-400 tw-flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></path>
                          </svg>
                          <p className="tw-mb-0 tw-text-xs tw-text-white tw-font-normal tw-truncate">
                            10k
                          </p>
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
