import { sepolia } from "wagmi/chains";
import { GRADIENT_CONTRACT, MEMES_CONTRACT } from "../constants";
import { BaseNFT, VolumeType } from "../entities/INFT";

export function formatAddress(address: string) {
  if (!address || !address.startsWith("0x") || address.includes(" ")) {
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
  return contract.toUpperCase() == MEMES_CONTRACT.toUpperCase();
}

export function isGradientsContract(contract: string) {
  return contract.toUpperCase() == GRADIENT_CONTRACT.toUpperCase();
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

export function numberWithCommas(x: number) {
  if (x == null || x == 0 || isNaN(x)) return "-";
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
  return chain_id == sepolia.id
    ? `https://sepolia.etherscan.io/tx/${hash}`
    : `https://etherscan.io/tx/${hash}`;
}
