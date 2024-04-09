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
  activeState,
  setState,
}: {
  readonly drop: DropFull;
  readonly activeState: RepActionExpandable;
  readonly setState: (state: RepActionExpandable) => void;
}) {
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
          activeState={activeState}
          setState={setState}
        >
          <>
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 hover-hover:tw-text-white tw-transition tw-ease-out tw-duration-300"
              width="354"
              height="368"
              viewBox="0 0 354 368"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <mask
                id="path-1-outside"
                maskUnits="userSpaceOnUse"
                x="0.247559"
                y="0.0999756"
                width="354"
                height="368"
                fill="currentColor"
              >
                <rect
                  fill="white"
                  x="0.247559"
                  y="0.0999756"
                  width="354"
                  height="368"
                />
                <path d="M328.6 126.6C326.392 121.213 322.664 116.585 317.871 113.281C313.078 109.976 307.427 108.138 301.607 107.989C295.787 107.841 290.05 109.389 285.094 112.445C280.139 115.501 276.18 119.933 273.7 125.2L271 115.2C269.04 110.535 265.932 106.442 261.966 103.301C257.999 100.16 253.302 98.0736 248.313 97.2353C243.323 96.397 238.202 96.8344 233.427 98.5067C228.651 100.179 224.377 103.032 221 106.8L192.4 78C186.402 72.3244 178.458 69.1616 170.2 69.1616C161.942 69.1616 153.998 72.3244 148 78C147.724 78.4176 147.424 78.8183 147.1 79.2L134.7 66.8C128.725 61.079 120.772 57.8855 112.5 57.8855C104.228 57.8855 96.275 61.079 90.3001 66.8C86.5813 70.6873 83.8692 75.4248 82.4001 80.6L81.4001 79.6C75.4019 73.9244 67.4578 70.7616 59.2001 70.7616C50.9423 70.7616 42.9982 73.9244 37.0001 79.6C31.1619 85.514 27.8883 93.4897 27.8883 101.8C27.8883 110.11 31.1619 118.086 37.0001 124L38.1001 125C32.9307 126.413 28.2125 129.134 24.4001 132.9C21.4643 135.793 19.1329 139.242 17.5417 143.044C15.9504 146.847 15.131 150.928 15.131 155.05C15.131 159.172 15.9504 163.253 17.5417 167.056C19.1329 170.858 21.4643 174.306 24.4001 177.2L27.6001 180.4C22.273 181.62 17.3698 184.244 13.4001 188C7.53773 193.901 4.24756 201.882 4.24756 210.2C4.24756 218.518 7.53773 226.499 13.4001 232.4L105.5 324.5C114.196 333.181 124.52 340.062 135.88 344.746C147.24 349.431 159.412 351.828 171.7 351.8C175.713 351.783 179.721 351.515 183.7 351C197.75 358.991 213.636 363.195 229.8 363.2C253.988 363.038 277.322 354.243 295.6 338.4L326.7 308C340.164 294.493 348.236 276.536 349.4 257.5C352 213.6 341 169.2 328.6 126.6ZM159.4 89.8C162.317 87.0358 166.182 85.4951 170.2 85.4951C174.218 85.4951 178.084 87.0358 181 89.8L213.4 122.3C213.304 123.765 213.304 125.235 213.4 126.7V145.7L158.7 91C158.905 90.5842 159.139 90.1833 159.4 89.8ZM116.9 313.5L24.8001 221.4C23.373 219.987 22.2402 218.305 21.467 216.451C20.6939 214.597 20.2959 212.608 20.2959 210.6C20.2959 208.591 20.6939 206.603 21.467 204.749C22.2402 202.895 23.373 201.213 24.8001 199.8C27.7049 197.013 31.5746 195.457 35.6001 195.457C39.6256 195.457 43.4953 197.013 46.4001 199.8L96.4001 249.8C97.9292 251.279 99.973 252.105 102.1 252.105C104.227 252.105 106.271 251.279 107.8 249.8C109.302 248.283 110.145 246.235 110.145 244.1C110.145 241.965 109.302 239.917 107.8 238.4L35.9001 166.5C34.3601 165.089 33.1295 163.374 32.2861 161.464C31.4427 159.553 31.0048 157.488 31.0001 155.4C30.9897 153.381 31.3925 151.382 32.1835 149.524C32.9746 147.667 34.1373 145.991 35.6001 144.6C38.4678 141.742 42.3514 140.137 46.4001 140.137C50.4487 140.137 54.3323 141.742 57.2001 144.6L129.1 216.6C130.629 218.079 132.673 218.905 134.8 218.905C136.927 218.905 138.971 218.079 140.5 216.6C142.002 215.083 142.845 213.035 142.845 210.9C142.845 208.765 142.002 206.717 140.5 205.2L48.3001 113C46.8647 111.593 45.7267 109.912 44.9537 108.057C44.1806 106.202 43.7883 104.21 43.8001 102.2C43.7973 100.177 44.1933 98.1725 44.9654 96.3022C45.7376 94.4319 46.8707 92.7321 48.3001 91.3C51.2165 88.5358 55.0818 86.9951 59.1001 86.9951C63.1183 86.9951 66.9836 88.5358 69.9001 91.3L89.9001 111.3L161.7 183.2C163.254 184.476 165.228 185.128 167.236 185.029C169.245 184.93 171.145 184.088 172.566 182.666C173.988 181.244 174.83 179.344 174.929 177.336C175.028 175.328 174.376 173.354 173.1 171.8L101.2 99.9C99.773 98.4867 98.6402 96.8045 97.867 94.9508C97.0939 93.097 96.6959 91.1085 96.6959 89.1C96.6959 87.0915 97.0939 85.1029 97.867 83.2492C98.6402 81.3954 99.773 79.7133 101.2 78.3C104.097 75.46 107.993 73.8692 112.05 73.8692C116.107 73.8692 120.003 75.46 122.9 78.3L215 170.4C216.144 171.507 217.585 172.257 219.147 172.559C220.71 172.861 222.327 172.701 223.8 172.1C225.248 171.477 226.483 170.445 227.354 169.131C228.224 167.816 228.692 166.276 228.7 164.7V126.6C228.688 125.105 228.925 123.618 229.4 122.2C230.251 119.346 231.989 116.837 234.363 115.039C236.737 113.241 239.622 112.246 242.6 112.2C245.284 112.188 247.918 112.932 250.199 114.347C252.48 115.762 254.317 117.79 255.5 120.2C261.5 141.7 266.3 160.2 270 178.3C274.548 200.055 276.329 222.298 275.3 244.5C274.422 259.613 267.973 273.864 257.2 284.5L227 315.7C214.935 326.375 200.033 333.322 184.1 335.7C171.941 337.618 159.499 336.604 147.81 332.742C136.122 328.881 125.524 322.284 116.9 313.5ZM333.4 256.1C332.439 271.192 326.003 285.415 315.3 296.1L284.7 327C274.547 335.872 262.376 342.124 249.25 345.209C236.124 348.295 222.443 348.12 209.4 344.7C219.724 340.676 229.344 335.04 237.9 328L268.9 296.9C282.502 283.437 290.626 265.407 291.7 246.3C292.818 223.06 290.969 199.773 286.2 177L286.8 138C286.787 136.131 287.145 134.279 287.854 132.55C288.563 130.821 289.608 129.251 290.929 127.929C292.251 126.608 293.821 125.563 295.55 124.854C297.279 124.145 299.132 123.787 301 123.8C303.644 123.797 306.233 124.548 308.465 125.965C310.697 127.382 312.478 129.406 313.6 131.8C325.4 173.9 335.9 215.1 333.4 256.1ZM128 44.7C128.735 45.4551 129.612 46.0579 130.581 46.4741C131.549 46.8903 132.59 47.1117 133.644 47.1256C134.698 47.1396 135.744 46.9458 136.723 46.5553C137.702 46.1649 138.595 45.5854 139.35 44.85C140.105 44.1146 140.708 43.2376 141.124 42.2692C141.54 41.3009 141.762 40.26 141.776 39.206C141.79 38.1521 141.596 37.1057 141.205 36.1267C140.815 35.1476 140.235 34.2551 139.5 33.5L122.6 15.9C121.069 14.5934 119.106 13.9038 117.094 13.9657C115.081 14.0276 113.165 14.8364 111.716 16.2347C110.268 17.6329 109.393 19.5203 109.26 21.529C109.128 23.5377 109.748 25.5237 111 27.1L128 44.7ZM168 40.1C170.122 40.1 172.157 39.2571 173.657 37.7568C175.157 36.2565 176 34.2217 176 32.1V12.1C176 9.97824 175.157 7.94341 173.657 6.44312C172.157 4.94283 170.122 4.09998 168 4.09998C165.878 4.09998 163.844 4.94283 162.343 6.44312C160.843 7.94341 160 9.97824 160 12.1V32.1C159.999 34.1707 160.8 36.1614 162.236 37.6534C163.672 39.1453 165.631 40.0223 167.7 40.1H168ZM201.8 47.1C203.892 47.0757 205.895 46.2529 207.4 44.8L224.1 28C225.494 26.4907 226.254 24.5029 226.223 22.4485C226.191 20.394 225.37 18.4305 223.93 16.9648C222.491 15.4991 220.542 14.6437 218.488 14.5758C216.435 14.5079 214.434 15.2327 212.9 16.6L195.9 33.2C195.147 33.9358 194.549 34.8146 194.14 35.7849C193.732 36.7551 193.522 37.7972 193.522 38.85C193.522 39.9027 193.732 40.9448 194.14 41.9151C194.549 42.8853 195.147 43.7642 195.9 44.5C196.607 45.2916 197.469 45.9306 198.432 46.3777C199.395 46.8247 200.439 47.0705 201.5 47.1H201.8Z" />
              </mask>
              <path
                d="M328.6 126.6C326.392 121.213 322.664 116.585 317.871 113.281C313.078 109.976 307.427 108.138 301.607 107.989C295.787 107.841 290.05 109.389 285.094 112.445C280.139 115.501 276.18 119.933 273.7 125.2L271 115.2C269.04 110.535 265.932 106.442 261.966 103.301C257.999 100.16 253.302 98.0736 248.313 97.2353C243.323 96.397 238.202 96.8344 233.427 98.5067C228.651 100.179 224.377 103.032 221 106.8L192.4 78C186.402 72.3244 178.458 69.1616 170.2 69.1616C161.942 69.1616 153.998 72.3244 148 78C147.724 78.4176 147.424 78.8183 147.1 79.2L134.7 66.8C128.725 61.079 120.772 57.8855 112.5 57.8855C104.228 57.8855 96.275 61.079 90.3001 66.8C86.5813 70.6873 83.8692 75.4248 82.4001 80.6L81.4001 79.6C75.4019 73.9244 67.4578 70.7616 59.2001 70.7616C50.9423 70.7616 42.9982 73.9244 37.0001 79.6C31.1619 85.514 27.8883 93.4897 27.8883 101.8C27.8883 110.11 31.1619 118.086 37.0001 124L38.1001 125C32.9307 126.413 28.2125 129.134 24.4001 132.9C21.4643 135.793 19.1329 139.242 17.5417 143.044C15.9504 146.847 15.131 150.928 15.131 155.05C15.131 159.172 15.9504 163.253 17.5417 167.056C19.1329 170.858 21.4643 174.306 24.4001 177.2L27.6001 180.4C22.273 181.62 17.3698 184.244 13.4001 188C7.53773 193.901 4.24756 201.882 4.24756 210.2C4.24756 218.518 7.53773 226.499 13.4001 232.4L105.5 324.5C114.196 333.181 124.52 340.062 135.88 344.746C147.24 349.431 159.412 351.828 171.7 351.8C175.713 351.783 179.721 351.515 183.7 351C197.75 358.991 213.636 363.195 229.8 363.2C253.988 363.038 277.322 354.243 295.6 338.4L326.7 308C340.164 294.493 348.236 276.536 349.4 257.5C352 213.6 341 169.2 328.6 126.6ZM159.4 89.8C162.317 87.0358 166.182 85.4951 170.2 85.4951C174.218 85.4951 178.084 87.0358 181 89.8L213.4 122.3C213.304 123.765 213.304 125.235 213.4 126.7V145.7L158.7 91C158.905 90.5842 159.139 90.1833 159.4 89.8ZM116.9 313.5L24.8001 221.4C23.373 219.987 22.2402 218.305 21.467 216.451C20.6939 214.597 20.2959 212.608 20.2959 210.6C20.2959 208.591 20.6939 206.603 21.467 204.749C22.2402 202.895 23.373 201.213 24.8001 199.8C27.7049 197.013 31.5746 195.457 35.6001 195.457C39.6256 195.457 43.4953 197.013 46.4001 199.8L96.4001 249.8C97.9292 251.279 99.973 252.105 102.1 252.105C104.227 252.105 106.271 251.279 107.8 249.8C109.302 248.283 110.145 246.235 110.145 244.1C110.145 241.965 109.302 239.917 107.8 238.4L35.9001 166.5C34.3601 165.089 33.1295 163.374 32.2861 161.464C31.4427 159.553 31.0048 157.488 31.0001 155.4C30.9897 153.381 31.3925 151.382 32.1835 149.524C32.9746 147.667 34.1373 145.991 35.6001 144.6C38.4678 141.742 42.3514 140.137 46.4001 140.137C50.4487 140.137 54.3323 141.742 57.2001 144.6L129.1 216.6C130.629 218.079 132.673 218.905 134.8 218.905C136.927 218.905 138.971 218.079 140.5 216.6C142.002 215.083 142.845 213.035 142.845 210.9C142.845 208.765 142.002 206.717 140.5 205.2L48.3001 113C46.8647 111.593 45.7267 109.912 44.9537 108.057C44.1806 106.202 43.7883 104.21 43.8001 102.2C43.7973 100.177 44.1933 98.1725 44.9654 96.3022C45.7376 94.4319 46.8707 92.7321 48.3001 91.3C51.2165 88.5358 55.0818 86.9951 59.1001 86.9951C63.1183 86.9951 66.9836 88.5358 69.9001 91.3L89.9001 111.3L161.7 183.2C163.254 184.476 165.228 185.128 167.236 185.029C169.245 184.93 171.145 184.088 172.566 182.666C173.988 181.244 174.83 179.344 174.929 177.336C175.028 175.328 174.376 173.354 173.1 171.8L101.2 99.9C99.773 98.4867 98.6402 96.8045 97.867 94.9508C97.0939 93.097 96.6959 91.1085 96.6959 89.1C96.6959 87.0915 97.0939 85.1029 97.867 83.2492C98.6402 81.3954 99.773 79.7133 101.2 78.3C104.097 75.46 107.993 73.8692 112.05 73.8692C116.107 73.8692 120.003 75.46 122.9 78.3L215 170.4C216.144 171.507 217.585 172.257 219.147 172.559C220.71 172.861 222.327 172.701 223.8 172.1C225.248 171.477 226.483 170.445 227.354 169.131C228.224 167.816 228.692 166.276 228.7 164.7V126.6C228.688 125.105 228.925 123.618 229.4 122.2C230.251 119.346 231.989 116.837 234.363 115.039C236.737 113.241 239.622 112.246 242.6 112.2C245.284 112.188 247.918 112.932 250.199 114.347C252.48 115.762 254.317 117.79 255.5 120.2C261.5 141.7 266.3 160.2 270 178.3C274.548 200.055 276.329 222.298 275.3 244.5C274.422 259.613 267.973 273.864 257.2 284.5L227 315.7C214.935 326.375 200.033 333.322 184.1 335.7C171.941 337.618 159.499 336.604 147.81 332.742C136.122 328.881 125.524 322.284 116.9 313.5ZM333.4 256.1C332.439 271.192 326.003 285.415 315.3 296.1L284.7 327C274.547 335.872 262.376 342.124 249.25 345.209C236.124 348.295 222.443 348.12 209.4 344.7C219.724 340.676 229.344 335.04 237.9 328L268.9 296.9C282.502 283.437 290.626 265.407 291.7 246.3C292.818 223.06 290.969 199.773 286.2 177L286.8 138C286.787 136.131 287.145 134.279 287.854 132.55C288.563 130.821 289.608 129.251 290.929 127.929C292.251 126.608 293.821 125.563 295.55 124.854C297.279 124.145 299.132 123.787 301 123.8C303.644 123.797 306.233 124.548 308.465 125.965C310.697 127.382 312.478 129.406 313.6 131.8C325.4 173.9 335.9 215.1 333.4 256.1ZM128 44.7C128.735 45.4551 129.612 46.0579 130.581 46.4741C131.549 46.8903 132.59 47.1117 133.644 47.1256C134.698 47.1396 135.744 46.9458 136.723 46.5553C137.702 46.1649 138.595 45.5854 139.35 44.85C140.105 44.1146 140.708 43.2376 141.124 42.2692C141.54 41.3009 141.762 40.26 141.776 39.206C141.79 38.1521 141.596 37.1057 141.205 36.1267C140.815 35.1476 140.235 34.2551 139.5 33.5L122.6 15.9C121.069 14.5934 119.106 13.9038 117.094 13.9657C115.081 14.0276 113.165 14.8364 111.716 16.2347C110.268 17.6329 109.393 19.5203 109.26 21.529C109.128 23.5377 109.748 25.5237 111 27.1L128 44.7ZM168 40.1C170.122 40.1 172.157 39.2571 173.657 37.7568C175.157 36.2565 176 34.2217 176 32.1V12.1C176 9.97824 175.157 7.94341 173.657 6.44312C172.157 4.94283 170.122 4.09998 168 4.09998C165.878 4.09998 163.844 4.94283 162.343 6.44312C160.843 7.94341 160 9.97824 160 12.1V32.1C159.999 34.1707 160.8 36.1614 162.236 37.6534C163.672 39.1453 165.631 40.0223 167.7 40.1H168ZM201.8 47.1C203.892 47.0757 205.895 46.2529 207.4 44.8L224.1 28C225.494 26.4907 226.254 24.5029 226.223 22.4485C226.191 20.394 225.37 18.4305 223.93 16.9648C222.491 15.4991 220.542 14.6437 218.488 14.5758C216.435 14.5079 214.434 15.2327 212.9 16.6L195.9 33.2C195.147 33.9358 194.549 34.8146 194.14 35.7849C193.732 36.7551 193.522 37.7972 193.522 38.85C193.522 39.9027 193.732 40.9448 194.14 41.9151C194.549 42.8853 195.147 43.7642 195.9 44.5C196.607 45.2916 197.469 45.9306 198.432 46.3777C199.395 46.8247 200.439 47.0705 201.5 47.1H201.8Z"
                fill="currentColor"
              />
              <path
                d="M328.6 126.6C326.392 121.213 322.664 116.585 317.871 113.281C313.078 109.976 307.427 108.138 301.607 107.989C295.787 107.841 290.05 109.389 285.094 112.445C280.139 115.501 276.18 119.933 273.7 125.2L271 115.2C269.04 110.535 265.932 106.442 261.966 103.301C257.999 100.16 253.302 98.0736 248.313 97.2353C243.323 96.397 238.202 96.8344 233.427 98.5067C228.651 100.179 224.377 103.032 221 106.8L192.4 78C186.402 72.3244 178.458 69.1616 170.2 69.1616C161.942 69.1616 153.998 72.3244 148 78C147.724 78.4176 147.424 78.8183 147.1 79.2L134.7 66.8C128.725 61.079 120.772 57.8855 112.5 57.8855C104.228 57.8855 96.275 61.079 90.3001 66.8C86.5813 70.6873 83.8692 75.4248 82.4001 80.6L81.4001 79.6C75.4019 73.9244 67.4578 70.7616 59.2001 70.7616C50.9423 70.7616 42.9982 73.9244 37.0001 79.6C31.1619 85.514 27.8883 93.4897 27.8883 101.8C27.8883 110.11 31.1619 118.086 37.0001 124L38.1001 125C32.9307 126.413 28.2125 129.134 24.4001 132.9C21.4643 135.793 19.1329 139.242 17.5417 143.044C15.9504 146.847 15.131 150.928 15.131 155.05C15.131 159.172 15.9504 163.253 17.5417 167.056C19.1329 170.858 21.4643 174.306 24.4001 177.2L27.6001 180.4C22.273 181.62 17.3698 184.244 13.4001 188C7.53773 193.901 4.24756 201.882 4.24756 210.2C4.24756 218.518 7.53773 226.499 13.4001 232.4L105.5 324.5C114.196 333.181 124.52 340.062 135.88 344.746C147.24 349.431 159.412 351.828 171.7 351.8C175.713 351.783 179.721 351.515 183.7 351C197.75 358.991 213.636 363.195 229.8 363.2C253.988 363.038 277.322 354.243 295.6 338.4L326.7 308C340.164 294.493 348.236 276.536 349.4 257.5C352 213.6 341 169.2 328.6 126.6ZM159.4 89.8C162.317 87.0358 166.182 85.4951 170.2 85.4951C174.218 85.4951 178.084 87.0358 181 89.8L213.4 122.3C213.304 123.765 213.304 125.235 213.4 126.7V145.7L158.7 91C158.905 90.5842 159.139 90.1833 159.4 89.8ZM116.9 313.5L24.8001 221.4C23.373 219.987 22.2402 218.305 21.467 216.451C20.6939 214.597 20.2959 212.608 20.2959 210.6C20.2959 208.591 20.6939 206.603 21.467 204.749C22.2402 202.895 23.373 201.213 24.8001 199.8C27.7049 197.013 31.5746 195.457 35.6001 195.457C39.6256 195.457 43.4953 197.013 46.4001 199.8L96.4001 249.8C97.9292 251.279 99.973 252.105 102.1 252.105C104.227 252.105 106.271 251.279 107.8 249.8C109.302 248.283 110.145 246.235 110.145 244.1C110.145 241.965 109.302 239.917 107.8 238.4L35.9001 166.5C34.3601 165.089 33.1295 163.374 32.2861 161.464C31.4427 159.553 31.0048 157.488 31.0001 155.4C30.9897 153.381 31.3925 151.382 32.1835 149.524C32.9746 147.667 34.1373 145.991 35.6001 144.6C38.4678 141.742 42.3514 140.137 46.4001 140.137C50.4487 140.137 54.3323 141.742 57.2001 144.6L129.1 216.6C130.629 218.079 132.673 218.905 134.8 218.905C136.927 218.905 138.971 218.079 140.5 216.6C142.002 215.083 142.845 213.035 142.845 210.9C142.845 208.765 142.002 206.717 140.5 205.2L48.3001 113C46.8647 111.593 45.7267 109.912 44.9537 108.057C44.1806 106.202 43.7883 104.21 43.8001 102.2C43.7973 100.177 44.1933 98.1725 44.9654 96.3022C45.7376 94.4319 46.8707 92.7321 48.3001 91.3C51.2165 88.5358 55.0818 86.9951 59.1001 86.9951C63.1183 86.9951 66.9836 88.5358 69.9001 91.3L89.9001 111.3L161.7 183.2C163.254 184.476 165.228 185.128 167.236 185.029C169.245 184.93 171.145 184.088 172.566 182.666C173.988 181.244 174.83 179.344 174.929 177.336C175.028 175.328 174.376 173.354 173.1 171.8L101.2 99.9C99.773 98.4867 98.6402 96.8045 97.867 94.9508C97.0939 93.097 96.6959 91.1085 96.6959 89.1C96.6959 87.0915 97.0939 85.1029 97.867 83.2492C98.6402 81.3954 99.773 79.7133 101.2 78.3C104.097 75.46 107.993 73.8692 112.05 73.8692C116.107 73.8692 120.003 75.46 122.9 78.3L215 170.4C216.144 171.507 217.585 172.257 219.147 172.559C220.71 172.861 222.327 172.701 223.8 172.1C225.248 171.477 226.483 170.445 227.354 169.131C228.224 167.816 228.692 166.276 228.7 164.7V126.6C228.688 125.105 228.925 123.618 229.4 122.2C230.251 119.346 231.989 116.837 234.363 115.039C236.737 113.241 239.622 112.246 242.6 112.2C245.284 112.188 247.918 112.932 250.199 114.347C252.48 115.762 254.317 117.79 255.5 120.2C261.5 141.7 266.3 160.2 270 178.3C274.548 200.055 276.329 222.298 275.3 244.5C274.422 259.613 267.973 273.864 257.2 284.5L227 315.7C214.935 326.375 200.033 333.322 184.1 335.7C171.941 337.618 159.499 336.604 147.81 332.742C136.122 328.881 125.524 322.284 116.9 313.5ZM333.4 256.1C332.439 271.192 326.003 285.415 315.3 296.1L284.7 327C274.547 335.872 262.376 342.124 249.25 345.209C236.124 348.295 222.443 348.12 209.4 344.7C219.724 340.676 229.344 335.04 237.9 328L268.9 296.9C282.502 283.437 290.626 265.407 291.7 246.3C292.818 223.06 290.969 199.773 286.2 177L286.8 138C286.787 136.131 287.145 134.279 287.854 132.55C288.563 130.821 289.608 129.251 290.929 127.929C292.251 126.608 293.821 125.563 295.55 124.854C297.279 124.145 299.132 123.787 301 123.8C303.644 123.797 306.233 124.548 308.465 125.965C310.697 127.382 312.478 129.406 313.6 131.8C325.4 173.9 335.9 215.1 333.4 256.1ZM128 44.7C128.735 45.4551 129.612 46.0579 130.581 46.4741C131.549 46.8903 132.59 47.1117 133.644 47.1256C134.698 47.1396 135.744 46.9458 136.723 46.5553C137.702 46.1649 138.595 45.5854 139.35 44.85C140.105 44.1146 140.708 43.2376 141.124 42.2692C141.54 41.3009 141.762 40.26 141.776 39.206C141.79 38.1521 141.596 37.1057 141.205 36.1267C140.815 35.1476 140.235 34.2551 139.5 33.5L122.6 15.9C121.069 14.5934 119.106 13.9038 117.094 13.9657C115.081 14.0276 113.165 14.8364 111.716 16.2347C110.268 17.6329 109.393 19.5203 109.26 21.529C109.128 23.5377 109.748 25.5237 111 27.1L128 44.7ZM168 40.1C170.122 40.1 172.157 39.2571 173.657 37.7568C175.157 36.2565 176 34.2217 176 32.1V12.1C176 9.97824 175.157 7.94341 173.657 6.44312C172.157 4.94283 170.122 4.09998 168 4.09998C165.878 4.09998 163.844 4.94283 162.343 6.44312C160.843 7.94341 160 9.97824 160 12.1V32.1C159.999 34.1707 160.8 36.1614 162.236 37.6534C163.672 39.1453 165.631 40.0223 167.7 40.1H168ZM201.8 47.1C203.892 47.0757 205.895 46.2529 207.4 44.8L224.1 28C225.494 26.4907 226.254 24.5029 226.223 22.4485C226.191 20.394 225.37 18.4305 223.93 16.9648C222.491 15.4991 220.542 14.6437 218.488 14.5758C216.435 14.5079 214.434 15.2327 212.9 16.6L195.9 33.2C195.147 33.9358 194.549 34.8146 194.14 35.7849C193.732 36.7551 193.522 37.7972 193.522 38.85C193.522 39.9027 193.732 40.9448 194.14 41.9151C194.549 42.8853 195.147 43.7642 195.9 44.5C196.607 45.2916 197.469 45.9306 198.432 46.3777C199.395 46.8247 200.439 47.0705 201.5 47.1H201.8Z"
                stroke="currentColor"
                strokeWidth="8"
                mask="url(#path-1-outside)"
              />
            </svg>
            <span className="tw-text-iron-400 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
              Rep
            </span>
            <div
              className={`${getRepColor()} tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-xs tw-font-medium`}
            >
              {formatNumberWithCommas(drop.rep)}
            </div>
          </>
        </DropListItemActionsItemWrapper>
      </div>
    </Tippy>
  );
}
