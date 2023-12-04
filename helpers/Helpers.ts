import { sepolia } from "wagmi/chains";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../constants";
import { BaseNFT, VolumeType } from "../entities/INFT";
import { DateIntervalsSelection } from "../enums";
import { CICType, IProfileAndConsolidations } from "../entities/IProfile";

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

export function isMemeLabContract(contract: string) {
  return contract.toUpperCase() === MEMELAB_CONTRACT.toUpperCase();
}

export const fetchMeta = async (uri: string) => {
  try {
    new URL(uri);
    const response = await fetch(uri);
    return await response.json();
  } catch {
    return null;
  }
};

export const fetchBlockTimestamp = async (provider: any, block: number) => {
  const blockEvent = await provider.getBlock(block);
  return blockEvent.timestamp * 1000;
};

export function getDaysDiff(t1: number, t2: number, floor = true) {
  const diff = t1 - t2;
  if (floor) {
    return Math.floor(diff / (1000 * 3600 * 24));
  }
  return Math.ceil(diff / (1000 * 3600 * 24));
}

export function fromGWEI(from: number) {
  return from / 1e18;
}

export function numberWithCommasFromString(x: string) {
  if (!/^\d+$/.test(x)) return x;
  if (isNaN(parseInt(x))) return x;
  return numberWithCommas(parseInt(x));
}

export function numberWithCommas(x: number) {
  if (x === null || x === 0 || isNaN(x)) return "-";
  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function formatNumberWithCommas(x: number) {
  if (x === null || isNaN(x)) return "-";
  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function getDateDisplay(date: Date) {
  const secondsAgo = (new Date().getTime() - date.getTime()) / 1000;
  if (60 > secondsAgo) {
    return `${Math.round(secondsAgo)} seconds ago`;
  }
  if (60 * 60 > secondsAgo) {
    return `${Math.round(secondsAgo / 60)} minutes ago`;
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
  return `${days} days ago`;
}

export function areEqualAddresses(w1: any, w2: any) {
  if (w1 && w2) {
    return w1.toUpperCase() === w2.toUpperCase();
  }
  return false;
}

export const fullScreenSupported = () => {
  const doc: any = document;
  const el: any = doc.body;
  const check =
    typeof el.requestFullscreen !== "undefined" ||
    typeof el.mozRequestFullScreen !== "undefined" ||
    typeof el.webkitRequestFullscreen !== "undefined" ||
    typeof el.msRequestFullscreen !== "undefined" ||
    typeof doc.exitFullscreen !== "undefined" ||
    typeof doc.mozCancelFullScreen !== "undefined" ||
    typeof doc.webkitExitFullscreen !== "undefined";

  return check;
};

export function enterArtFullScreen(elementId: string) {
  const element: any = document.getElementById(elementId);

  if (!element) return;

  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

export function nextTdh() {
  const now = new Date();
  const utcMidnight = new Date(now).setUTCHours(24, 0, 0, 0);

  var diffMS = utcMidnight / 1000 - now.getTime() / 1000;
  var diffHr = Math.floor(diffMS / 3600);
  diffMS = diffMS - diffHr * 3600;
  var diffMi = Math.floor(diffMS / 60);
  diffMS = diffMS - diffMi * 60;
  var diffS = Math.floor(diffMS);
  var result = diffHr < 10 ? "0" + diffHr : diffHr;
  result += ":" + (diffMi < 10 ? "0" + diffMi : diffMi);
  result += ":" + (diffS < 10 ? "0" + diffS : diffS);
  return result.toString();
}

export function splitArtists(artists: string) {
  const a = artists
    .split(" / ")
    .join(",")
    .split(", ")
    .join(",")
    .split(" and ")
    .join(",");
  return a;
}

export function removeProtocol(link: string) {
  if (!link) {
    return link;
  }

  return link.replace(/(^\w+:|^)\/\//, "");
}

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
  return chain_id === sepolia.id
    ? `https://sepolia.etherscan.io/tx/${hash}`
    : `https://etherscan.io/tx/${hash}`;
}

export async function getContentTypeFromURL(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("Content-Type");
    return contentType;
  } catch (error) {
    console.error("Error retrieving content type:", error);
    return null;
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
  const pattern =
    /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/g;
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

export function printMintDate(date: Date) {
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

export const scrollToDiv = (divRef: any, block: "start" | "end") => {
  if (divRef.current) {
    divRef.current.scrollIntoView({ behavior: "smooth", block });
  }
};

export const isDivInViewport = (divRef: any) => {
  if (divRef.current) {
    const rect = divRef.current.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }
  return false;
};

export function capitalizeEveryWord(input: string): string {
  return input
    .toLocaleLowerCase()
    .replace(/^(.)|\s+(.)/g, (match: string) => match.toUpperCase());
}

export const formatNumber = (num: number): string => {
  // For numbers less than 1000, return the number as is
  if (num < 1000) {
    return num.toString();
  }

  // For numbers between 1000 and 100,000, format with commas
  if (num < 100000) {
    return num.toLocaleString();
  }

  // For numbers 100,000 and above, format as 'K' for thousands
  if (num < 1000000) {
    return parseFloat((num / 1000).toFixed(1)).toString() + "K";
  }

  // For numbers 1 million and above, format as 'M' for millions
  return parseFloat((num / 1000000).toFixed(2)).toString() + "M";
};

export function displayDecimal(value: number, places: number) {
  if (0 >= value) {
    return "-";
  }

  const fixedValue = value.toFixed(places);
  return numberWithCommas(parseFloat(fixedValue)).toString();
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
    case DateIntervalsSelection.YESTERDAY:
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      filters += `&from_date=${formatDateFilterDate(yesterday)}`;
      filters += `&to_date=${formatDateFilterDate(yesterday)}`;
      break;
    case DateIntervalsSelection.LAST_7:
      const weekAgo = new Date();
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
      filters += `&from_date=${formatDateFilterDate(weekAgo)}`;
      break;
    case DateIntervalsSelection.THIS_MONTH:
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setUTCDate(1);
      filters += `&from_date=${formatDateFilterDate(firstDayOfMonth)}`;
      break;
    case DateIntervalsSelection.PREVIOUS_MONTH:
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
    case DateIntervalsSelection.YEAR_TO_DATE:
      const firstDayOfYear = new Date();
      firstDayOfYear.setUTCMonth(0);
      firstDayOfYear.setUTCDate(1);
      filters += `&from_date=${formatDateFilterDate(firstDayOfYear)}`;
      break;
    case DateIntervalsSelection.LAST_YEAR:
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
    case DateIntervalsSelection.CUSTOM:
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
}: {
  profile: IProfileAndConsolidations;
  address: string | undefined;
}): boolean =>
  profile.consolidation.wallets.some(
    (wallet) => wallet.wallet.address.toLowerCase() === address?.toLowerCase()
  );


    export const createPossessionStr = (name: string | null): string => {
      if (name) {
        const possession = name.endsWith("s") ? `${name}'` : `${name}'s`;
        return possession;
      }
      return "";
    };