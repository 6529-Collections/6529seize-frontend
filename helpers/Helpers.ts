import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import {
  DEFAULT_USER_PAGE_TAB,
  type UserPageTabKey,
  getUserPageTabById,
} from "@/components/user/layout/userTabs.config";
import { publicEnv } from "@/config/env";
import {
  canonicalizeGatewayHostname,
  normalizeDecentralizedMediaUrl,
  parseDecentralizedMediaRef,
  toExternalFallbackUrls,
} from "@/lib/media/decentralized-media";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NULL_ADDRESS,
  NULL_DEAD_ADDRESS,
  ROYALTIES_PERCENTAGE,
} from "@/constants/constants";
import type { BaseNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { CICType } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import emojiRegex from "emoji-regex";
import { goerli, mainnet, sepolia } from "wagmi/chains";

export { getDateFilters } from "./dateFilterHelpers";
export { formatAddress, isValidEthAddress } from "./addressFormatting";
export {
  getTimeAgo,
  getTimeAgoShort,
  getTimeUntil,
} from "./timeDisplayHelpers";
export { getMetadataForUserPage } from "./userPageMetadataHelpers";

export const MAX_DROP_UPLOAD_FILES = 8;

const unicodeEmojiRegex = emojiRegex();
const codePointRegex = /U\+([\dA-Fa-f]{1,6})/g;

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

export function numberWithCommasFromString(x: string | number) {
  const str = x.toString();
  if (!str || !isNumeric(str) || isNaN(parseFloat(str))) return str;
  if (str.includes(" ") || str.includes(",")) return str;
  const cleanedInput = str.replaceAll(/[^\d.-]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleanedInput)) return str;
  const num = parseFloat(cleanedInput);
  if (isNaN(num)) return str;
  return numberWithCommas(num);
}

export function extractAllNumbers(str: string): number[] {
  const regex = /\d+/g;
  const numbers: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    numbers.push(Number.parseInt(match[0], 10));
  }

  return numbers;
}

export function isValidPositiveInteger(value: string | number): boolean {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }
  const num = Number.parseInt(value, 10);
  return (
    !Number.isNaN(num) &&
    Number.isInteger(num) &&
    num > 0 &&
    num.toString() === value.trim()
  );
}

