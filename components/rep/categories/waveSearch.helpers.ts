import {
  getMessageIdFromPathname,
  getWaveIdFromPathname,
} from "@/helpers/navigation.helpers";
import { parseSeizeWaveLink } from "@/helpers/SeizeLinkParser";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function getCurrentOrigin(): string {
  if (
    typeof globalThis === "object" &&
    "location" in globalThis &&
    typeof globalThis.location?.origin === "string"
  ) {
    return globalThis.location.origin;
  }
  return "https://6529.io";
}

function sanitizeWaveId(value: string | null): string | null {
  let trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  while (trimmed.endsWith("/")) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed || null;
}

export function parseWaveIdFromRepCategoryInput(input: string): string | null {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return null;
  }

  const strictWaveId = parseSeizeWaveLink(trimmedInput);
  if (strictWaveId) {
    return strictWaveId;
  }

  if (UUID_REGEX.test(trimmedInput)) {
    return trimmedInput;
  }

  try {
    const url = new URL(trimmedInput, getCurrentOrigin());
    const waveIdFromPath =
      getWaveIdFromPathname(url.pathname) ??
      getMessageIdFromPathname(url.pathname);
    if (waveIdFromPath) {
      return sanitizeWaveId(waveIdFromPath);
    }

    if (url.pathname === "/waves") {
      return sanitizeWaveId(url.searchParams.get("wave"));
    }
  } catch {
    return null;
  }

  return null;
}
