import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import {
  USER_PAGE_TAB_META,
  UserPageTabType,
} from "@/components/user/layout/UserPageTabs";
import { publicEnv } from "@/config/env";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NULL_ADDRESS,
  NULL_DEAD_ADDRESS,
  ROYALTIES_PERCENTAGE,
} from "@/constants";
import { BaseNFT, VolumeType } from "@/entities/INFT";
import { CICType } from "@/entities/IProfile";
import { DateIntervalsSelection } from "@/enums";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { goerli, mainnet, sepolia } from "wagmi/chains";
import { PageSSRMetadata, Period } from "./Types";

export const MAX_DROP_UPLOAD_FILES = 8;

export function formatAddress(address: string) {
  if (
    !address ||
    !isValidEthAddress(address) ||
    address.endsWith(".eth") ||
    address.includes(" ")
  ) {
    return address;
  }
  if (address.length > 11) {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  }
  return address;
}

export function isMemesContract(contract: string) {
  return contract.toUpperCase() === MEMES_CONTRACT.toUpperCase();
}

export function isGradientsContract(contract: string) {
  return contract.toUpperCase() === GRADIENT_CONTRACT.toUpperCase();
}

export function isNextgenContract(contract: string) {
  return areEqualAddresses(contract, NEXTGEN_CORE[NEXTGEN_CHAIN_ID]);
}

export function isMemeLabContract(contract: string) {
  return contract.toUpperCase() === MEMELAB_CONTRACT.toUpperCase();
}

export function fromGWEI(from: number) {
  return from / 1e18;
}

function isNumeric(str: string) {
  return /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(str);
}

export function numberWithCommasFromString(x: any) {
  x = x.toString();
  if (!x || !isNumeric(x) || isNaN(parseFloat(x))) return x;
  if (x.includes(" ") || x.includes(",")) return x;
  const cleanedInput = x.replace(/[^\d.-]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleanedInput)) return x;
  const num = parseFloat(cleanedInput);
  if (isNaN(num)) return x;
  return numberWithCommas(num);
}

export function numberWithCommas(x: number | undefined) {
  if (!x || x === null || isNaN(x)) return "-";
  if (x === 0) return "-";

  const isNegative = x < 0;
  x = Math.abs(x);
  const parts = x.toString().split(".");
  let integerPart = parts[0];
  let formattedInteger = "";
  while (integerPart.length > 3) {
    formattedInteger = "," + integerPart.slice(-3) + formattedInteger;
    integerPart = integerPart.slice(0, -3);
  }
  formattedInteger = integerPart + formattedInteger;
  formattedInteger =
    formattedInteger + (parts.length > 1 ? "." + parts[1] : "");
  return isNegative ? `-${formattedInteger}` : formattedInteger;
}

export function formatNumberWithCommas(x: number) {
  if (x === null || isNaN(x)) return "-";
  const parts = x.toString().split(".");
  let integerPart = parts[0];
  const isNegative = integerPart.startsWith("-");
  if (isNegative) {
    integerPart = integerPart.slice(1);
  }
  let formattedInteger = "";
  while (integerPart.length > 3) {
    formattedInteger = "," + integerPart.slice(-3) + formattedInteger;
    integerPart = integerPart.slice(0, -3);
  }
  formattedInteger = integerPart + formattedInteger;
  const formattedNumber =
    formattedInteger + (parts.length > 1 ? "." + parts[1] : "");
  return isNegative ? `-${formattedNumber}` : formattedNumber;
}

export function formatNumberWithCommasOrDash(x: number): string {
  if (x === null || isNaN(x) || x === 0) return "-";
  return formatNumberWithCommas(x);
}

