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
            <WaveSpecs wave={wave} />
            <div className="tw-w-full">
              <div className="tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
                <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-800">
                  <div className="tw-px-4 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                    <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
                      Leaderboard
                    </p>
                  </div>

                  {/*  Rank */}
                  <div className="tw-hidden tw-overflow-hidden tw-rounded-b-xl">
                    <div className="tw-max-h-[205px] scrollbar-width tw-overflow-y-auto tw-bg-iron-900 tw-rounded-b-xl tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-800">
                      <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-4 tw-bg-gradient-to-r tw-from-iron-900 tw-to-[#BE8D2F]/[0.07]">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <svg
                            className="tw-size-5 tw-flex-shrink-0"
                            viewBox="0 0 512 512"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M447.296 48.384C444.518 43.415 440.464 39.2771 435.554 36.397C430.643 33.517 425.053 31.9992 419.36 32H328.944C323.485 31.9878 318.115 33.3813 313.351 36.0463C308.588 38.7113 304.59 42.558 301.744 47.216L256 121.504L210.32 47.216C207.468 42.5487 203.461 38.6961 198.685 36.0306C193.908 33.365 188.525 31.9768 183.056 32H92.6399C86.9492 32.0081 81.3635 33.5335 76.4586 36.4192C71.5538 39.3048 67.5071 43.4463 64.7358 48.4167C61.9645 53.387 60.5689 59.0065 60.6926 64.696C60.8164 70.3854 62.4551 75.9389 65.4399 80.784L157.888 230.944C136.732 250.654 122 276.276 115.609 304.475C109.219 332.674 111.465 362.145 122.056 389.049C132.647 415.954 151.092 439.047 174.991 455.323C198.889 471.599 227.134 480.303 256.048 480.303C284.962 480.303 313.207 471.599 337.105 455.323C361.004 439.047 379.449 415.954 390.04 389.049C400.631 362.145 402.877 332.674 396.486 304.475C390.096 276.276 375.363 250.654 354.208 230.944L446.656 80.784C449.637 75.9294 451.268 70.3669 451.381 64.671C451.493 58.9752 450.083 53.3527 447.296 48.384ZM92.6399 64H183.056L237.248 152L207.376 200.576C199.13 203.548 191.172 207.265 183.6 211.68L92.6399 64ZM368 336C368 358.152 361.431 379.806 349.125 398.224C336.818 416.642 319.326 430.998 298.86 439.475C278.395 447.952 255.876 450.17 234.15 445.848C212.424 441.526 192.467 430.859 176.804 415.196C161.141 399.533 150.474 379.576 146.152 357.85C141.83 336.124 144.048 313.605 152.525 293.139C161.002 272.674 175.358 255.182 193.776 242.875C212.194 230.569 233.848 224 256 224C285.694 224.034 314.162 235.845 335.158 256.842C356.155 277.838 367.966 306.306 368 336ZM328.4 211.728C306.456 198.818 281.46 192.007 256 192C254 192 252.048 192.224 250.064 192.304L328.944 64H419.36L328.4 211.728Z"
                              fill="#BE8D2F"
                            />
                            <path
                              d="M280 288V384H253.728V312H253.168L232 324.56V302.4L255.808 288H280Z"
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
                      <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-4 tw-bg-gradient-to-r tw-from-iron-900 tw-to-[#AAABAB]/[0.07]">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <svg
                            className="tw-size-5 tw-flex-shrink-0"
                            viewBox="0 0 512 512"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M447.296 48.384C444.518 43.415 440.464 39.2771 435.554 36.397C430.643 33.517 425.053 31.9992 419.36 32H328.944C323.485 31.9878 318.115 33.3813 313.351 36.0463C308.588 38.7113 304.59 42.558 301.744 47.216L256 121.504L210.32 47.216C207.468 42.5487 203.461 38.6961 198.685 36.0306C193.908 33.365 188.525 31.9768 183.056 32H92.6399C86.9492 32.0081 81.3635 33.5335 76.4586 36.4192C71.5538 39.3048 67.5071 43.4463 64.7358 48.4167C61.9645 53.387 60.5689 59.0065 60.6926 64.696C60.8164 70.3854 62.4551 75.9389 65.4399 80.784L157.888 230.944C136.732 250.654 122 276.276 115.609 304.475C109.219 332.674 111.465 362.145 122.056 389.049C132.647 415.954 151.092 439.047 174.991 455.323C198.889 471.599 227.134 480.303 256.048 480.303C284.962 480.303 313.207 471.599 337.105 455.323C361.004 439.047 379.449 415.954 390.04 389.049C400.631 362.145 402.877 332.674 396.486 304.475C390.096 276.276 375.363 250.654 354.208 230.944L446.656 80.784C449.637 75.9294 451.268 70.3669 451.381 64.671C451.493 58.9752 450.083 53.3527 447.296 48.384ZM92.6399 64H183.056L237.248 152L207.376 200.576C199.13 203.548 191.172 207.265 183.6 211.68L92.6399 64ZM368 336C368 358.152 361.431 379.806 349.125 398.224C336.818 416.642 319.326 430.998 298.86 439.475C278.395 447.952 255.876 450.17 234.15 445.848C212.424 441.526 192.467 430.859 176.804 415.196C161.141 399.533 150.474 379.576 146.152 357.85C141.83 336.124 144.048 313.605 152.525 293.139C161.002 272.674 175.358 255.182 193.776 242.875C212.194 230.569 233.848 224 256 224C285.694 224.034 314.162 235.845 335.158 256.842C356.155 277.838 367.966 306.306 368 336ZM328.4 211.728C306.456 198.818 281.46 192.007 256 192C254 192 252.048 192.224 250.064 192.304L328.944 64H419.36L328.4 211.728Z"
                              fill="#AAABAB"
                            />
                            <path
                              d="M224 384V365.504L256 336.288C257.819 334.547 259.55 332.716 261.184 330.8C262.554 329.213 263.676 327.427 264.512 325.504C265.316 323.59 265.719 321.532 265.696 319.456C265.759 317.293 265.298 315.147 264.352 313.2C263.541 311.542 262.268 310.154 260.688 309.2C259.053 308.248 257.188 307.761 255.296 307.792C253.399 307.752 251.529 308.252 249.904 309.232C248.308 310.236 247.057 311.704 246.32 313.44C245.409 315.572 244.973 317.875 245.04 320.192H224C223.835 314.227 225.161 308.316 227.856 302.992C230.302 298.3 234.082 294.436 238.72 291.888C243.796 289.204 249.475 287.865 255.216 288C261.066 287.86 266.866 289.105 272.144 291.632C276.736 293.897 280.579 297.435 283.216 301.824C285.899 306.508 287.249 311.836 287.12 317.232C287.11 320.933 286.455 324.604 285.184 328.08C283.472 332.38 281.114 336.394 278.192 339.984C273.753 345.486 268.942 350.677 263.792 355.52L256.176 362.912V363.472H288V384H224Z"
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
                      <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-4 tw-bg-gradient-to-r tw-from-iron-900 tw-to-[#B7674D]/[0.07]">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <svg
                            className="tw-size-5 tw-flex-shrink-0"
                            viewBox="0 0 512 512"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M447.296 48.384C444.518 43.415 440.464 39.2771 435.554 36.397C430.643 33.517 425.053 31.9992 419.36 32H328.944C323.485 31.9878 318.115 33.3813 313.351 36.0463C308.588 38.7113 304.59 42.558 301.744 47.216L256 121.504L210.32 47.216C207.468 42.5487 203.461 38.6961 198.685 36.0306C193.908 33.365 188.525 31.9768 183.056 32H92.6399C86.9492 32.0081 81.3635 33.5335 76.4586 36.4192C71.5538 39.3048 67.5071 43.4463 64.7358 48.4167C61.9645 53.387 60.5689 59.0065 60.6926 64.696C60.8164 70.3854 62.4551 75.9389 65.4399 80.784L157.888 230.944C136.732 250.654 122 276.276 115.609 304.475C109.219 332.674 111.465 362.145 122.056 389.049C132.647 415.954 151.092 439.047 174.991 455.323C198.889 471.599 227.134 480.303 256.048 480.303C284.962 480.303 313.207 471.599 337.105 455.323C361.004 439.047 379.449 415.954 390.04 389.049C400.631 362.145 402.877 332.674 396.486 304.475C390.096 276.276 375.363 250.654 354.208 230.944L446.656 80.784C449.637 75.9294 451.268 70.3669 451.381 64.671C451.493 58.9752 450.083 53.3527 447.296 48.384ZM92.6399 64H183.056L237.248 152L207.376 200.576C199.13 203.548 191.172 207.265 183.6 211.68L92.6399 64ZM368 336C368 358.152 361.431 379.806 349.125 398.224C336.818 416.642 319.326 430.998 298.86 439.475C278.395 447.952 255.876 450.17 234.15 445.848C212.424 441.526 192.467 430.859 176.804 415.196C161.141 399.533 150.474 379.576 146.152 357.85C141.83 336.124 144.048 313.605 152.525 293.139C161.002 272.674 175.358 255.182 193.776 242.875C212.194 230.569 233.848 224 256 224C285.694 224.034 314.162 235.845 335.158 256.842C356.155 277.838 367.966 306.306 368 336ZM328.4 211.728C306.456 198.818 281.46 192.007 256 192C254 192 252.048 192.224 250.064 192.304L328.944 64H419.36L328.4 211.728Z"
                              fill="#B7674D"
                            />
                            <path
                              d="M255.552 384C248.845 384.127 242.188 382.834 236.016 380.208C230.707 377.962 226.091 374.345 222.64 369.728C219.387 365.267 217.664 359.873 217.728 354.352H243.2C243.19 356.085 243.753 357.772 244.8 359.152C245.951 360.632 247.483 361.772 249.232 362.448C251.264 363.27 253.44 363.672 255.632 363.632C257.757 363.677 259.866 363.251 261.808 362.384C263.496 361.631 264.945 360.43 266 358.912C267.001 357.408 267.51 355.63 267.456 353.824C267.506 352.003 266.899 350.225 265.744 348.816C264.468 347.281 262.813 346.107 260.944 345.408C258.631 344.552 256.178 344.134 253.712 344.176H244.256V326.72H253.712C255.99 326.767 258.254 326.354 260.368 325.504C262.145 324.791 263.697 323.614 264.864 322.096C265.954 320.659 266.519 318.891 266.464 317.088C266.525 315.392 266.068 313.717 265.152 312.288C264.203 310.895 262.892 309.789 261.36 309.088C259.604 308.265 257.682 307.859 255.744 307.904C253.627 307.863 251.526 308.277 249.584 309.12C247.888 309.858 246.419 311.034 245.328 312.528C244.296 313.995 243.737 315.743 243.728 317.536H219.552C219.486 312.131 221.132 306.844 224.256 302.432C227.534 297.935 231.952 294.395 237.056 292.176C242.941 289.592 249.317 288.315 255.744 288.432C262.001 288.318 268.214 289.511 273.984 291.936C278.902 293.976 283.188 297.289 286.4 301.536C289.372 305.585 290.929 310.499 290.832 315.52C290.937 317.915 290.513 320.304 289.589 322.517C288.665 324.729 287.265 326.711 285.488 328.32C281.682 331.748 276.85 333.824 271.744 334.224V334.96C278.013 335.245 283.995 337.673 288.688 341.84C290.558 343.689 292.021 345.907 292.986 348.354C293.95 350.8 294.393 353.421 294.288 356.048C294.387 361.302 292.657 366.427 289.392 370.544C285.787 374.996 281.067 378.413 275.712 380.448C269.29 382.942 262.44 384.149 255.552 384Z"
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
                      <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-4">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <div className="tw-bg-iron-900 tw-w-6 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-text-iron-300 tw-font-semibold tw-text-sm">
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
                        <div className="tw-ml-auto tw-text-iron-300 tw-text-sm">
                          13
                        </div>
                      </div>
                      <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-4">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <div className="tw-bg-iron-900 tw-w-6 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-text-iron-300 tw-font-semibold tw-text-sm">
                            5
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
                        <div className="tw-ml-auto tw-text-iron-300 tw-text-sm">
                          12
                        </div>
                      </div>
                      <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-4">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <div className="tw-bg-iron-900 tw-w-6 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-text-iron-300 tw-font-semibold tw-text-sm">
                            6
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
                        <div className="tw-ml-auto tw-text-iron-300 tw-text-sm">
                          12
                        </div>
                      </div>
                    </div>
                  </div>

                  {/*  Approval 
                  <div className="tw-overflow-hidden tw-rounded-b-xl">
                    <div className="tw-max-h-[205px] scrollbar-width tw-overflow-y-auto tw-bg-iron-900 tw-rounded-b-xl tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-800">
                      <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-4 tw-bg-gradient-to-r tw-from-iron-900 tw-to-[#BE8D2F]/[0.07]">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <svg
                            className="tw-size-5 tw-flex-shrink-0 tw-text-[#BE8D2F]"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
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
                      <div className="tw-flex tw-items-center tw-gap-4 tw-py-2 tw-px-4">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <div className="tw-w-5"></div>
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
                    </div>
                  </div> 
                  */}

                  
                </div>
              </div>
            </div>
            <div className="tw-w-full">
              <div className="tw-group">
                <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
                  <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
                    <div className="tw-px-4 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                      <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
                        Outcome
                      </p>
                    </div>
                    <div className="tw-px-4 tw-py-4 tw-flex tw-flex-col tw-gap-y-6">
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
