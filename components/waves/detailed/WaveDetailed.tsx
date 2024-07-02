import { Wave } from "../../../generated/models/Wave";
import DropsListItem from "../../drops/view/item/DropsListItem";
import WaveCreateDrop from "./drop/WaveCreateDrop";
import WaveHeader from "./header/WaveHeader";
import WaveSpecs from "./specs/WaveSpecs";

export default function WaveDetailed({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen">
      <WaveHeader wave={wave} />
      <div className="tw-mt-12 tw-pb-16 lg:tw-pb-20 tw-max-w-5xl tw-mx-auto">
        <div className="tw-flex tw-justify-center tw-gap-x-6">
          <div className="tw-flex-1 tw-flex tw-flex-col tw-gap-y-6">
            <div className="tw-w-full">
              <div className="tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
                <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
                  <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                    <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
                      Leaderboard
                    </p>
                  </div>
                  <div className="tw-bg-iron-900 tw-rounded-b-xl">
                    <div className="tw-flex tw-items-end tw-gap-x-4 tw-mb-6 tw-px-6">
                      <div className="tw-flex-1 tw-text-center tw-flex tw-flex-col tw-items-center">
                        <div className="tw-flex tw-flex-col tw-justify-center tw-items-center tw-mb-2">
                          <img
                            src="#"
                            alt="#"
                            className="tw-h-6 tw-w-6 tw-rounded-md tw-flex-shrink-0"
                          />
                          <div className="tw-font-medium tw-text-sm tw-text-iron-50">
                            Handle
                          </div>
                        </div>
                        <div className="tw-bg-blue-500 tw-text-white tw-w-full tw-h-14 tw-flex tw-items-center tw-justify-center tw-font-semibold tw-rounded-t-lg">
                          2
                        </div>
                      </div>
                      <div className="tw-flex-1 tw-text-center tw-flex tw-flex-col tw-items-center">
                        <div className="tw-flex tw-flex-col tw-justify-center tw-items-center tw-mb-2">
                          <img
                            src="#"
                            alt="#"
                            className="tw-h-6 tw-w-6 tw-rounded-md tw-flex-shrink-0"
                          />
                          <div className="tw-font-medium tw-text-sm tw-text-iron-50">
                            Handle
                          </div>
                        </div>
                        <div className="tw-bg-blue-700 tw-text-white tw-w-full tw-h-20 tw-flex tw-items-center tw-justify-center tw-font-semibold tw-rounded-t-lg">
                          1
                        </div>
                      </div>
                      <div className="tw-flex-1 tw-text-center tw-flex tw-flex-col tw-items-center">
                        <div className="tw-flex tw-flex-col tw-justify-center tw-items-center tw-mb-2">
                          <img
                            src="#"
                            alt="#"
                            className="tw-h-6 tw-w-6 tw-rounded-md tw-flex-shrink-0"
                          />
                          <div className="tw-font-medium tw-text-sm tw-text-iron-50">
                            Handle
                          </div>
                        </div>
                        <div className="tw-bg-blue-500 tw-text-white tw-w-full tw-h-10 tw-flex tw-items-center tw-justify-center tw-font-semibold tw-rounded-t-lg">
                          3
                        </div>
                      </div>
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-2 tw-bg-gradient-to-r tw-from-iron-900 tw-to-[#BE8D2F]/10">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <svg
                          className="tw-h-6 tw-w-6 tw-flex-shrink-0"
                          viewBox="0 0 512 512"
                          fill="none"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M256 192C227.519 192 199.679 200.445 175.998 216.268C152.317 232.091 133.86 254.581 122.961 280.894C112.062 307.206 109.211 336.16 114.767 364.093C120.323 392.026 134.038 417.685 154.177 437.823C174.315 457.962 199.974 471.677 227.907 477.233C255.84 482.789 284.794 479.938 311.106 469.039C337.419 458.14 359.909 439.683 375.732 416.002C391.555 392.321 400 364.481 400 336C399.958 297.822 384.773 261.219 357.777 234.223C330.781 207.227 294.178 192.042 256 192ZM280 384H253.728V312H253.168L232 324.56V302.4L255.808 288H280V384Z"
                            fill="#BE8D2F"
                          />
                          <path
                            d="M185.6 174.72L228.8 104.8L237.28 91.0399L210.4 47.1999C207.467 42.5872 203.428 38.7806 198.65 36.126C193.872 33.4715 188.506 32.0531 183.04 31.9999H92.64C86.9326 31.9702 81.3218 33.4727 76.3932 36.3509C71.4646 39.229 67.3987 43.3772 64.62 48.3626C61.8413 53.3479 60.4515 58.9877 60.5958 64.6934C60.74 70.399 62.4129 75.9614 65.44 80.7999L140.64 203.04C154.138 191.42 169.291 181.876 185.6 174.72Z"
                            fill="#BE8D2F"
                          />
                          <path
                            d="M447.36 48.32C444.542 43.3766 440.468 39.2644 435.552 36.3989C430.636 33.5334 425.05 32.016 419.36 32H328.96C323.513 32.036 318.163 33.4483 313.407 36.1058C308.652 38.7632 304.645 42.5794 301.76 47.2L256 121.6L231.2 161.76C239.417 160.606 247.703 160.017 256 160C260.541 159.974 265.081 160.187 269.6 160.64C307.194 163.476 342.875 178.343 371.36 203.04L446.56 80.8C449.551 75.9393 451.2 70.3731 451.34 64.6679C451.481 58.9627 450.108 53.322 447.36 48.32Z"
                            fill="#BE8D2F"
                          />
                        </svg>
                        <img
                          src="#"
                          alt="#"
                          className="tw-h-6 tw-w-6 tw-rounded-md tw-flex-shrink-0"
                        />
                        <div className="tw-font-medium tw-text-sm tw-text-iron-50">
                          Handle
                        </div>
                      </div>
                      <div className="tw-ml-auto tw-text-white tw-text-sm">
                        20
                      </div>
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-2 tw-bg-gradient-to-r tw-from-iron-900 tw-to-[#AAABAB]/10">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <svg
                          className="tw-h-6 tw-w-6 tw-flex-shrink-0"
                          viewBox="0 0 512 512"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M256 192C227.519 192 199.679 200.445 175.998 216.268C152.317 232.091 133.86 254.581 122.961 280.894C112.062 307.206 109.211 336.16 114.767 364.093C120.323 392.026 134.038 417.685 154.177 437.823C174.315 457.962 199.974 471.677 227.907 477.233C255.84 482.789 284.794 479.938 311.106 469.039C337.419 458.14 359.909 439.683 375.732 416.002C391.555 392.321 400 364.481 400 336C399.958 297.822 384.773 261.219 357.777 234.223C330.781 207.227 294.178 192.042 256 192ZM288 384H224V365.504L256 336.288C257.819 334.547 259.55 332.716 261.184 330.8C262.554 329.212 263.676 327.427 264.512 325.504C265.316 323.59 265.719 321.532 265.696 319.456C265.759 317.293 265.298 315.147 264.352 313.2C263.541 311.542 262.268 310.153 260.688 309.2C259.053 308.248 257.188 307.761 255.296 307.792C253.399 307.752 251.529 308.252 249.904 309.232C248.308 310.236 247.057 311.704 246.32 313.44C245.409 315.571 244.973 317.875 245.04 320.192H224C223.835 314.227 225.161 308.316 227.856 302.992C230.302 298.3 234.082 294.436 238.72 291.888C243.796 289.204 249.475 287.865 255.216 288C261.066 287.86 266.866 289.105 272.144 291.632C276.74 293.892 280.584 297.431 283.216 301.824C285.899 306.507 287.249 311.836 287.12 317.232C287.11 320.933 286.455 324.604 285.184 328.08C283.472 332.38 281.114 336.394 278.192 339.984C273.753 345.486 268.942 350.677 263.792 355.52L256.176 362.912V363.472H288V384Z"
                            fill="#AAABAB"
                          />
                          <path
                            d="M185.6 174.72L228.8 104.8L237.28 91.0399L210.4 47.1999C207.467 42.5872 203.428 38.7806 198.65 36.126C193.872 33.4715 188.506 32.0531 183.04 31.9999H92.64C86.9326 31.9702 81.3218 33.4727 76.3932 36.3509C71.4646 39.229 67.3987 43.3772 64.62 48.3626C61.8413 53.3479 60.4515 58.9877 60.5958 64.6934C60.74 70.399 62.4129 75.9614 65.44 80.7999L140.64 203.04C154.138 191.42 169.291 181.876 185.6 174.72Z"
                            fill="#AAABAB"
                          />
                          <path
                            d="M447.36 48.32C444.542 43.3766 440.468 39.2644 435.552 36.3989C430.636 33.5334 425.05 32.016 419.36 32H328.96C323.513 32.036 318.163 33.4483 313.407 36.1058C308.652 38.7632 304.645 42.5794 301.76 47.2L256 121.6L231.2 161.76C239.417 160.606 247.703 160.017 256 160C260.541 159.974 265.081 160.187 269.6 160.64C307.194 163.476 342.875 178.343 371.36 203.04L446.56 80.8C449.551 75.9393 451.2 70.3731 451.34 64.6679C451.481 58.9627 450.108 53.322 447.36 48.32Z"
                            fill="#AAABAB"
                          />
                        </svg>

                        <img
                          src="#"
                          alt="#"
                          className="tw-h-6 tw-w-6 tw-rounded-md tw-flex-shrink-0"
                        />
                        <div className="tw-font-medium tw-text-sm tw-text-iron-50">
                          Handle
                        </div>
                      </div>
                      <div className="tw-ml-auto tw-text-white tw-text-sm">
                        19
                      </div>
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-2 tw-bg-gradient-to-r tw-from-iron-900 tw-to-[#B7674D]/10">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <svg
                          className="tw-h-6 tw-w-6 tw-flex-shrink-0"
                          viewBox="0 0 512 512"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M256 192C227.52 192 199.679 200.445 175.998 216.268C152.317 232.091 133.86 254.581 122.961 280.894C112.062 307.206 109.211 336.16 114.767 364.093C120.323 392.026 134.038 417.685 154.177 437.823C174.315 457.962 199.974 471.677 227.907 477.233C255.84 482.789 284.794 479.938 311.106 469.039C337.419 458.14 359.909 439.683 375.732 416.002C391.555 392.321 400 364.481 400 336C399.958 297.822 384.773 261.219 357.777 234.223C330.781 207.227 294.178 192.042 256 192ZM289.376 370.496C285.771 374.948 281.051 378.365 275.696 380.4C269.282 382.908 262.438 384.131 255.552 384C248.846 384.127 242.188 382.834 236.016 380.208C230.705 377.958 226.085 374.342 222.624 369.728C219.386 365.26 217.67 359.87 217.728 354.352H243.2C243.191 356.084 243.753 357.772 244.8 359.152C245.951 360.632 247.483 361.772 249.232 362.448C251.264 363.27 253.441 363.672 255.632 363.632C257.758 363.677 259.867 363.251 261.808 362.384C263.496 361.631 264.946 360.43 266 358.912C267.002 357.408 267.511 355.63 267.456 353.824C267.507 352.003 266.899 350.225 265.744 348.816C264.468 347.281 262.814 346.106 260.944 345.408C258.631 344.552 256.178 344.134 253.712 344.176H244.256V326.72H253.712C255.99 326.767 258.254 326.354 260.368 325.504C262.145 324.791 263.698 323.614 264.864 322.096C265.946 320.655 266.51 318.89 266.464 317.088C266.526 315.392 266.068 313.717 265.152 312.288C264.204 310.895 262.892 309.789 261.36 309.088C259.605 308.265 257.682 307.859 255.744 307.904C253.627 307.863 251.526 308.277 249.584 309.12C247.888 309.858 246.419 311.034 245.328 312.528C244.296 313.995 243.738 315.742 243.728 317.536H219.552C219.486 312.131 221.133 306.844 224.256 302.432C227.534 297.935 231.953 294.395 237.056 292.176C242.942 289.592 249.317 288.315 255.744 288.432C262.002 288.318 268.214 289.511 273.984 291.936C278.902 293.976 283.188 297.289 286.4 301.536C289.372 305.585 290.93 310.499 290.832 315.52C290.937 317.915 290.513 320.304 289.589 322.517C288.665 324.729 287.265 326.711 285.488 328.32C281.682 331.748 276.851 333.824 271.744 334.224V334.96C278.013 335.245 283.995 337.673 288.688 341.84C290.558 343.689 292.022 345.907 292.986 348.354C293.95 350.8 294.394 353.421 294.288 356.048C294.372 361.287 292.636 366.394 289.376 370.496Z"
                            fill="#B7674D"
                          />
                          <path
                            d="M185.6 174.72L228.8 104.8L237.28 91.0399L210.4 47.1999C207.467 42.5872 203.428 38.7806 198.65 36.126C193.872 33.4715 188.506 32.0531 183.04 31.9999H92.64C86.9326 31.9702 81.3218 33.4727 76.3932 36.3509C71.4646 39.229 67.3987 43.3772 64.62 48.3626C61.8413 53.3479 60.4515 58.9877 60.5958 64.6934C60.74 70.399 62.4129 75.9614 65.44 80.7999L140.64 203.04C154.138 191.42 169.291 181.876 185.6 174.72Z"
                            fill="#B7674D"
                          />
                          <path
                            d="M447.36 48.32C444.541 43.3766 440.468 39.2644 435.552 36.3989C430.636 33.5334 425.05 32.016 419.36 32H328.96C323.513 32.036 318.163 33.4483 313.407 36.1058C308.652 38.7632 304.645 42.5794 301.76 47.2L256 121.6L231.2 161.76C239.416 160.606 247.703 160.017 256 160C260.541 159.974 265.081 160.187 269.6 160.64C307.194 163.476 342.875 178.343 371.36 203.04L446.56 80.8C449.55 75.9393 451.2 70.3731 451.34 64.6679C451.481 58.9627 450.108 53.322 447.36 48.32Z"
                            fill="#B7674D"
                          />
                        </svg>

                        <img
                          src="#"
                          alt="#"
                          className="tw-h-6 tw-w-6 tw-rounded-md tw-flex-shrink-0"
                        />
                        <div className="tw-font-medium tw-text-sm tw-text-iron-50">
                          Handle
                        </div>
                      </div>
                      <div className="tw-ml-auto tw-text-white tw-text-sm">
                        15
                      </div>
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-2">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <div className="tw-bg-iron-900 tw-w-7 tw-h-7 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-text-white tw-font-semibold tw-text-sm">
                          4
                        </div>
                        <img
                          src="#"
                          alt="#"
                          className="tw-h-6 tw-w-6 tw-rounded-md tw-flex-shrink-0"
                        />
                        <div className="tw-font-medium tw-text-sm tw-text-iron-50">
                          Handle
                        </div>
                      </div>
                      <div className="tw-ml-auto tw-text-white tw-text-sm">
                        13
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <WaveSpecs wave={wave} />
            <div className="tw-w-full">
              <div className="tw-group">
                <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
                  <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
                    <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                      <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
                        Outcome
                      </p>
                    </div>
                    <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-6">
                      <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-font-medium tw-text-iron-400">
                          Threshold
                        </span>
                        <span className="tw-font-medium tw-text-white tw-text-base">
                          200
                        </span>
                      </div>
                      <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-font-medium tw-text-iron-400">
                          Time
                        </span>
                        <span className="tw-font-medium tw-text-white tw-text-base">
                          2 weeks
                        </span>
                      </div>
                      <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-font-medium tw-text-iron-400">
                          Winners
                        </span>
                        <span className="tw-font-medium tw-text-white tw-text-base">
                          2 weeks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="tw-w-[672px] tw-space-y-4">
            <WaveCreateDrop />
            <div>
              <div className="tw-inline-flex tw-items-center tw-gap-x-1 tw-text-xs tw-font-medium tw-text-iron-400">
                <svg
                  className="tw-size-5 tw-text-iron-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.0004 15L12.0004 22M8.00043 7.30813V9.43875C8.00043 9.64677 8.00043 9.75078 7.98001 9.85026C7.9619 9.93852 7.93194 10.0239 7.89095 10.1042C7.84474 10.1946 7.77977 10.2758 7.64982 10.4383L6.08004 12.4005C5.4143 13.2327 5.08143 13.6487 5.08106 13.9989C5.08073 14.3035 5.21919 14.5916 5.4572 14.7815C5.73088 15 6.26373 15 7.32943 15H16.6714C17.7371 15 18.27 15 18.5437 14.7815C18.7817 14.5916 18.9201 14.3035 18.9198 13.9989C18.9194 13.6487 18.5866 13.2327 17.9208 12.4005L16.351 10.4383C16.2211 10.2758 16.1561 10.1946 16.1099 10.1042C16.0689 10.0239 16.039 9.93852 16.0208 9.85026C16.0004 9.75078 16.0004 9.64677 16.0004 9.43875V7.30813C16.0004 7.19301 16.0004 7.13544 16.0069 7.07868C16.0127 7.02825 16.0223 6.97833 16.0357 6.92937C16.0507 6.87424 16.0721 6.8208 16.1149 6.71391L17.1227 4.19423C17.4168 3.45914 17.5638 3.09159 17.5025 2.79655C17.4489 2.53853 17.2956 2.31211 17.0759 2.1665C16.8247 2 16.4289 2 15.6372 2H8.36368C7.57197 2 7.17611 2 6.92494 2.1665C6.70529 2.31211 6.55199 2.53853 6.49838 2.79655C6.43707 3.09159 6.58408 3.45914 6.87812 4.19423L7.88599 6.71391C7.92875 6.8208 7.95013 6.87424 7.96517 6.92937C7.97853 6.97833 7.98814 7.02825 7.99392 7.07868C8.00043 7.13544 8.00043 7.19301 8.00043 7.30813Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Description</span>
              </div>
              <DropsListItem drop={wave.description_drop} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
