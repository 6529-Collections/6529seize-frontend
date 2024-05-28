export default function WavesCard() {
  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-2xl tw-mx-auto tw-py-12 tw-gap-y-6 tw-flex tw-flex-col">
        <div className="tw-group tw-cursor-pointer">
          <div className="tw-relative tw-w-full tw-h-20 tw-rounded-t-2xl tw-translate-y-4 group-hover:tw-translate-y-2 tw-transiton tw-duration-500 tw-ease">
            <img
              className="tw-w-full tw-h-full tw-object-cover tw-rounded-t-2xl"
              src="https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=2896&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt=""
            />
            <div className="tw-absolute tw-inset-0 tw-rounded-t-2xl tw-ring-2 tw-ring-white/20 tw-ring-inset tw-pointer-events-none"></div>
          </div>
          <div className="tw-bg-iron-900 tw-rounded-t-2xl tw-relative -tw-mt-4">
            <div className="tw-px-4 sm:tw-px-6">
              <img
                className="-tw-mt-6 tw-h-24 tw-w-24 tw-rounded-full sm:tw-h-14 sm:tw-w-14 tw-bg-iron-700 tw-ring-1 tw-ring-white/20 group-hover:tw-scale-110 tw-transition tw-duration-500 tw-ease"
                src="https://images.unsplash.com/photo-1604079681864-c6fbd7eb109c?q=80&w=2731&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt=""
              />
              <div className="tw-py-4 tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
                <div className="tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                  <div>
                    <p className="tw-mb-0 tw-text-xl tw-text-iron-50 tw-font-semibold">
                      Memes-Chat
                    </p>
                    <p className="tw-mt-1 tw-mb-0 tw-text-base tw-font-normal tw-text-iron-400">
                      The main chat for 6529. Open to all. Please join!
                    </p>
                    <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-2">
                      <div className="tw-flex -tw-space-x-0.5">
                        <div>
                          <img
                            className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                            src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            alt=""
                          />
                        </div>
                        <div>
                          <img
                            className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                            src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            alt="Emma Dorsey"
                          />
                        </div>
                        <div>
                          <img
                            className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                            src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            alt="Emma Dorsey"
                          />
                        </div>
                        <div>
                          <img
                            className="tw-h-6 tw-w-6 tw-rounded-full tw-bg-gray-50 tw-ring-2 tw-ring-iron-900"
                            src="https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            alt="Emma Dorsey"
                          />
                        </div>
                      </div>
                      <p className="tw-text-sm tw-font-medium tw-text-iron-400 tw-mb-0">
                        +1,235 people dropped
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tw-inline-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-rounded-lg tw-font-semibold tw-text-white hover:tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out"
                  >
                    <svg
                      className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M19 21V15M16 18H22M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Subscribe</span>
                  </button>
                </div>
                <div className="tw-pt-3 tw-flex tw-items-center tw-justify-between">
                  <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-2">
                    <span className="tw-font-medium tw-text-iron-400">
                      Created by
                    </span>
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <img
                        className="tw-h-6 tw-w-6 tw-rounded-lg"
                        src="https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80"
                        alt="Profile Picture"
                      />
                      <span className="tw-font-semibold tw-text-iron-50">
                        punk6529
                      </span>
                    </div>
                  </div>
                  <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
                    <span className="tw-font-medium tw-text-iron-400">
                      Created
                    </span>
                    <span className="tw-font-medium tw-text-iron-50">
                      2 days ago
                    </span>
                  </div>
                  <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
                    <span className="tw-font-medium tw-text-iron-400">
                      Ending in
                    </span>
                    <span className="tw-font-medium tw-text-iron-50">
                      7 days
                    </span>
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
