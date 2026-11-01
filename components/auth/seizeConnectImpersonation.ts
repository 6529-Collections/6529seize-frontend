import { isDevLikeEnv } from "@/config/devAuth";
import { publicEnv } from "@/config/env";
import { getAgentLoginActiveAddress } from "@/services/auth/auth.utils";
import { getDevAuthTestOverride } from "@/services/auth/devAuthTestOverride";
import { getAddress, isAddress } from "viem";

const isPrivateIpv4Host = (hostname: string): boolean => {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return false;
  }

  const octets = parts.map(Number);
  if (
    octets.some(
      (octet, index) =>
        !Number.isInteger(octet) ||
        octet < 0 ||
        octet > 255 ||
        String(octet) !== parts[index]
    )
  ) {
    return false;
  }

  const first = octets[0];
  const second = octets[1];

  if (first === undefined || second === undefined) {
    return false;
  }

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

const isLocalDevelopmentHost = (hostname: string): boolean =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname.endsWith(".local") ||
  isPrivateIpv4Host(hostname);

export const getSeizeConnectImpersonation = () => {
  const devLikeEnv = isDevLikeEnv();
  const isLocalHost =
    globalThis.window !== undefined &&
    isLocalDevelopmentHost(globalThis.window.location.hostname);
  // Local multi-user browser tests may give each browser its own dev wallet;
  // the override is inert outside dev auth on localhost.
  const devAuthWallet =
    getDevAuthTestOverride()?.wallet ?? publicEnv.DEV_MODE_WALLET_ADDRESS;
  const devAuthImpersonatedAddress =
    devLikeEnv &&
    isLocalHost &&
    publicEnv.USE_DEV_AUTH === "true" &&
    devAuthWallet &&
    isAddress(devAuthWallet)
      ? getAddress(devAuthWallet)
      : undefined;
  const canUseAgentLoginImpersonation =
    devLikeEnv && isLocalHost && publicEnv.USE_DEV_AUTH !== "true";
  const agentLoginActiveAddress = canUseAgentLoginImpersonation
    ? getAgentLoginActiveAddress()
    : null;
  const agentLoginImpersonatedAddress =
    agentLoginActiveAddress && isAddress(agentLoginActiveAddress)
      ? getAddress(agentLoginActiveAddress)
      : undefined;

  return {
    agentLoginImpersonatedAddress,
    impersonatedAddress:
      agentLoginImpersonatedAddress ?? devAuthImpersonatedAddress,
  };
};
