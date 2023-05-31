import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import styles from "../../styles/Home.module.scss";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function AllowlistTool() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Allowlist tool" },
  ]);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  return (
    <main style={{ paddingBottom: "0px !important" }} className={styles.main}>
      <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div
        className={`tw-min-h-screen tw-bg-neutral-900 ${poppins.className}`}
        id="allowlist-tool"
      >
        <div className="container tw-mx-auto tw-pt-6">
          <div className="tw-flex tw-justify-between tw-items-center">
            <h1 className="tw-uppercase">Allowlists</h1>
            <button
              type="button"
              style={{ fontSize: "14px !important" }}
              className="tw-inline-flex tw-items-center tw-gap-x-2 tw-px-4 tw-py-2.5 tw-bg-primary tw-text-white tw-font-medium tw-border tw-border-primary tw-rounded-lg hover:tw-bg-primary-hover hover:tw-border-primary-hover tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-h-5 tw-w-5 -tw-ml-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              New allowlist
            </button>
          </div>
          <div className="tw-flex tw-justify-center tw-mt-20">
            <div className="tw-text-center">
              <svg
                className="tw-h-12 tw-w-12 tw-text-neutral-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 7L11.8845 4.76892C11.5634 4.1268 11.4029 3.80573 11.1634 3.57116C10.9516 3.36373 10.6963 3.20597 10.4161 3.10931C10.0992 3 9.74021 3 9.02229 3H5.2C4.0799 3 3.51984 3 3.09202 3.21799C2.71569 3.40973 2.40973 3.71569 2.21799 4.09202C2 4.51984 2 5.0799 2 6.2V7M2 7H17.2C18.8802 7 19.7202 7 20.362 7.32698C20.9265 7.6146 21.3854 8.07354 21.673 8.63803C22 9.27976 22 10.1198 22 11.8V16.2C22 17.8802 22 18.7202 21.673 19.362C21.3854 19.9265 20.9265 20.3854 20.362 20.673C19.7202 21 18.8802 21 17.2 21H6.8C5.11984 21 4.27976 21 3.63803 20.673C3.07354 20.3854 2.6146 19.9265 2.32698 19.362C2 18.7202 2 17.8802 2 16.2V7ZM12 17V11M9 14H15"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="tw-mt-2 tw-text-lg tw-text-neutral-50 tw-font-medium tw-mb-0">
                No allowlist
              </p>
              <p className="tw-mt-2 tw-text-sm tw-font-light tw-text-neutral-400 tw-mb-0">
                Get started by creating a new allowlist.
              </p>
            </div>
          </div>
        </div>

        <div className="tw-relative tw-z-10" role="dialog">
          <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-transition-opacity"></div>

          <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
            <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
              <div className="tw-relative tw-w-full tw-transform tw-overflow-hidden tw-rounded-xl tw-bg-neutral-900 tw-px-4 tw-pb-4 tw-pt-5 tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full sm:tw-max-w-lg sm:tw-p-6">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <p className="tw-text-lg tw-text-white tw-font-medium tw-mb-0">
                    Add allowlist
                  </p>
                  <button
                    type="button"
                    className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-neutral-900 tw-border-0 tw-text-neutral-400 hover:tw-text-neutral-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-neutral-600 tw-transition tw-duration-300 tw-ease-out"
                  >
                    <span className="sr-only tw-text-sm">Close</span>
                    <svg
                      className="tw-h-6 tw-w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="tw-mt-5">
                  <form action="#">
                    <div>
                      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                        Name
                      </label>
                      <div className="tw-mt-2">
                        <input
                          required
                          className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                        />
                      </div>
                    </div>
                    <div className="tw-mt-6">
                      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
                        Description
                      </label>
                      <div className="tw-mt-2">
                        <input
                          required
                          placeholder="Short description about allowlist"
                          className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                        />
                      </div>
                    </div>
                    <div className="tw-mt-8 tw-w-full">
                      <button
                        type="button"
                        style={{ fontSize: "16px !important" }}
                        className="tw-bg-primary tw-px-4 tw-py-3 tw-font-medium tw-text-white tw-w-full tw-border tw-border-primary tw-rounded-lg hover:tw-bg-primary-hover hover:tw-border-primary-hover  tw-transition tw-duration-300 tw-ease-out"
                      >
                        Add allowlist
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