export function getDateDisplay(date: Date) {
  const secondsAgo = (new Date().getTime() - date.getTime()) / 1000;
  if (60 > secondsAgo) {
    return `${Math.round(secondsAgo)} seconds ago`;
  }
  if (60 * 60 > secondsAgo) {
    const minutes = Math.round(secondsAgo / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (60 * 60 * 24 > secondsAgo) {
    const hours = Math.floor(secondsAgo / (60 * 60));
    const minutes = secondsAgo % (60 * 60);
    return `${hours} hr${hours > 1 ? "s" : ""} ${
      minutes > 0 ? `${Math.floor(minutes / 60)} mins` : ""
    } ago`;
  }
  const days = Math.round(secondsAgo / (60 * 60 * 24));
  if (2 > days) {
    return `${Math.round(secondsAgo / (60 * 60))} hours ago`;
  }
  return `${days.toLocaleString()} days ago`;
}

export function areEqualAddresses(w1: any, w2: any) {
  if (w1 && w2) {
    return w1.toUpperCase() === w2.toUpperCase();
  }
  return false;
}

export const fullScreenSupported = (): boolean => {
  const doc: any = document;
  const el: any = doc.body;
  const check =
    typeof el.requestFullscreen !== "undefined" ||
    typeof el.mozRequestFullScreen !== "undefined" ||
    typeof el.webkitRequestFullscreen !== "undefined" ||
    typeof el.msRequestFullscreen !== "undefined" ||
    typeof doc.exitFullscreen !== "undefined" ||
    typeof doc.mozCancelFullScreen !== "undefined" ||
    typeof doc.webkitExitFullscreen !== "undefined" ||
    typeof doc.msExitFullscreen !== "undefined";

  return check;
};

export const enterArtFullScreen = async (elementId: string): Promise<void> => {
  const element: any = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with ID '${elementId}' not found.`);
    return;
  }

  const request =
    element.requestFullscreen ||
    element.mozRequestFullScreen ||
    element.webkitRequestFullscreen ||
    element.msRequestFullscreen;

  if (request) {
    try {
      await request.call(element);
    } catch (err) {
      console.error(`Error attempting to enable fullscreen mode: ${err}`);
    }
  } else {
    console.warn("Fullscreen API is not supported by this browser.");
  }
};

export function addProtocol(link: string) {
  if (!link || link.startsWith("http")) {
    return link;
  }
  return `https://${link}`;
}

export function getValuesForVolumeType(
  volumeType: VolumeType | undefined,
  a: BaseNFT
) {
  switch (volumeType) {
    case VolumeType.ALL_TIME:
      return a.total_volume;
    case VolumeType.DAYS_30:
      return a.total_volume_last_1_month;
    case VolumeType.DAYS_7:
      return a.total_volume_last_7_days;
    case VolumeType.HOURS_24:
      return a.total_volume_last_24_hours;
  }

  return 0;
}

export const isValidEthAddress = (address: string) =>
  /^0x[0-9a-fA-F]{40}$/.test(address);

export function getTransactionLink(chain_id: number, hash: string) {
  switch (chain_id) {
    case sepolia.id:
      return `https://sepolia.etherscan.io/tx/${hash}`;
    case goerli.id:
      return `https://goerli.etherscan.io/tx/${hash}`;
    default:
      return `https://etherscan.io/tx/${hash}`;
  }
}

export function getAddressEtherscanLink(chain_id: number, address: string) {
  switch (chain_id) {
    case sepolia.id:
      return `https://sepolia.etherscan.io/address/${address}`;
    case goerli.id:
      return `https://goerli.etherscan.io/address/${address}`;
    default:
      return `https://etherscan.io/address/${address}`;
  }
}

export function parseIpfsUrl(url: string) {
  if (!url) {
    return url;
  }
  if (url.startsWith("ipfs")) {
    return `https://ipfs.io/ipfs/${url.split("://")[1]}`;
  }
  return url;
}

export function parseIpfsUrlToGateway(url: string) {
  if (!url) {
    return url;
  }
  if (url.startsWith("ipfs")) {
    return `https://cf-ipfs.com/ipfs/${url.split("://")[1]}`;
  }
  return url;
}

export function isEmptyObject(obj: any) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function isUrl(s: string) {
  const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/i;
  return pattern.test(s);
}

export function isIPFS(s: string) {
  return s.startsWith("ipfs://");
}

export function containsEmojis(s: string) {
  const regex = /U\+([\dA-Fa-f]{1,6})/g;
  return regex.test(s);
}

export function parseEmojis(s: string) {
  const regex = /U\+([\dA-Fa-f]{1,6})/g;
  return s.replace(regex, (_, hexValue) => {
    return `&#x${hexValue};`;
  });
}

function isValidDate(date?: any): date is Date {
  return date && !isNaN(new Date(date).getTime());
}

export function printMintDate(date?: Date) {
  if (!isValidDate(date)) {
    return "-";
  }
  const mintDate = new Date(date);
  return `
      ${mintDate.toLocaleString("default", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} 
      (${getDateDisplay(mintDate)})
    `;
}

export function getRandomColor() {
  const r = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  const g = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  const b = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
}

export function capitalizeEveryWord(input: string): string {
  return input
    .toLocaleLowerCase()
    .replace(/^(.)|\s+(.)/g, (match: string) => match.toUpperCase());
}

export function getNetworkName(chainId: number) {
  if (chainId === mainnet.id) {
    return "Etherium Mainnet";
  } else if (chainId === sepolia.id) {
    return "Sepolia Testnet";
  } else if (chainId === goerli.id) {
    return "Goerli Testnet";
  } else {
    return `Network ID ${chainId}`;
  }
}

export function createArray(startNum: number, endNum: number) {
  let result = [];

  if (startNum <= endNum) {
    for (let i = startNum; i <= endNum; i++) {
      result.push(i);
    }
  } else {
    result.push(0);
  }

  return result;
}

export function displayDecimal(value: number, places: number): string {
  if (0 >= value) {
    return "-";
  }

  const valueAsString = value.toString();
  const decimalPlaceIndex = valueAsString.indexOf(".");

  if (decimalPlaceIndex !== -1 && value < 0.01) {
    const exponent = Math.ceil(-Math.log10(value));
    return Number(value.toFixed(exponent)).toString();
  }

  if (value >= 0.01) {
    return Number(value.toFixed(2)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function areEqualURLS(s1: string, s2: string) {
  try {
    const url1 = new URL(s1);
    const url2 = new URL(s2);
    return url1.href === url2.href;
  } catch {
    return false;
  }
}

function formatDateFilterDate(d: Date) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateFilters(
  dateSelection: DateIntervalsSelection,
  fromDate: Date | undefined,
  toDate: Date | undefined
) {
  let filters = "";
  switch (dateSelection) {
    case DateIntervalsSelection.ALL:
      break;
    case DateIntervalsSelection.TODAY:
      filters += `&from_date=${formatDateFilterDate(new Date())}`;
      break;
    case DateIntervalsSelection.YESTERDAY: {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      filters += `&from_date=${formatDateFilterDate(yesterday)}`;
      filters += `&to_date=${formatDateFilterDate(yesterday)}`;
      break;
    }
    case DateIntervalsSelection.LAST_7: {
      const weekAgo = new Date();
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
      filters += `&from_date=${formatDateFilterDate(weekAgo)}`;
      break;
    }
    case DateIntervalsSelection.THIS_MONTH: {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setUTCDate(1);
      filters += `&from_date=${formatDateFilterDate(firstDayOfMonth)}`;
      break;
    }
    case DateIntervalsSelection.PREVIOUS_MONTH: {
      const firstDayOfPreviousMonth = new Date();
      firstDayOfPreviousMonth.setUTCMonth(
        firstDayOfPreviousMonth.getUTCMonth() - 1
      );
      firstDayOfPreviousMonth.setUTCDate(1);
      const lastDayOfPreviousMonth = new Date();
      lastDayOfPreviousMonth.setUTCDate(0);
      filters += `&from_date=${formatDateFilterDate(firstDayOfPreviousMonth)}`;
      filters += `&to_date=${formatDateFilterDate(lastDayOfPreviousMonth)}`;
      break;
    }
    case DateIntervalsSelection.YEAR_TO_DATE: {
      const firstDayOfYear = new Date();
      firstDayOfYear.setUTCMonth(0);
      firstDayOfYear.setUTCDate(1);
      filters += `&from_date=${formatDateFilterDate(firstDayOfYear)}`;
      break;
    }
    case DateIntervalsSelection.LAST_YEAR: {
      const firstDayOfLastYear = new Date();
      firstDayOfLastYear.setUTCFullYear(
        firstDayOfLastYear.getUTCFullYear() - 1
      );
      firstDayOfLastYear.setUTCMonth(0);
      firstDayOfLastYear.setUTCDate(1);
      const lastDayOfLastYear = new Date();
      lastDayOfLastYear.setUTCMonth(0);
      lastDayOfLastYear.setUTCDate(0);
      filters += `&from_date=${formatDateFilterDate(firstDayOfLastYear)}`;
      filters += `&to_date=${formatDateFilterDate(lastDayOfLastYear)}`;
      break;
    }
    case DateIntervalsSelection.CUSTOM_DATES:
      if (fromDate) {
        filters += `&from_date=${formatDateFilterDate(fromDate)}`;
      }
      if (toDate) {
        filters += `&to_date=${formatDateFilterDate(toDate)}`;
      }
      break;
  }
  return filters;
}

export const cicToType = (cic: number): CICType => {
  if (cic < -20) {
    return CICType.INACCURATE;
  }

  if (cic < 1000) {
    return CICType.UNKNOWN;
  }

  if (cic < 10000) {
    return CICType.PROBABLY_ACCURATE;
  }

  if (cic < 25000) {
    return CICType.ACCURATE;
  }

  return CICType.HIGHLY_ACCURATE;
};

export const amIUser = ({
  profile,
  address,
  connectedHandle,
}: {
  profile: ApiIdentity;
  address: string | undefined;
  connectedHandle?: string;
}): boolean => {
  if (connectedHandle && profile?.handle) {
    if (connectedHandle.toLowerCase() === profile.handle.toLowerCase()) {
      return true;
    }
  }

  if (!address || !profile?.wallets) {
    return false;
  }

  return profile.wallets.some(
    (wallet) => wallet.wallet.toLowerCase() === address.toLowerCase()
  );
};

export const createPossessionStr = (name: string | null): string => {
  if (name) {
    const possession = name.endsWith("s") ? `${name}'` : `${name}'s`;
    return possession;
  }
  return "";
};

export const getTimeAgo = (milliseconds: number): string => {
  const currentTime = new Date().getTime();
  const timeDifference = currentTime - milliseconds;

  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""} ago`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return `Just now`;
  }
};

export const getTimeAgoShort = (milliseconds: number): string => {
  const currentTime = new Date().getTime();
  const timeDifference = currentTime - milliseconds;

  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 1) {
    const date = new Date(milliseconds);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } else if (days === 1) {
    return "Yesterday";
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `Just now`;
  }
};

export const getTimeUntil = (milliseconds: number): string => {
  const currentTime = new Date().getTime();
  let timeDifference = milliseconds - currentTime;

  const isFuture = timeDifference >= 0;

  timeDifference = Math.abs(timeDifference);

  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    return `${isFuture ? "in" : ""} ${years} year${years > 1 ? "s" : ""} ${
      isFuture ? "" : "ago"
    }`;
  } else if (months > 0) {
    return `${isFuture ? "in" : ""} ${months} month${months > 1 ? "s" : ""} ${
      isFuture ? "" : "ago"
    }`;
  } else if (days > 0) {
    return `${isFuture ? "in" : ""} ${days} day${days > 1 ? "s" : ""} ${
      isFuture ? "" : "ago"
    }`;
  } else if (hours > 0) {
    return `${isFuture ? "in" : ""} ${hours} hour${hours > 1 ? "s" : ""} ${
      isFuture ? "" : "ago"
    }`;
  } else if (minutes > 0) {
    return `${isFuture ? "in" : ""} ${minutes} minute${
      minutes > 1 ? "s" : ""
    } ${isFuture ? "" : "ago"}`;
  } else {
    return `Just now`;
  }
};

export const getStringAsNumberOrZero = (value: string): number => {
  const parsedValue = parseInt(value);
  return isNaN(parsedValue) ? 0 : parsedValue;
};
export const getProfileTargetRoute = ({
  handleOrWallet,
  pathname,
  defaultPath,
}: {
  readonly handleOrWallet: string;
  readonly pathname: string;
  readonly defaultPath: UserPageTabType;
}): string => {
  if (!handleOrWallet.length) {
    return "/404";
  }
  if (pathname.includes("[user]")) {
    return pathname.replace("[user]", handleOrWallet);
  }
  return `/${handleOrWallet}/${USER_PAGE_TAB_META[defaultPath].route}`;
};

export function isNullAddress(address: string) {
  if (areEqualAddresses(address, NULL_ADDRESS)) {
    return true;
  }
  if (areEqualAddresses(address, NULL_DEAD_ADDRESS)) {
    return true;
  }
  return false;
}

export function capitalizeFirstChar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getRoyaltyImage(royaltiesPercentage: number) {
  return royaltiesPercentage >= ROYALTIES_PERCENTAGE
    ? "pepe-xglasses.png"
    : "pepe-smile.png";
}

export const formatTimestampToMonthYear = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

export const formatLargeNumber = (num: number): string => {
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const format = (value: number, suffix: string) => {
    if (value % 1 === 0) {
      return `${value.toLocaleString()}${suffix}`;
    } else {
      return `${value.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}${suffix}`;
    }
  };

  let formattedNum = "";

  if (absNum < 1000) {
    formattedNum = absNum.toLocaleString();
  } else if (absNum < 10000) {
    formattedNum = format(absNum / 1000, "K");
  } else if (absNum < 1000000) {
    formattedNum = format(absNum / 1000, "K");
  } else {
    formattedNum = format(absNum / 1000000, "M");
  }

  return isNegative ? "-" + formattedNum : formattedNum;
};

export const classNames = (...classes: string[]) =>
  classes.filter(Boolean).join(" ");

export const PERIOD_LABELS: Record<Period, string> = {
  [Period.MINUTES]: "Minutes",
  [Period.HOURS]: "Hours",
  [Period.DAYS]: "Days",
  [Period.WEEKS]: "Weeks",
  [Period.MONTHS]: "Months",
};
const hashSeed = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

const seededRandom = (seed: number) => {
  return () => {
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    seed = (a * seed + c) % m;
    return seed / m;
  };
};

export const getRandomColorWithSeed = (seedString: string) => {
  let seed = hashSeed(seedString);
  const random = seededRandom(seed);
  const r = Math.floor(random() * 256)
    .toString(16)
    .padStart(2, "0");
  const g = Math.floor(random() * 256)
    .toString(16)
    .padStart(2, "0");
  const b = Math.floor(random() * 256)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
};

export function parseNftDescriptionToHtml(description: string) {
  let d = description.replaceAll("\n", "<br />");
  d = d.replace(
    /(https?:\/\/(www\.)?[-a-z0-9@:%._+~#=]{1,256}\.[a-z0-9]{1,6}\b([-a-z0-9@:%_+.~#?&=/]*))/gi,
    '<a href=\'$1\' target="blank" rel="noopener noreferrer">$1</a>'
  );
  return d;
}

export function getPathForContract(contract: string) {
  switch (contract) {
    case MEMES_CONTRACT:
      return "the-memes";
    case GRADIENT_CONTRACT:
      return "6529-gradient";
    case MEMELAB_CONTRACT:
      return "meme-lab";
    default:
      return contract;
  }
}

export function getNameForContract(contract: string) {
  switch (contract) {
    case MEMES_CONTRACT:
      return "The Memes";
    case GRADIENT_CONTRACT:
      return "6529 Gradient";
    case MEMELAB_CONTRACT:
      return "Meme Lab";
    default:
      return contract;
  }
}

export const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const removeBaseEndpoint = (link: string) => {
  return link.replace(publicEnv.BASE_ENDPOINT ?? "", "");
};

export const getMetadataForUserPage = (
  profile: ApiIdentity,
  path?: string
): PageSSRMetadata => {
  const display = profile.handle ?? formatAddress(profile.display);
  return {
    title: display + (path ? ` | ${path}` : ""),
    ogImage: profile.pfp ?? "",
    description: `Level ${
      profile.level
    } / TDH: ${profile.tdh.toLocaleString()} / Rep: ${profile.rep.toLocaleString()}`,
    twitterCard: "summary_large_image",
  };
};

export async function fetchFileContent(filePath: string): Promise<string> {
  try {
    const res = await fetch(filePath);
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

export const idStringToDisplay = (id: string) => {
  if (!id) return id;
  const num = Number(id);
  if (!Number.isNaN(num) && Number.isInteger(num)) {
    return num.toLocaleString();
  }
  return id;
};