export function numberWithCommas(x: number | undefined) {
  if (!x || x === null || isNaN(x)) return "-";
  if (x === 0) return "-";

  const isNegative = x < 0;
  x = Math.abs(x);
  const parts = x.toString().split(".");
  let integerPart = parts[0];
  let formattedInteger = "";
  while (integerPart?.length! > 3) {
    formattedInteger = "," + integerPart?.slice(-3) + formattedInteger;
    integerPart = integerPart?.slice(0, -3);
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
  const isNegative = integerPart?.startsWith("-");
  if (isNegative) {
    integerPart = integerPart?.slice(1);
  }
  let formattedInteger = "";
  while (integerPart?.length! > 3) {
    formattedInteger = "," + integerPart?.slice(-3) + formattedInteger;
    integerPart = integerPart?.slice(0, -3);
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

export function formatStatFloor(
  value: number | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  const factor = 10 ** decimals;
  const flooredValue = Math.floor(value * factor) / factor;
  return formatNumberWithCommas(flooredValue);
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

export function areEqualAddresses(w1: unknown, w2: unknown): boolean {
  if (typeof w1 === "string" && typeof w2 === "string" && w1 && w2) {
    return w1.toUpperCase() === w2.toUpperCase();
  }
  return false;
}

export const fullScreenSupported = (): boolean => {
  const doc = document as Document & {
    readonly mozCancelFullScreen?: unknown;
    readonly webkitExitFullscreen?: unknown;
    readonly msExitFullscreen?: unknown;
  };
  const el = doc.body as HTMLElement & {
    readonly mozRequestFullScreen?: unknown;
    readonly webkitRequestFullscreen?: unknown;
    readonly msRequestFullscreen?: unknown;
  };
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

type FullscreenRequestElement = Omit<HTMLElement, "requestFullscreen"> & {
  readonly requestFullscreen?: (() => Promise<void> | void) | undefined;
  readonly mozRequestFullScreen?: (() => Promise<void> | void) | undefined;
  readonly webkitRequestFullscreen?: (() => Promise<void> | void) | undefined;
  readonly msRequestFullscreen?: (() => Promise<void> | void) | undefined;
};

export const enterArtFullScreen = async (
  elementId: string
): Promise<boolean> => {
  if (typeof globalThis.document === "undefined") {
    return false;
  }

  const element = globalThis.document.getElementById(
    elementId
  ) as FullscreenRequestElement | null;

  if (!element) {
    console.error(`Element with ID '${elementId}' not found.`);
    return false;
  }

  try {
    if (element.requestFullscreen !== undefined) {
      await element.requestFullscreen();
      return true;
    }
    if (element.mozRequestFullScreen !== undefined) {
      await element.mozRequestFullScreen();
      return true;
    }
    if (element.webkitRequestFullscreen !== undefined) {
      await element.webkitRequestFullscreen();
      return true;
    }
    if (element.msRequestFullscreen !== undefined) {
      await element.msRequestFullscreen();
      return true;
    }

    console.warn("Fullscreen API is not supported by this browser.");
    return false;
  } catch (err) {
    let errorMessage = "Unknown fullscreen error";
    if (err instanceof Error) {
      errorMessage = `${err.name}: ${err.message}`;
    } else if (typeof err === "string") {
      errorMessage = err;
    }
    console.error(
      `Error attempting to enable fullscreen mode: ${errorMessage}`
    );
    return false;
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
  return (
    normalizeDecentralizedMediaUrl(url, publicEnv.MEDIA_RESOLVER_ENDPOINT) ??
    url
  );
}

export function parseIpfsUrlToGateway(url: string) {
  if (!url) {
    return url;
  }
  const parsed = parseDecentralizedMediaRef(url);
  if (!parsed) {
    return url;
  }
  const fallbacks = toExternalFallbackUrls(parsed);
  return (
    fallbacks.find((fallback) => {
      try {
        return (
          canonicalizeGatewayHostname(new URL(fallback).hostname) ===
          "cf-ipfs.com"
        );
      } catch {
        return false;
      }
    }) ??
    fallbacks[0] ??
    parseIpfsUrl(url)
  );
}

export function isEmptyObject(obj: object) {
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
  if (!s) {
    return false;
  }

  unicodeEmojiRegex.lastIndex = 0;
  if (unicodeEmojiRegex.test(s)) {
    return true;
  }

  codePointRegex.lastIndex = 0;
  return codePointRegex.test(s);
}

export function parseEmojis(s: string) {
  const regex = /U\+([\dA-Fa-f]{1,6})/g;
  return s.replaceAll(regex, (_, hexValue) => {
    return `&#x${hexValue};`;
  });
}

function isValidDate(date?: Date): date is Date {
  return !!date && !isNaN(new Date(date).getTime());
}

export function printMintDate(date?: Date) {
  if (!isValidDate(date)) {
    return "-";
  }
  const mintDate = new Date(date);
  return mintDate.toLocaleString("default", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getRandomColor() {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  const values = new Uint8Array(3);
  globalThis.crypto.getRandomValues(values);
  const [r = 0, g = 0, b = 0] = values;

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getRandomInteger(maxExclusive: number): number {
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return (values[0] ?? 0) % maxExclusive;
}

export function getRandomUniqueNumbersBetween(
  minInclusive: number,
  maxExclusive: number
): string[] {
  if (!Number.isInteger(minInclusive) || !Number.isInteger(maxExclusive)) {
    throw new TypeError("Both minInclusive and maxExclusive must be integers.");
  }

  if (maxExclusive <= minInclusive) {
    throw new RangeError("maxExclusive must be greater than minInclusive.");
  }

  const rangeSize = maxExclusive - minInclusive;
  const count = getRandomInteger(rangeSize) + 1;
  const values = new Set<number>();

  while (values.size < count) {
    values.add(minInclusive + getRandomInteger(rangeSize));
  }

  return [...values].sort((a, b) => a - b).map(String);
}

export function capitalizeEveryWord(input: string): string {
  return input
    .toLocaleLowerCase()
    .replaceAll(/(?:^|\s+)(.)/g, (match: string) => match.toUpperCase());
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

export function displayDecimal(value: number): string {
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
  connectedHandle?: string | undefined;
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
  readonly defaultPath: UserPageTabKey;
}): string => {
  if (!handleOrWallet.length) {
    return "/404";
  }
  if (pathname.includes("[user]")) {
    return pathname.replaceAll("[user]", handleOrWallet);
  }
  const tab =
    getUserPageTabById(defaultPath) ??
    getUserPageTabById(DEFAULT_USER_PAGE_TAB);
  return `/${handleOrWallet}/${tab.route}`;
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

export const formatLargeNumber = (num: number): string => {
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const format = (value: number, suffix: string) => {
    const rounded = Math.round(value * 10) / 10;
    if (rounded % 1 === 0) {
      return `${rounded.toLocaleString()}${suffix}`;
    } else {
      return `${rounded.toLocaleString(undefined, {
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
  const seed = hashSeed(seedString);
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

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function parseNftDescriptionToHtml(description: string) {
  const urlRegex =
    /(https?:\/\/(www\.)?[-a-z0-9@:%._+~#=]{1,256}\.[a-z0-9]{1,6}\b([-a-z0-9@:%_+.~#?&=/]*))/gi;

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(description)) !== null) {
    const url = match[0];
    const index = match.index ?? 0;

    const preceding = description.slice(lastIndex, index);
    result += escapeHtml(preceding).replaceAll("\n", "<br />");

    const safeUrl = escapeHtml(url);
    result += `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;

    lastIndex = index + url.length;
  }

  const remaining = description.slice(lastIndex);
  result += escapeHtml(remaining).replaceAll("\n", "<br />");

  return result;
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
  const baseEndpoint = publicEnv.BASE_ENDPOINT;
  if (!baseEndpoint) {
    return link;
  }
  return link.replaceAll(baseEndpoint, "");
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
