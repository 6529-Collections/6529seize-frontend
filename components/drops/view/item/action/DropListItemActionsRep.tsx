import Tippy from "@tippyjs/react";
import { DropFull } from "../../../../../entities/IDrop";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { RepActionExpandable } from "../DropsListItem";
import DropListItemActionsItemWrapper from "./DropListItemActionsItemWrapper";
import DropListItemActionsRepTooltip from "./DropListItemActionsRepTooltip";

enum RepStatus {
  POSITIVE = "POSITIVE",
  NEUTRAL = "NEUTRAL",
  NEGATIVE = "NEGATIVE",
}

export default function DropListItemActionsRep({
  drop,
  setState,
}: {
  readonly drop: DropFull;
  readonly setState: (state: RepActionExpandable) => void;
}) {
  const userHaveVoted = !!drop.rep_given_by_input_profile;
  const getRepStatus = (): RepStatus => {
    if (drop.rep > 0) return RepStatus.POSITIVE;
    if (drop.rep < 0) return RepStatus.NEGATIVE;
    return RepStatus.NEUTRAL;
  };

  const getRepColor = (): string => {
    switch (getRepStatus()) {
      case RepStatus.POSITIVE:
        return "tw-text-green";
      case RepStatus.NEGATIVE:
        return "tw-text-red";
      case RepStatus.NEUTRAL:
        return "tw-text-iron-300";
    }
  };

  return (
    <Tippy
      placement={"top"}
      interactive={true}
      content={
        <DropListItemActionsRepTooltip
          current={drop.rep}
          myVotes={drop.rep_given_by_input_profile}
        />
      }
    >
      <div>
        <DropListItemActionsItemWrapper
          state={RepActionExpandable.REP}
          setState={setState}
        >
          <>
            {userHaveVoted ? (
              <svg
                className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300"
                width="346"
                height="361"
                viewBox="0 0 346 361"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M182.353 80.8929L217.853 116.493C217.13 118.722 216.759 121.05 216.753 123.393V161.793L143.953 88.9929C145.363 85.3738 147.652 82.1627 150.613 79.6492C153.574 77.1356 157.114 75.3987 160.914 74.595C164.714 73.7913 168.654 73.9462 172.38 75.0457C176.105 76.1452 179.498 78.1547 182.253 80.8929H182.353Z"
                  fill="#528BFF"
                />
                <path
                  d="M316.752 126.393C328.352 167.393 339.552 210.693 336.752 253.393C335.852 270.46 328.738 286.609 316.752 298.793L285.652 329.893C271.462 342.306 253.731 349.949 234.963 351.743C216.195 353.537 197.338 349.392 181.052 339.893C198.407 337.38 214.681 329.955 227.952 318.493L259.052 287.393C271.038 275.209 278.152 259.06 279.052 241.993C280.112 219.118 278.264 196.202 273.552 173.793L274.452 134.793C274.452 129.027 276.714 123.491 280.754 119.376C284.794 115.262 290.287 112.898 296.052 112.793C300.472 112.706 304.815 113.958 308.51 116.386C312.204 118.813 315.078 122.302 316.752 126.393Z"
                  fill="#528BFF"
                />
                <path
                  d="M215.753 159.376L144.76 88.2863L144.758 88.284L125.36 68.9858C125.359 68.9856 125.359 68.9854 125.359 68.9852C123.099 66.7258 120.417 64.9336 117.465 63.7108C114.513 62.4878 111.348 61.8584 108.152 61.8584C104.957 61.8584 101.792 62.4878 98.8401 63.7108C95.8877 64.9337 93.2051 66.7261 90.9454 68.9858C88.6857 71.2455 86.8932 73.9281 85.6703 76.8805C84.4474 79.8329 83.818 82.9973 83.818 86.1929C83.818 89.2623 84.3986 92.3028 85.5281 95.1544L72.3596 81.9858L72.3576 81.9838C67.7857 77.4374 61.6002 74.8854 55.1525 74.8854C48.7048 74.8854 42.5193 77.4374 37.9474 81.9838L37.9434 81.9878C33.397 86.5597 30.845 92.7453 30.845 99.1929C30.845 105.641 33.397 111.826 37.9434 116.398L37.9454 116.4L51.1504 129.605C48.3133 128.479 45.2634 127.885 42.1525 127.885C35.7053 127.885 29.5202 130.437 24.9484 134.983C22.6719 137.233 20.8645 139.913 19.6308 142.867C18.397 145.821 17.7617 148.991 17.7617 152.193C17.7617 155.395 18.397 158.564 19.6308 161.519C20.8641 164.472 22.6709 167.151 24.9466 169.401C24.9475 169.402 24.9485 169.403 24.9495 169.404L40.2648 184.789C37.4246 183.656 34.3694 183.058 31.2525 183.058C24.7986 183.058 18.609 185.622 14.0454 190.186C9.48178 194.749 6.91797 200.939 6.91797 207.393C6.91797 213.847 9.48164 220.036 14.045 224.6C14.0451 224.6 14.0453 224.6 14.0454 224.6L106.045 316.7L106.049 316.704C115.835 326.386 127.778 333.607 140.897 337.775C154.013 341.942 167.931 342.938 181.506 340.681C199.046 338.14 215.493 330.634 228.906 319.05L228.934 319.026L228.96 319L260.06 287.9L260.065 287.894C272.222 275.536 279.438 259.157 280.351 241.846L280.351 241.839C281.415 218.883 279.561 195.884 274.833 173.395C270.925 153.455 265.616 133.724 260.215 114.522L260.197 114.457L260.17 114.396C258.34 110.167 255.301 106.572 251.435 104.063C247.57 101.555 243.05 100.243 238.442 100.293L238.438 100.293C233.639 100.364 228.982 101.934 225.12 104.783C221.258 107.633 218.384 111.619 216.901 116.184L216.901 116.185C216.147 118.512 215.76 120.943 215.753 123.39V123.393V159.376Z"
                  fill="#528BFF"
                  stroke="black"
                  strokeWidth="2"
                />
                <path
                  d="M106.753 323.993C104.661 323.969 102.657 323.146 101.153 321.693L9.15252 229.593C3.29018 223.692 0 215.711 0 207.393C0 199.075 3.29018 191.094 9.15252 185.193C15.1454 179.546 23.0686 176.402 31.3025 176.402C39.5365 176.402 47.4596 179.546 53.4525 185.193C54.9548 186.71 55.7975 188.758 55.7975 190.893C55.7975 193.028 54.9548 195.076 53.4525 196.593C51.9528 198.089 49.9209 198.929 47.8025 198.929C45.6841 198.929 43.6522 198.089 42.1525 196.593C39.231 193.8 35.3446 192.241 31.3025 192.241C27.2604 192.241 23.3741 193.8 20.4525 196.593C19.0254 198.006 17.8926 199.688 17.1195 201.542C16.3464 203.396 15.9483 205.384 15.9483 207.393C15.9483 209.401 16.3464 211.39 17.1195 213.244C17.8926 215.098 19.0254 216.78 20.4525 218.193L112.553 310.293C114.055 311.81 114.898 313.858 114.898 315.993C114.898 318.128 114.055 320.176 112.553 321.693C110.992 323.185 108.911 324.01 106.753 323.993Z"
                  fill="#003442"
                />
                <path
                  d="M130.653 215.593C128.528 215.584 126.488 214.761 124.953 213.293L32.7525 121.093C26.8658 115.205 23.5588 107.219 23.5588 98.8929C23.5588 90.5667 26.8658 82.5813 32.7525 76.6929C38.7507 71.0174 46.6948 67.8546 54.9525 67.8546C63.2103 67.8546 71.1544 71.0174 77.1525 76.6929L169.253 168.793C170.755 170.31 171.598 172.358 171.598 174.493C171.598 176.628 170.755 178.676 169.253 180.193C167.753 181.689 165.721 182.529 163.603 182.529C161.484 182.529 159.452 181.689 157.953 180.193L65.7525 88.0929C62.8361 85.3288 58.9708 83.7881 54.9525 83.7881C50.9343 83.7881 47.069 85.3288 44.1525 88.0929C42.7103 89.508 41.5646 91.1963 40.7825 93.0593C40.0004 94.9223 39.5976 96.9225 39.5976 98.943C39.5976 100.963 40.0004 102.964 40.7825 104.827C41.5646 106.69 42.7103 108.378 44.1525 109.793L136.753 201.893C137.883 203.006 138.657 204.43 138.976 205.984C139.295 207.538 139.145 209.152 138.544 210.62C137.944 212.088 136.921 213.345 135.605 214.231C134.289 215.116 132.739 215.59 131.153 215.593H130.653Z"
                  fill="#003442"
                />
                <path
                  d="M97.4525 248.593C95.3608 248.569 93.3575 247.746 91.8525 246.293L20.0525 174.793C17.1167 171.899 14.7854 168.451 13.1941 164.649C11.6028 160.846 10.7834 156.765 10.7834 152.643C10.7834 148.521 11.6028 144.44 13.1941 140.637C14.7854 136.835 17.1167 133.386 20.0525 130.493C25.9197 124.643 33.8671 121.358 42.1525 121.358C50.4379 121.358 58.3853 124.643 64.2525 130.493C65.7548 132.01 66.5975 134.058 66.5975 136.193C66.5975 138.328 65.7548 140.376 64.2525 141.893C62.7528 143.389 60.7209 144.229 58.6025 144.229C56.4841 144.229 54.4522 143.389 52.9525 141.893C51.5306 140.463 49.8401 139.328 47.978 138.553C46.116 137.779 44.1192 137.38 42.1025 137.38C40.0858 137.38 38.089 137.779 36.227 138.553C34.3649 139.328 32.6744 140.463 31.2525 141.893C28.4564 144.601 26.8397 148.301 26.7525 152.193C26.7464 154.202 27.1413 156.192 27.914 158.046C28.6867 159.901 29.8217 161.583 31.2525 162.993L103.152 234.793C104.655 236.31 105.498 238.358 105.498 240.493C105.498 242.628 104.655 244.676 103.152 246.193C101.633 247.697 99.5907 248.557 97.4525 248.593Z"
                  fill="#003442"
                />
                <path
                  d="M167.453 348.993C155.163 349.032 142.987 346.64 131.626 341.955C120.265 337.269 109.942 330.383 101.253 321.693C99.7503 320.176 98.9075 318.128 98.9075 315.993C98.9075 313.858 99.7503 311.81 101.253 310.293C102.752 308.797 104.784 307.957 106.903 307.957C109.021 307.957 111.053 308.797 112.553 310.293C121.235 319.007 131.867 325.529 143.57 329.32C155.273 333.111 167.71 334.061 179.853 332.093C195.749 329.691 210.612 322.746 222.653 312.093L253.353 281.393C264.125 270.757 270.574 256.506 271.453 241.393C272.445 219.187 270.63 196.945 266.053 175.193C262.453 156.693 257.653 138.593 251.553 117.093C250.355 114.55 248.419 112.426 245.997 110.998C243.575 109.57 240.779 108.905 237.974 109.088C235.168 109.271 232.483 110.295 230.267 112.026C228.052 113.757 226.409 116.115 225.553 118.793C225.045 120.205 224.775 121.692 224.753 123.193V161.793C224.771 163.375 224.314 164.927 223.44 166.246C222.566 167.566 221.316 168.592 219.853 169.193C218.396 169.799 216.793 169.961 215.246 169.658C213.698 169.356 212.274 168.602 211.153 167.493L118.953 75.393C116.055 72.553 112.16 70.9622 108.103 70.9622C104.045 70.9622 100.15 72.553 97.2525 75.393C95.8254 76.8063 94.6926 78.4884 93.9195 80.3422C93.1464 82.1959 92.7483 84.1845 92.7483 86.193C92.7483 88.2015 93.1464 90.1901 93.9195 92.0438C94.6926 93.8975 95.8254 95.5797 97.2525 96.993C98.7548 98.5097 99.5975 100.558 99.5975 102.693C99.5975 104.828 98.7548 106.876 97.2525 108.393C95.7528 109.889 93.7209 110.729 91.6025 110.729C89.4842 110.729 87.4523 109.889 85.9525 108.393C80.0658 102.505 76.7589 94.5192 76.7589 86.193C76.7589 77.8667 80.0658 69.8814 85.9525 63.993C91.8989 58.2555 99.8395 55.0492 108.103 55.0492C116.366 55.0492 124.306 58.2555 130.253 63.993L208.753 142.393V123.393C208.76 120.233 209.266 117.095 210.253 114.093C212.108 108.181 215.749 102.989 220.675 99.2296C225.6 95.4704 231.569 93.3286 237.761 93.0984C243.953 92.8683 250.065 94.5611 255.256 97.9443C260.447 101.328 264.463 106.235 266.753 111.993C272.453 131.993 277.853 151.993 281.853 171.993C286.687 194.993 288.569 218.516 287.453 241.993C286.368 261.078 278.286 279.093 264.753 292.593L233.553 324.793C219.047 337.442 201.2 345.636 182.153 348.393C177.276 348.986 172.361 349.187 167.453 348.993Z"
                  fill="#003442"
                />
                <path
                  d="M225.553 360.393C208.354 360.467 191.468 355.796 176.753 346.893C175.845 346.368 175.053 345.666 174.423 344.828C173.793 343.99 173.339 343.034 173.087 342.017C172.835 340.999 172.79 339.941 172.956 338.906C173.122 337.871 173.495 336.881 174.053 335.993C175.153 334.178 176.923 332.868 178.98 332.344C181.037 331.82 183.218 332.125 185.053 333.193C199.882 341.875 217.078 345.642 234.179 343.953C251.28 342.265 267.408 335.208 280.253 323.793L310.953 293.093C321.655 282.408 328.091 268.185 329.053 253.093C331.553 212.093 321.053 170.893 309.053 128.793C307.67 125.926 305.358 123.611 302.493 122.225C299.628 120.838 296.378 120.462 293.272 121.158C290.165 121.853 287.386 123.579 285.385 126.055C283.385 128.53 282.281 131.61 282.253 134.793L281.653 174.193C281.639 175.244 281.42 176.281 281.005 177.247C280.591 178.213 279.991 179.087 279.239 179.821C278.487 180.554 277.597 181.133 276.622 181.522C275.646 181.912 274.603 182.106 273.553 182.093C272.506 182.08 271.473 181.86 270.513 181.444C269.553 181.029 268.685 180.427 267.959 179.673C267.234 178.92 266.665 178.03 266.286 177.055C265.907 176.079 265.726 175.039 265.753 173.993L266.753 134.793C266.735 127.804 269.159 121.028 273.605 115.636C278.051 110.243 284.24 106.572 291.104 105.256C297.968 103.94 305.076 105.062 311.201 108.428C317.326 111.794 322.084 117.193 324.653 123.693C336.753 166.293 348.053 210.693 345.353 253.693C344.299 272.992 336.1 291.208 322.353 304.793L291.253 335.993C272.967 351.707 249.663 360.362 225.553 360.393Z"
                  fill="#003442"
                />
                <path
                  d="M217.953 124.793C216.889 124.803 215.835 124.595 214.854 124.182C213.874 123.769 212.989 123.161 212.253 122.393L176.753 86.493C173.819 83.7222 169.937 82.1785 165.903 82.1785C161.868 82.1785 157.986 83.7222 155.053 86.493C153.562 87.9852 152.374 89.7508 151.553 91.693C151.33 92.8316 150.862 93.9081 150.182 94.8478C149.502 95.7876 148.625 96.5682 147.613 97.1355C146.601 97.7028 145.478 98.0431 144.321 98.133C143.164 98.2229 142.002 98.0601 140.915 97.656C139.827 97.2518 138.841 96.616 138.023 95.7926C137.206 94.9692 136.578 93.9778 136.182 92.8873C135.786 91.7969 135.632 90.6333 135.73 89.4773C135.829 88.3214 136.178 87.2007 136.753 86.193C138.572 81.2957 141.589 76.9318 145.528 73.4993C149.467 70.0668 154.202 67.6748 159.302 66.5415C164.402 65.4081 169.705 65.5694 174.727 67.0107C179.749 68.452 184.33 71.1274 188.053 74.793L223.553 110.393C224.971 111.435 226.005 112.915 226.497 114.605C226.988 116.295 226.909 118.099 226.271 119.739C225.634 121.379 224.473 122.763 222.969 123.677C221.465 124.591 219.702 124.983 217.953 124.793Z"
                  fill="#003442"
                />
                <path
                  d="M129.452 43.893C127.31 43.8784 125.26 43.0154 123.753 41.493L106.752 23.893C106.017 23.1379 105.438 22.2453 105.047 21.2663C104.657 20.2872 104.463 19.2408 104.477 18.1869C104.491 17.133 104.712 16.0921 105.128 15.1237C105.545 14.1553 106.147 13.2784 106.902 12.543C107.658 11.8076 108.55 11.2281 109.529 10.8376C110.508 10.4472 111.555 10.2534 112.609 10.2673C113.663 10.2812 114.703 10.5026 115.672 10.9188C116.64 11.335 117.517 11.9379 118.252 12.693L135.252 30.293C136.755 31.8097 137.597 33.8582 137.597 35.993C137.597 38.1277 136.755 40.1762 135.252 41.693C134.484 42.432 133.574 43.008 132.577 43.3861C131.581 43.7641 130.518 43.9366 129.452 43.893Z"
                  fill="#528BFF"
                />
                <path
                  d="M163.352 36.893C162.307 36.8931 161.271 36.6855 160.306 36.2823C159.341 35.879 158.466 35.2881 157.731 34.5439C156.996 33.7997 156.416 32.917 156.025 31.9469C155.634 30.9769 155.439 29.9389 155.452 28.893V8.89303C155.327 7.77414 155.439 6.64132 155.781 5.56865C156.123 4.49598 156.688 3.50763 157.438 2.66822C158.189 1.82881 159.108 1.15725 160.136 0.69746C161.163 0.237669 162.277 0 163.402 0C164.528 0 165.642 0.237669 166.669 0.69746C167.697 1.15725 168.616 1.82881 169.367 2.66822C170.117 3.50763 170.682 4.49598 171.024 5.56865C171.366 6.64132 171.478 7.77414 171.352 8.89303V28.893C171.352 29.9436 171.146 30.9839 170.743 31.9545C170.341 32.9251 169.752 33.807 169.009 34.5499C168.266 35.2927 167.385 35.882 166.414 36.2841C165.443 36.6861 164.403 36.893 163.352 36.893Z"
                  fill="#528BFF"
                />
                <path
                  d="M196.753 43.893C194.61 43.8784 192.56 43.0154 191.053 41.493C190.3 40.7572 189.701 39.8784 189.293 38.9081C188.884 37.9379 188.674 36.8957 188.674 35.843C188.674 34.7903 188.884 33.7482 189.293 32.7779C189.701 31.8076 190.3 30.9288 191.053 30.193L208.053 13.593C209.552 12.0969 211.584 11.2567 213.703 11.2567C215.821 11.2567 217.853 12.0969 219.353 13.593C220.105 14.3288 220.704 15.2076 221.112 16.1779C221.521 17.1482 221.731 18.1903 221.731 19.243C221.731 20.2957 221.521 21.3379 221.112 22.3081C220.704 23.2784 220.105 24.1572 219.353 24.893L202.353 41.493C201.624 42.2438 200.755 42.8426 199.793 43.2546C198.832 43.6666 197.798 43.8836 196.753 43.893Z"
                  fill="#528BFF"
                />
              </svg>
            ) : (
              <svg
                className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300"
                width="350"
                height="364"
                viewBox="0 0 350 364"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <mask
                  id="path-1-outside-1_1_539"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="350"
                  height="364"
                  fill="black"
                >
                  <rect fill="white" width="350" height="364" />
                  <path d="M326.353 124.5C324.144 119.113 320.416 114.485 315.623 111.181C310.83 107.876 305.179 106.038 299.359 105.889C293.539 105.741 287.802 107.289 282.847 110.345C277.892 113.401 273.933 117.833 271.453 123.1L268.753 113.1C266.793 108.435 263.685 104.342 259.718 101.201C255.751 98.0603 251.055 95.9736 246.065 95.1353C241.075 94.2971 235.955 94.7344 231.179 96.4067C226.404 98.079 222.129 100.932 218.753 104.7L190.153 75.9C184.154 70.2244 176.21 67.0617 167.953 67.0617C159.695 67.0617 151.751 70.2244 145.753 75.9C145.477 76.3177 145.176 76.7184 144.853 77.1L132.453 64.7C126.478 58.979 118.525 55.7856 110.253 55.7856C101.98 55.7856 94.0275 58.979 88.0525 64.7C84.3337 68.5873 81.6217 73.3248 80.1525 78.5L79.1525 77.5C73.1544 71.8244 65.2102 68.6617 56.9525 68.6617C48.6948 68.6617 40.7507 71.8244 34.7525 77.5C28.9143 83.414 25.6407 91.3897 25.6407 99.7C25.6407 108.01 28.9143 115.986 34.7525 121.9L35.8525 122.9C30.6832 124.313 25.9649 127.034 22.1525 130.8C19.2167 133.694 16.8854 137.142 15.2941 140.944C13.7029 144.747 12.8834 148.828 12.8834 152.95C12.8834 157.072 13.7029 161.153 15.2941 164.956C16.8854 168.758 19.2167 172.206 22.1525 175.1L25.3525 178.3C20.0255 179.52 15.1223 182.144 11.1525 185.9C5.29018 191.801 2 199.782 2 208.1C2 216.418 5.29018 224.399 11.1525 230.3L103.253 322.4C111.949 331.081 122.273 337.962 133.632 342.646C144.992 347.331 157.165 349.728 169.453 349.7C173.465 349.683 177.473 349.415 181.453 348.9C195.503 356.891 211.389 361.095 227.553 361.1C251.74 360.938 275.075 352.143 293.353 336.3L324.453 305.9C337.917 292.393 345.989 274.436 347.153 255.4C349.753 211.5 338.753 167.1 326.353 124.5ZM157.153 87.7C160.069 84.9359 163.934 83.3952 167.953 83.3952C171.971 83.3952 175.836 84.9359 178.753 87.7L211.153 120.2C211.057 121.665 211.057 123.135 211.153 124.6V143.6L156.453 88.9C156.658 88.4842 156.892 88.0833 157.153 87.7ZM114.653 311.4L22.5525 219.3C21.1254 217.887 19.9926 216.205 19.2195 214.351C18.4464 212.497 18.0483 210.508 18.0483 208.5C18.0483 206.492 18.4464 204.503 19.2195 202.649C19.9926 200.795 21.1254 199.113 22.5525 197.7C25.4573 194.913 29.327 193.357 33.3525 193.357C37.378 193.357 41.2477 194.913 44.1525 197.7L94.1525 247.7C95.6817 249.179 97.7255 250.005 99.8525 250.005C101.98 250.005 104.023 249.179 105.553 247.7C107.055 246.183 107.898 244.135 107.898 242C107.898 239.865 107.055 237.817 105.553 236.3L33.6525 164.4C32.1126 162.989 30.882 161.274 30.0386 159.364C29.1952 157.453 28.7573 155.388 28.7525 153.3C28.7422 151.281 29.1449 149.282 29.936 147.424C30.7271 145.567 31.8897 143.891 33.3525 142.5C36.2203 139.642 40.1039 138.037 44.1525 138.037C48.2012 138.037 52.0848 139.642 54.9525 142.5L126.853 214.5C128.382 215.979 130.425 216.805 132.553 216.805C134.68 216.805 136.723 215.979 138.253 214.5C139.755 212.983 140.598 210.935 140.598 208.8C140.598 206.665 139.755 204.617 138.253 203.1L46.0525 110.9C44.6171 109.493 43.4791 107.812 42.7061 105.957C41.9331 104.102 41.5408 102.11 41.5525 100.1C41.5497 98.0766 41.9458 96.0725 42.7179 94.2022C43.49 92.3319 44.6231 90.6321 46.0525 89.2C48.969 86.4359 52.8343 84.8952 56.8525 84.8952C60.8708 84.8952 64.7361 86.4359 67.6525 89.2L87.6525 109.2L159.453 181.1C161.007 182.376 162.98 183.028 164.989 182.929C166.997 182.83 168.897 181.988 170.319 180.566C171.741 179.144 172.583 177.245 172.682 175.236C172.78 173.228 172.128 171.254 170.853 169.7L98.9525 97.8C97.5254 96.3867 96.3926 94.7046 95.6195 92.8508C94.8464 90.9971 94.4483 89.0085 94.4483 87C94.4483 84.9915 94.8464 83.0029 95.6195 81.1492C96.3926 79.2955 97.5254 77.6133 98.9525 76.2C101.85 73.36 105.745 71.7692 109.803 71.7692C113.86 71.7692 117.755 73.36 120.653 76.2L212.753 168.3C213.896 169.407 215.337 170.157 216.9 170.459C218.462 170.761 220.079 170.601 221.553 170C223.001 169.377 224.236 168.345 225.106 167.031C225.977 165.716 226.445 164.176 226.453 162.6V124.5C226.441 123.005 226.677 121.518 227.153 120.1C228.003 117.246 229.742 114.737 232.115 112.939C234.489 111.141 237.375 110.146 240.353 110.1C243.037 110.088 245.67 110.832 247.952 112.247C250.233 113.662 252.07 115.69 253.253 118.1C259.253 139.6 264.053 158.1 267.753 176.2C272.301 197.955 274.082 220.198 273.053 242.4C272.174 257.513 265.725 271.764 254.953 282.4L224.753 313.6C212.687 324.275 197.786 331.222 181.853 333.6C169.693 335.518 157.251 334.504 145.563 330.642C133.874 326.781 123.277 320.184 114.653 311.4ZM331.153 254C330.191 269.092 323.755 283.315 313.053 294L282.453 324.9C272.299 333.772 260.128 340.024 247.003 343.109C233.877 346.195 220.195 346.02 207.153 342.6C217.476 338.576 227.096 332.94 235.653 325.9L266.653 294.8C280.254 281.337 288.378 263.308 289.453 244.2C290.57 220.96 288.722 197.673 283.953 174.9L284.553 135.9C284.539 134.032 284.897 132.179 285.606 130.45C286.315 128.721 287.361 127.151 288.682 125.829C290.003 124.508 291.574 123.463 293.303 122.754C295.032 122.045 296.884 121.687 298.753 121.7C301.396 121.697 303.986 122.448 306.217 123.865C308.449 125.282 310.23 127.306 311.353 129.7C323.153 171.8 333.653 213 331.153 254ZM125.753 42.6C126.488 43.3551 127.365 43.958 128.333 44.3742C129.302 44.7904 130.343 45.0117 131.396 45.0257C132.45 45.0396 133.497 44.8458 134.476 44.4553C135.455 44.0649 136.347 43.4854 137.103 42.75C137.858 42.0146 138.46 41.1377 138.877 40.1693C139.293 39.2009 139.514 38.16 139.528 37.1061C139.542 36.0521 139.348 35.0058 138.958 34.0267C138.567 33.0477 137.988 32.1551 137.253 31.4L120.353 13.8C118.821 12.4934 116.858 11.8038 114.846 11.8657C112.834 11.9276 110.917 12.7365 109.469 14.1347C108.021 15.533 107.145 17.4204 107.013 19.429C106.88 21.4377 107.5 23.4237 108.753 25L125.753 42.6ZM165.753 38C167.874 38 169.909 37.1571 171.409 35.6568C172.91 34.1566 173.753 32.1217 173.753 30V10C173.753 7.87827 172.91 5.84344 171.409 4.34314C169.909 2.84285 167.874 2 165.753 2C163.631 2 161.596 2.84285 160.096 4.34314C158.595 5.84344 157.753 7.87827 157.753 10V30C157.751 32.0708 158.553 34.0614 159.989 35.5534C161.425 37.0453 163.383 37.9223 165.453 38H165.753ZM199.553 45C201.644 44.9757 203.648 44.1529 205.153 42.7L221.853 25.9C223.247 24.3908 224.007 22.4029 223.975 20.3485C223.944 18.2941 223.123 16.3305 221.683 14.8649C220.243 13.3992 218.294 12.5437 216.241 12.4758C214.187 12.4079 212.186 13.1327 210.653 14.5L193.653 31.1C192.9 31.8358 192.301 32.7146 191.893 33.6849C191.484 34.6552 191.274 35.6973 191.274 36.75C191.274 37.8027 191.484 38.8448 191.893 39.8151C192.301 40.7854 192.9 41.6642 193.653 42.4C194.36 43.1917 195.221 43.8306 196.184 44.2777C197.147 44.7247 198.191 44.9705 199.253 45H199.553Z" />
                </mask>
                <path
                  d="M326.353 124.5C324.144 119.113 320.416 114.485 315.623 111.181C310.83 107.876 305.179 106.038 299.359 105.889C293.539 105.741 287.802 107.289 282.847 110.345C277.892 113.401 273.933 117.833 271.453 123.1L268.753 113.1C266.793 108.435 263.685 104.342 259.718 101.201C255.751 98.0603 251.055 95.9736 246.065 95.1353C241.075 94.2971 235.955 94.7344 231.179 96.4067C226.404 98.079 222.129 100.932 218.753 104.7L190.153 75.9C184.154 70.2244 176.21 67.0617 167.953 67.0617C159.695 67.0617 151.751 70.2244 145.753 75.9C145.477 76.3177 145.176 76.7184 144.853 77.1L132.453 64.7C126.478 58.979 118.525 55.7856 110.253 55.7856C101.98 55.7856 94.0275 58.979 88.0525 64.7C84.3337 68.5873 81.6217 73.3248 80.1525 78.5L79.1525 77.5C73.1544 71.8244 65.2102 68.6617 56.9525 68.6617C48.6948 68.6617 40.7507 71.8244 34.7525 77.5C28.9143 83.414 25.6407 91.3897 25.6407 99.7C25.6407 108.01 28.9143 115.986 34.7525 121.9L35.8525 122.9C30.6832 124.313 25.9649 127.034 22.1525 130.8C19.2167 133.694 16.8854 137.142 15.2941 140.944C13.7029 144.747 12.8834 148.828 12.8834 152.95C12.8834 157.072 13.7029 161.153 15.2941 164.956C16.8854 168.758 19.2167 172.206 22.1525 175.1L25.3525 178.3C20.0255 179.52 15.1223 182.144 11.1525 185.9C5.29018 191.801 2 199.782 2 208.1C2 216.418 5.29018 224.399 11.1525 230.3L103.253 322.4C111.949 331.081 122.273 337.962 133.632 342.646C144.992 347.331 157.165 349.728 169.453 349.7C173.465 349.683 177.473 349.415 181.453 348.9C195.503 356.891 211.389 361.095 227.553 361.1C251.74 360.938 275.075 352.143 293.353 336.3L324.453 305.9C337.917 292.393 345.989 274.436 347.153 255.4C349.753 211.5 338.753 167.1 326.353 124.5ZM157.153 87.7C160.069 84.9359 163.934 83.3952 167.953 83.3952C171.971 83.3952 175.836 84.9359 178.753 87.7L211.153 120.2C211.057 121.665 211.057 123.135 211.153 124.6V143.6L156.453 88.9C156.658 88.4842 156.892 88.0833 157.153 87.7ZM114.653 311.4L22.5525 219.3C21.1254 217.887 19.9926 216.205 19.2195 214.351C18.4464 212.497 18.0483 210.508 18.0483 208.5C18.0483 206.492 18.4464 204.503 19.2195 202.649C19.9926 200.795 21.1254 199.113 22.5525 197.7C25.4573 194.913 29.327 193.357 33.3525 193.357C37.378 193.357 41.2477 194.913 44.1525 197.7L94.1525 247.7C95.6817 249.179 97.7255 250.005 99.8525 250.005C101.98 250.005 104.023 249.179 105.553 247.7C107.055 246.183 107.898 244.135 107.898 242C107.898 239.865 107.055 237.817 105.553 236.3L33.6525 164.4C32.1126 162.989 30.882 161.274 30.0386 159.364C29.1952 157.453 28.7573 155.388 28.7525 153.3C28.7422 151.281 29.1449 149.282 29.936 147.424C30.7271 145.567 31.8897 143.891 33.3525 142.5C36.2203 139.642 40.1039 138.037 44.1525 138.037C48.2012 138.037 52.0848 139.642 54.9525 142.5L126.853 214.5C128.382 215.979 130.425 216.805 132.553 216.805C134.68 216.805 136.723 215.979 138.253 214.5C139.755 212.983 140.598 210.935 140.598 208.8C140.598 206.665 139.755 204.617 138.253 203.1L46.0525 110.9C44.6171 109.493 43.4791 107.812 42.7061 105.957C41.9331 104.102 41.5408 102.11 41.5525 100.1C41.5497 98.0766 41.9458 96.0725 42.7179 94.2022C43.49 92.3319 44.6231 90.6321 46.0525 89.2C48.969 86.4359 52.8343 84.8952 56.8525 84.8952C60.8708 84.8952 64.7361 86.4359 67.6525 89.2L87.6525 109.2L159.453 181.1C161.007 182.376 162.98 183.028 164.989 182.929C166.997 182.83 168.897 181.988 170.319 180.566C171.741 179.144 172.583 177.245 172.682 175.236C172.78 173.228 172.128 171.254 170.853 169.7L98.9525 97.8C97.5254 96.3867 96.3926 94.7046 95.6195 92.8508C94.8464 90.9971 94.4483 89.0085 94.4483 87C94.4483 84.9915 94.8464 83.0029 95.6195 81.1492C96.3926 79.2955 97.5254 77.6133 98.9525 76.2C101.85 73.36 105.745 71.7692 109.803 71.7692C113.86 71.7692 117.755 73.36 120.653 76.2L212.753 168.3C213.896 169.407 215.337 170.157 216.9 170.459C218.462 170.761 220.079 170.601 221.553 170C223.001 169.377 224.236 168.345 225.106 167.031C225.977 165.716 226.445 164.176 226.453 162.6V124.5C226.441 123.005 226.677 121.518 227.153 120.1C228.003 117.246 229.742 114.737 232.115 112.939C234.489 111.141 237.375 110.146 240.353 110.1C243.037 110.088 245.67 110.832 247.952 112.247C250.233 113.662 252.07 115.69 253.253 118.1C259.253 139.6 264.053 158.1 267.753 176.2C272.301 197.955 274.082 220.198 273.053 242.4C272.174 257.513 265.725 271.764 254.953 282.4L224.753 313.6C212.687 324.275 197.786 331.222 181.853 333.6C169.693 335.518 157.251 334.504 145.563 330.642C133.874 326.781 123.277 320.184 114.653 311.4ZM331.153 254C330.191 269.092 323.755 283.315 313.053 294L282.453 324.9C272.299 333.772 260.128 340.024 247.003 343.109C233.877 346.195 220.195 346.02 207.153 342.6C217.476 338.576 227.096 332.94 235.653 325.9L266.653 294.8C280.254 281.337 288.378 263.308 289.453 244.2C290.57 220.96 288.722 197.673 283.953 174.9L284.553 135.9C284.539 134.032 284.897 132.179 285.606 130.45C286.315 128.721 287.361 127.151 288.682 125.829C290.003 124.508 291.574 123.463 293.303 122.754C295.032 122.045 296.884 121.687 298.753 121.7C301.396 121.697 303.986 122.448 306.217 123.865C308.449 125.282 310.23 127.306 311.353 129.7C323.153 171.8 333.653 213 331.153 254ZM125.753 42.6C126.488 43.3551 127.365 43.958 128.333 44.3742C129.302 44.7904 130.343 45.0117 131.396 45.0257C132.45 45.0396 133.497 44.8458 134.476 44.4553C135.455 44.0649 136.347 43.4854 137.103 42.75C137.858 42.0146 138.46 41.1377 138.877 40.1693C139.293 39.2009 139.514 38.16 139.528 37.1061C139.542 36.0521 139.348 35.0058 138.958 34.0267C138.567 33.0477 137.988 32.1551 137.253 31.4L120.353 13.8C118.821 12.4934 116.858 11.8038 114.846 11.8657C112.834 11.9276 110.917 12.7365 109.469 14.1347C108.021 15.533 107.145 17.4204 107.013 19.429C106.88 21.4377 107.5 23.4237 108.753 25L125.753 42.6ZM165.753 38C167.874 38 169.909 37.1571 171.409 35.6568C172.91 34.1566 173.753 32.1217 173.753 30V10C173.753 7.87827 172.91 5.84344 171.409 4.34314C169.909 2.84285 167.874 2 165.753 2C163.631 2 161.596 2.84285 160.096 4.34314C158.595 5.84344 157.753 7.87827 157.753 10V30C157.751 32.0708 158.553 34.0614 159.989 35.5534C161.425 37.0453 163.383 37.9223 165.453 38H165.753ZM199.553 45C201.644 44.9757 203.648 44.1529 205.153 42.7L221.853 25.9C223.247 24.3908 224.007 22.4029 223.975 20.3485C223.944 18.2941 223.123 16.3305 221.683 14.8649C220.243 13.3992 218.294 12.5437 216.241 12.4758C214.187 12.4079 212.186 13.1327 210.653 14.5L193.653 31.1C192.9 31.8358 192.301 32.7146 191.893 33.6849C191.484 34.6552 191.274 35.6973 191.274 36.75C191.274 37.8027 191.484 38.8448 191.893 39.8151C192.301 40.7854 192.9 41.6642 193.653 42.4C194.36 43.1917 195.221 43.8306 196.184 44.2777C197.147 44.7247 198.191 44.9705 199.253 45H199.553Z"
                  fill="currentColor"
                />
                <path
                  d="M326.353 124.5C324.144 119.113 320.416 114.485 315.623 111.181C310.83 107.876 305.179 106.038 299.359 105.889C293.539 105.741 287.802 107.289 282.847 110.345C277.892 113.401 273.933 117.833 271.453 123.1L268.753 113.1C266.793 108.435 263.685 104.342 259.718 101.201C255.751 98.0603 251.055 95.9736 246.065 95.1353C241.075 94.2971 235.955 94.7344 231.179 96.4067C226.404 98.079 222.129 100.932 218.753 104.7L190.153 75.9C184.154 70.2244 176.21 67.0617 167.953 67.0617C159.695 67.0617 151.751 70.2244 145.753 75.9C145.477 76.3177 145.176 76.7184 144.853 77.1L132.453 64.7C126.478 58.979 118.525 55.7856 110.253 55.7856C101.98 55.7856 94.0275 58.979 88.0525 64.7C84.3337 68.5873 81.6217 73.3248 80.1525 78.5L79.1525 77.5C73.1544 71.8244 65.2102 68.6617 56.9525 68.6617C48.6948 68.6617 40.7507 71.8244 34.7525 77.5C28.9143 83.414 25.6407 91.3897 25.6407 99.7C25.6407 108.01 28.9143 115.986 34.7525 121.9L35.8525 122.9C30.6832 124.313 25.9649 127.034 22.1525 130.8C19.2167 133.694 16.8854 137.142 15.2941 140.944C13.7029 144.747 12.8834 148.828 12.8834 152.95C12.8834 157.072 13.7029 161.153 15.2941 164.956C16.8854 168.758 19.2167 172.206 22.1525 175.1L25.3525 178.3C20.0255 179.52 15.1223 182.144 11.1525 185.9C5.29018 191.801 2 199.782 2 208.1C2 216.418 5.29018 224.399 11.1525 230.3L103.253 322.4C111.949 331.081 122.273 337.962 133.632 342.646C144.992 347.331 157.165 349.728 169.453 349.7C173.465 349.683 177.473 349.415 181.453 348.9C195.503 356.891 211.389 361.095 227.553 361.1C251.74 360.938 275.075 352.143 293.353 336.3L324.453 305.9C337.917 292.393 345.989 274.436 347.153 255.4C349.753 211.5 338.753 167.1 326.353 124.5ZM157.153 87.7C160.069 84.9359 163.934 83.3952 167.953 83.3952C171.971 83.3952 175.836 84.9359 178.753 87.7L211.153 120.2C211.057 121.665 211.057 123.135 211.153 124.6V143.6L156.453 88.9C156.658 88.4842 156.892 88.0833 157.153 87.7ZM114.653 311.4L22.5525 219.3C21.1254 217.887 19.9926 216.205 19.2195 214.351C18.4464 212.497 18.0483 210.508 18.0483 208.5C18.0483 206.492 18.4464 204.503 19.2195 202.649C19.9926 200.795 21.1254 199.113 22.5525 197.7C25.4573 194.913 29.327 193.357 33.3525 193.357C37.378 193.357 41.2477 194.913 44.1525 197.7L94.1525 247.7C95.6817 249.179 97.7255 250.005 99.8525 250.005C101.98 250.005 104.023 249.179 105.553 247.7C107.055 246.183 107.898 244.135 107.898 242C107.898 239.865 107.055 237.817 105.553 236.3L33.6525 164.4C32.1126 162.989 30.882 161.274 30.0386 159.364C29.1952 157.453 28.7573 155.388 28.7525 153.3C28.7422 151.281 29.1449 149.282 29.936 147.424C30.7271 145.567 31.8897 143.891 33.3525 142.5C36.2203 139.642 40.1039 138.037 44.1525 138.037C48.2012 138.037 52.0848 139.642 54.9525 142.5L126.853 214.5C128.382 215.979 130.425 216.805 132.553 216.805C134.68 216.805 136.723 215.979 138.253 214.5C139.755 212.983 140.598 210.935 140.598 208.8C140.598 206.665 139.755 204.617 138.253 203.1L46.0525 110.9C44.6171 109.493 43.4791 107.812 42.7061 105.957C41.9331 104.102 41.5408 102.11 41.5525 100.1C41.5497 98.0766 41.9458 96.0725 42.7179 94.2022C43.49 92.3319 44.6231 90.6321 46.0525 89.2C48.969 86.4359 52.8343 84.8952 56.8525 84.8952C60.8708 84.8952 64.7361 86.4359 67.6525 89.2L87.6525 109.2L159.453 181.1C161.007 182.376 162.98 183.028 164.989 182.929C166.997 182.83 168.897 181.988 170.319 180.566C171.741 179.144 172.583 177.245 172.682 175.236C172.78 173.228 172.128 171.254 170.853 169.7L98.9525 97.8C97.5254 96.3867 96.3926 94.7046 95.6195 92.8508C94.8464 90.9971 94.4483 89.0085 94.4483 87C94.4483 84.9915 94.8464 83.0029 95.6195 81.1492C96.3926 79.2955 97.5254 77.6133 98.9525 76.2C101.85 73.36 105.745 71.7692 109.803 71.7692C113.86 71.7692 117.755 73.36 120.653 76.2L212.753 168.3C213.896 169.407 215.337 170.157 216.9 170.459C218.462 170.761 220.079 170.601 221.553 170C223.001 169.377 224.236 168.345 225.106 167.031C225.977 165.716 226.445 164.176 226.453 162.6V124.5C226.441 123.005 226.677 121.518 227.153 120.1C228.003 117.246 229.742 114.737 232.115 112.939C234.489 111.141 237.375 110.146 240.353 110.1C243.037 110.088 245.67 110.832 247.952 112.247C250.233 113.662 252.07 115.69 253.253 118.1C259.253 139.6 264.053 158.1 267.753 176.2C272.301 197.955 274.082 220.198 273.053 242.4C272.174 257.513 265.725 271.764 254.953 282.4L224.753 313.6C212.687 324.275 197.786 331.222 181.853 333.6C169.693 335.518 157.251 334.504 145.563 330.642C133.874 326.781 123.277 320.184 114.653 311.4ZM331.153 254C330.191 269.092 323.755 283.315 313.053 294L282.453 324.9C272.299 333.772 260.128 340.024 247.003 343.109C233.877 346.195 220.195 346.02 207.153 342.6C217.476 338.576 227.096 332.94 235.653 325.9L266.653 294.8C280.254 281.337 288.378 263.308 289.453 244.2C290.57 220.96 288.722 197.673 283.953 174.9L284.553 135.9C284.539 134.032 284.897 132.179 285.606 130.45C286.315 128.721 287.361 127.151 288.682 125.829C290.003 124.508 291.574 123.463 293.303 122.754C295.032 122.045 296.884 121.687 298.753 121.7C301.396 121.697 303.986 122.448 306.217 123.865C308.449 125.282 310.23 127.306 311.353 129.7C323.153 171.8 333.653 213 331.153 254ZM125.753 42.6C126.488 43.3551 127.365 43.958 128.333 44.3742C129.302 44.7904 130.343 45.0117 131.396 45.0257C132.45 45.0396 133.497 44.8458 134.476 44.4553C135.455 44.0649 136.347 43.4854 137.103 42.75C137.858 42.0146 138.46 41.1377 138.877 40.1693C139.293 39.2009 139.514 38.16 139.528 37.1061C139.542 36.0521 139.348 35.0058 138.958 34.0267C138.567 33.0477 137.988 32.1551 137.253 31.4L120.353 13.8C118.821 12.4934 116.858 11.8038 114.846 11.8657C112.834 11.9276 110.917 12.7365 109.469 14.1347C108.021 15.533 107.145 17.4204 107.013 19.429C106.88 21.4377 107.5 23.4237 108.753 25L125.753 42.6ZM165.753 38C167.874 38 169.909 37.1571 171.409 35.6568C172.91 34.1566 173.753 32.1217 173.753 30V10C173.753 7.87827 172.91 5.84344 171.409 4.34314C169.909 2.84285 167.874 2 165.753 2C163.631 2 161.596 2.84285 160.096 4.34314C158.595 5.84344 157.753 7.87827 157.753 10V30C157.751 32.0708 158.553 34.0614 159.989 35.5534C161.425 37.0453 163.383 37.9223 165.453 38H165.753ZM199.553 45C201.644 44.9757 203.648 44.1529 205.153 42.7L221.853 25.9C223.247 24.3908 224.007 22.4029 223.975 20.3485C223.944 18.2941 223.123 16.3305 221.683 14.8649C220.243 13.3992 218.294 12.5437 216.241 12.4758C214.187 12.4079 212.186 13.1327 210.653 14.5L193.653 31.1C192.9 31.8358 192.301 32.7146 191.893 33.6849C191.484 34.6552 191.274 35.6973 191.274 36.75C191.274 37.8027 191.484 38.8448 191.893 39.8151C192.301 40.7854 192.9 41.6642 193.653 42.4C194.36 43.1917 195.221 43.8306 196.184 44.2777C197.147 44.7247 198.191 44.9705 199.253 45H199.553Z"
                  stroke="currentColor"
                  strokeWidth="8"
                  mask="url(#path-1-outside-1_1_539)"
                />
              </svg>
            )}

            <span className="tw-text-iron-400 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
              Rep
            </span>
            {!!drop.rep && (
              <div
                className={`${getRepColor()} tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-xs tw-font-medium`}
              >
                {formatNumberWithCommas(drop.rep)}
              </div>
            )}
          </>
        </DropListItemActionsItemWrapper>
      </div>
    </Tippy>
  );
}
