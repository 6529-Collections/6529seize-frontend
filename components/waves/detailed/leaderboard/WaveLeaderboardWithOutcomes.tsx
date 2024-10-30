import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faUsers,
  faDatabase,
} from "@fortawesome/free-solid-svg-icons";

type LeaderboardEntry = {
  rank: number;
  handle: string;
  score: number;
  avatarUrl: string;
};

type Outcome = {
  category: string;
  icon: typeof faTrophy | typeof faUsers | typeof faDatabase;
  value: string;
  prize: string;
};

type LeaderboardWithOutcomes = {
  entries: LeaderboardEntry[];
  outcomes: Outcome[];
  threshold: number;
  time: string;
};

const mockData: LeaderboardWithOutcomes = {
  entries: [
    {
      rank: 1,
      handle: "CryptoKING",
      score: 20,
      avatarUrl: "https://example.com/avatar1.jpg",
    },
    {
      rank: 2,
      handle: "BlockchainQueen",
      score: 19,
      avatarUrl: "https://example.com/avatar2.jpg",
    },
    {
      rank: 3,
      handle: "TokenMaster",
      score: 15,
      avatarUrl: "https://example.com/avatar3.jpg",
    },
    {
      rank: 4,
      handle: "Web3Wizard",
      score: 13,
      avatarUrl: "https://example.com/avatar4.jpg",
    },
  ],
  outcomes: [
    { category: "Rep Category", icon: faTrophy, value: "2M Rep", prize: "23" },
    {
      category: "Manual stuff",
      icon: faUsers,
      value: "Manual stuff",
      prize: "999k",
    },
    { category: "CIC", icon: faDatabase, value: "100k CIC", prize: "10k" },
  ],
  threshold: 200,
  time: "2 weeks",
};

export default function WaveLeaderboardWithOutcomes() {
  const { entries, outcomes, threshold, time } = mockData;

  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-950">
      <div className="tw-p-4 tw-bg-iron-900">
        <h2 className="tw-text-lg tw-font-semibold tw-text-iron-50">
          Leaderboard & Outcomes
        </h2>
      </div>
      <div className="tw-max-h-[400px] scrollbar-width tw-overflow-y-auto tw-divide-y tw-divide-solid tw-divide-iron-800">
        {entries.map((entry, index) => (
          <div
            key={entry.rank}
            className={`tw-flex tw-items-center tw-gap-4 tw-py-3 tw-px-4 ${
              index < 3
                ? `tw-bg-gradient-to-r tw-from-iron-900 tw-to-[${getMedalColor(
                    index
                  )}]/[0.07]`
                : ""
            }`}
          >
            <div className="tw-flex tw-items-center tw-gap-2">
              {index < 3 ? (
                <MedalIcon rank={index + 1} />
              ) : (
                <div className="tw-bg-iron-900 tw-w-6 tw-h-6 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-text-iron-300 tw-font-semibold tw-text-sm">
                  {entry.rank}
                </div>
              )}
              <img
                src={entry.avatarUrl}
                alt={entry.handle}
                className="tw-h-6 tw-w-6 tw-rounded-md tw-flex-shrink-0"
              />
              <div className="tw-font-medium tw-text-sm tw-text-iron-50">
                {entry.handle}
              </div>
            </div>
            <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
              <div
                className={`tw-text-sm ${
                  index < 3 ? "tw-text-white" : "tw-text-iron-300"
                }`}
              >
                {entry.score}
              </div>
              {index < outcomes.length && (
                <div className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-text-iron-400">
                  <FontAwesomeIcon
                    icon={outcomes[index].icon}
                    className="tw-w-3 tw-h-3"
                  />
                  <span>{outcomes[index].prize}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="tw-p-4 tw-bg-iron-900">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
          <div className="tw-text-sm tw-font-medium tw-text-iron-300">
            Threshold
          </div>
          <div className="tw-text-sm tw-text-iron-50">{threshold}</div>
        </div>
        <div className="tw-flex tw-justify-between tw-items-center">
          <div className="tw-text-sm tw-font-medium tw-text-iron-300">Time</div>
          <div className="tw-text-sm tw-text-iron-50">{time}</div>
        </div>
      </div>
    </div>
  );
}

function MedalIcon({ rank }: { readonly rank: number }) {
  const color = getMedalColor(rank - 1);
  return (
    <svg
      className="tw-size-5 tw-flex-shrink-0"
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M447.296 48.384C444.518 43.415 440.464 39.2771 435.554 36.397C430.643 33.517 425.053 31.9992 419.36 32H328.944C323.485 31.9878 318.115 33.3813 313.351 36.0463C308.588 38.7113 304.59 42.558 301.744 47.216L256 121.504L210.32 47.216C207.468 42.5487 203.461 38.6961 198.685 36.0306C193.908 33.365 188.525 31.9768 183.056 32H92.6399C86.9492 32.0081 81.3635 33.5335 76.4586 36.4192C71.5538 39.3048 67.5071 43.4463 64.7358 48.4167C61.9645 53.387 60.5689 59.0065 60.6926 64.696C60.8164 70.3854 62.4551 75.9389 65.4399 80.784L157.888 230.944C136.732 250.654 122 276.276 115.609 304.475C109.219 332.674 111.465 362.145 122.056 389.049C132.647 415.954 151.092 439.047 174.991 455.323C198.889 471.599 227.134 480.303 256.048 480.303C284.962 480.303 313.207 471.599 337.105 455.323C361.004 439.047 379.449 415.954 390.04 389.049C400.631 362.145 402.877 332.674 396.486 304.475C390.096 276.276 375.363 250.654 354.208 230.944L446.656 80.784C449.637 75.9294 451.268 70.3669 451.381 64.671C451.493 58.9752 450.083 53.3527 447.296 48.384ZM92.6399 64H183.056L237.248 152L207.376 200.576C199.13 203.548 191.172 207.265 183.6 211.68L92.6399 64ZM368 336C368 358.152 361.431 379.806 349.125 398.224C336.818 416.642 319.326 430.998 298.86 439.475C278.395 447.952 255.876 450.17 234.15 445.848C212.424 441.526 192.467 430.859 176.804 415.196C161.141 399.533 150.474 379.576 146.152 357.85C141.83 336.124 144.048 313.605 152.525 293.139C161.002 272.674 175.358 255.182 193.776 242.875C212.194 230.569 233.848 224 256 224C285.694 224.034 314.162 235.845 335.158 256.842C356.155 277.838 367.966 306.306 368 336ZM328.4 211.728C306.456 198.818 281.46 192.007 256 192C254 192 252.048 192.224 250.064 192.304L328.944 64H419.36L328.4 211.728Z"
        fill={color}
      />
      <path d={getMedalNumber(rank)} fill={color} />
    </svg>
  );
}

function getMedalColor(index: number): string {
  const colors = ["#BE8D2F", "#AAABAB", "#B7674D"];
  return colors[index] || "#AAABAB";
}

function getMedalNumber(rank: number): string {
  const paths = [
    "M280 288V384H253.728V312H253.168L232 324.56V302.4L255.808 288H280Z",
    "M224 384V365.504L256 336.288C257.819 334.547 259.55 332.716 261.184 330.8C262.554 329.213 263.676 327.427 264.512 325.504C265.316 323.59 265.719 321.532 265.696 319.456C265.759 317.293 265.298 315.147 264.352 313.2C263.541 311.542 262.268 310.154 260.688 309.2C259.053 308.248 257.188 307.761 255.296 307.792C253.399 307.752 251.529 308.252 249.904 309.232C248.308 310.236 247.057 311.704 246.32 313.44C245.409 315.572 244.973 317.875 245.04 320.192H224C223.835 314.227 225.161 308.316 227.856 302.992C230.302 298.3 234.082 294.436 238.72 291.888C243.796 289.204 249.475 287.865 255.216 288C261.066 287.86 266.866 289.105 272.144 291.632C276.736 293.897 280.579 297.435 283.216 301.824C285.899 306.508 287.249 311.836 287.12 317.232C287.11 320.933 286.455 324.604 285.184 328.08C283.472 332.38 281.114 336.394 278.192 339.984C273.753 345.486 268.942 350.677 263.792 355.52L256.176 362.912V363.472H288V384H224Z",
    "M255.552 384C248.845 384.127 242.188 382.834 236.016 380.208C230.707 377.962 226.091 374.345 222.64 369.728C219.387 365.267 217.664 359.873 217.728 354.352H243.2C243.19 356.085 243.753 357.772 244.8 359.152C245.951 360.632 247.483 361.772 249.232 362.448C251.264 363.27 253.44 363.672 255.632 363.632C257.757 363.677 259.866 363.251 261.808 362.384C263.496 361.631 264.945 360.43 266 358.912C267.001 357.408 267.51 355.63 267.456 353.824C267.506 352.003 266.899 350.225 265.744 348.816C264.468 347.281 262.813 346.107 260.944 345.408C258.631 344.552 256.178 344.134 253.712 344.176H244.256V326.72H253.712C255.99 326.767 258.254 326.354 260.368 325.504C262.145 324.791 263.697 323.614 264.864 322.096C265.954 320.659 266.519 318.891 266.464 317.088C266.525 315.392 266.068 313.717 265.152 312.288C264.203 310.895 262.892 309.789 261.36 309.088C259.604 308.265 257.682 307.859 255.744 307.904C253.627 307.863 251.526 308.277 249.584 309.12C247.888 309.858 246.419 311.034 245.328 312.528C244.296 313.995 243.737 315.743 243.728 317.536H219.552C219.486 312.131 221.132 306.844 224.256 302.432C227.534 297.935 231.952 294.395 237.056 292.176C242.941 289.592 249.317 288.315 255.744 288.432C262.001 288.318 268.214 289.511 273.984 291.936C278.902 293.976 283.188 297.289 286.4 301.536C289.372 305.585 290.929 310.499 290.832 315.52C290.937 317.915 290.513 320.304 289.589 322.517C288.665 324.729 287.265 326.711 285.488 328.32C281.682 331.748 276.85 333.824 271.744 334.224V334.96C278.013 335.245 283.995 337.673 288.688 341.84C290.558 343.689 292.021 345.907 292.986 348.354C293.95 350.8 294.393 353.421 294.288 356.048C294.387 361.302 292.657 366.427 289.392 370.544C285.787 374.996 281.067 378.413 275.712 380.448C269.29 382.942 262.44 384.149 255.552 384Z",
  ];
  return paths[rank - 1] || "";
}
